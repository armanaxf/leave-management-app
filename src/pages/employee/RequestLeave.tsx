// Leave Management App - Request Leave Page

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isWeekend } from 'date-fns';
import { CalendarDays, Clock, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ConflictWarning } from '@/components/leave/ConflictWarning';
import { cn } from '@/lib/utils';
import { useLeaveTypes, useCreateLeaveRequest } from '@/hooks';
import { useUserStore } from '@/stores';
import type { ConflictAnalysis, LeaveRequest } from '@/types';

// Mock conflict analysis function (will be replaced with AI service later)
function analyzeConflicts(
    startDate: Date | undefined,
    endDate: Date | undefined
): ConflictAnalysis | null {
    if (!startDate || !endDate) return null;

    // Mock: 30% chance of medium conflict, 10% chance of high conflict
    const rand = Math.random();
    if (rand > 0.6) {
        const mockRequest: LeaveRequest = {
            id: 'mock1',
            employeeId: 'emp1',
            employeeEmail: 'sarah@example.com',
            employeeName: 'Sarah Wilson',
            leaveTypeId: '1',
            startDate: startDate,
            endDate: addDays(startDate, 2),
            halfDayStart: false,
            halfDayEnd: false,
            totalDays: 3,
            status: 'approved',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return {
            hasConflict: true,
            severity: rand > 0.9 ? 'high' : 'medium',
            overlappingRequests: [
                mockRequest,
                { ...mockRequest, id: 'mock2', employeeName: 'James Chen', employeeEmail: 'james@example.com' },
            ],
            teamCoveragePercent: rand > 0.9 ? 60 : 35,
            message:
                rand > 0.9
                    ? 'Critical: More than 50% of your team will be unavailable during this period.'
                    : '2 team members already have approved leave during this period.',
            suggestions:
                rand > 0.9
                    ? ['Consider adjusting your dates', 'Check with your manager before submitting']
                    : undefined,
        };
    }

    return { hasConflict: false, severity: 'low', overlappingRequests: [], teamCoveragePercent: 0, message: '' };
}

// Calculate working days between dates
function calculateWorkingDays(start: Date, end: Date, halfStart: boolean, halfEnd: boolean): number {
    let days = 0;
    let current = new Date(start);

    while (current <= end) {
        if (!isWeekend(current)) {
            days += 1;
        }
        current = addDays(current, 1);
    }

    // Adjust for half days
    if (halfStart && days > 0) days -= 0.5;
    if (halfEnd && days > 0) days -= 0.5;

    return Math.max(0, days);
}

export default function RequestLeave() {
    const navigate = useNavigate();
    const { currentUser } = useUserStore();

    // Fetch leave types from Dataverse
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();
    const createRequest = useCreateLeaveRequest();

    // Form state
    const [leaveTypeId, setLeaveTypeId] = useState<string>('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [halfDayStart, setHalfDayStart] = useState(false);
    const [halfDayEnd, setHalfDayEnd] = useState(false);
    const [reason, setReason] = useState('');
    const [conflictDismissed, setConflictDismissed] = useState(false);

    // Selected leave type
    const selectedLeaveType = leaveTypes?.find((t) => t.id === leaveTypeId);

    // Calculate total days
    const totalDays = useMemo(() => {
        if (!startDate || !endDate) return 0;
        return calculateWorkingDays(startDate, endDate, halfDayStart, halfDayEnd);
    }, [startDate, endDate, halfDayStart, halfDayEnd]);

    // Check for conflicts when dates change
    const conflictAnalysis = useMemo(() => {
        if (conflictDismissed) return null;
        return analyzeConflicts(startDate, endDate);
    }, [startDate, endDate, conflictDismissed]);

    // Form validation
    const isValid = leaveTypeId && startDate && endDate && totalDays > 0;

    // Handle submit
    const handleSubmit = async () => {
        if (!isValid || !currentUser || !startDate || !endDate) return;

        try {
            await createRequest.mutateAsync({
                request: {
                    leaveTypeId,
                    startDate,
                    endDate,
                    halfDayStart,
                    halfDayEnd,
                    reason: reason || undefined,
                },
                employeeId: currentUser.id,
            });

            // Navigate to requests page on success
            navigate('/requests');
        } catch (error) {
            console.error('Failed to create leave request:', error);
        }
    };

    if (typesLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                    Request Leave
                </h1>
                <p className="text-sm text-muted-foreground">
                    Submit a new leave request for approval
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Leave Details</CardTitle>
                        <CardDescription>Fill in the details for your leave request</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Leave Type */}
                        <div className="space-y-2">
                            <Label htmlFor="leaveType">Leave Type</Label>
                            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                                <SelectTrigger id="leaveType">
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes?.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: type.color }}
                                                />
                                                {type.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Start Date */}
                            <div className="space-y-2">
                                <Label id="startDateLabel">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !startDate && 'text-muted-foreground'
                                            )}
                                            aria-labelledby="startDateLabel"
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                                            {startDate ? format(startDate, 'EEE, d MMM yyyy') : 'Select date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={(date) => {
                                                setStartDate(date);
                                                setConflictDismissed(false);
                                                // Auto-set end date if not set or if before start
                                                if (!endDate || (date && endDate < date)) {
                                                    setEndDate(date);
                                                }
                                            }}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="halfDayStart"
                                        checked={halfDayStart}
                                        onCheckedChange={(checked) => setHalfDayStart(checked === true)}
                                    />
                                    <label
                                        htmlFor="halfDayStart"
                                        className="text-sm text-muted-foreground cursor-pointer"
                                    >
                                        Half day (afternoon only)
                                    </label>
                                </div>
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <Label id="endDateLabel">End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !endDate && 'text-muted-foreground'
                                            )}
                                            aria-labelledby="endDateLabel"
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                                            {endDate ? format(endDate, 'EEE, d MMM yyyy') : 'Select date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={(date) => {
                                                setEndDate(date);
                                                setConflictDismissed(false);
                                            }}
                                            disabled={(date) => date < (startDate || new Date())}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="halfDayEnd"
                                        checked={halfDayEnd}
                                        onCheckedChange={(checked) => setHalfDayEnd(checked === true)}
                                    />
                                    <label
                                        htmlFor="halfDayEnd"
                                        className="text-sm text-muted-foreground cursor-pointer"
                                    >
                                        Half day (morning only)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Conflict Warning */}
                        <AnimatePresence>
                            {conflictAnalysis?.hasConflict && (
                                <ConflictWarning
                                    analysis={conflictAnalysis}
                                    onDismiss={() => setConflictDismissed(true)}
                                />
                            )}
                        </AnimatePresence>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Add any notes for your manager..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <Button variant="ghost" asChild>
                                <Link to="/">Cancel</Link>
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!isValid || createRequest.isPending}
                                className="min-w-[120px]"
                            >
                                {createRequest.isPending ? (
                                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Request Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Leave type */}
                            {selectedLeaveType && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Type</span>
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: selectedLeaveType.color }}
                                    >
                                        {selectedLeaveType.name}
                                    </span>
                                </div>
                            )}

                            {/* Dates */}
                            {startDate && endDate && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Dates</span>
                                    <span className="text-sm font-medium">
                                        {format(startDate, 'd MMM')}
                                        {startDate.getTime() !== endDate.getTime() && ` - ${format(endDate, 'd MMM')}`}
                                    </span>
                                </div>
                            )}

                            {/* Total days */}
                            <div className="flex items-center justify-between border-t pt-4">
                                <span className="text-sm text-muted-foreground">Total Days</span>
                                <span className="text-2xl font-display font-bold text-foreground">
                                    {totalDays || '—'}
                                </span>
                            </div>

                            {/* Half day indicators */}
                            {(halfDayStart || halfDayEnd) && (
                                <div className="text-xs text-muted-foreground">
                                    {halfDayStart && <span>• Starts afternoon</span>}
                                    {halfDayStart && halfDayEnd && <br />}
                                    {halfDayEnd && <span>• Ends morning</span>}
                                </div>
                            )}

                            {/* Warning for high conflict */}
                            {conflictAnalysis?.severity === 'high' && !conflictDismissed && (
                                <div className="flex items-center gap-2 text-xs text-destructive">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>Critical team conflict</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Approval info */}
                    {selectedLeaveType && (
                        <Card>
                            <CardContent className="pt-4 text-sm text-muted-foreground">
                                {selectedLeaveType.requiresApproval ? (
                                    <p>
                                        This request will be sent to your manager for approval.
                                    </p>
                                ) : (
                                    <p>
                                        This leave type is automatically approved.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
