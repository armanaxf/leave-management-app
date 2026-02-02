// Leave Management App - Manager Approvals Page

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import type { LeaveRequest, LeaveType, ConflictSeverity } from '@/types';

// Mock data
const mockLeaveTypes: LeaveType[] = [
    { id: '1', name: 'Annual Leave', code: 'AL', color: '#3B82F6', icon: 'sun', requiresApproval: true, maxDaysPerRequest: null, isActive: true, sortOrder: 1 },
    { id: '2', name: 'Sick Leave', code: 'SL', color: '#EF4444', icon: 'thermometer', requiresApproval: false, maxDaysPerRequest: 5, isActive: true, sortOrder: 2 },
    { id: '3', name: 'Personal Leave', code: 'PL', color: '#8B5CF6', icon: 'user', requiresApproval: true, maxDaysPerRequest: 3, isActive: true, sortOrder: 3 },
];

const mockPendingRequests: (LeaveRequest & { conflictSeverity?: ConflictSeverity })[] = [
    {
        id: '1',
        employeeId: 'emp1',
        employeeEmail: 'sarah@example.com',
        employeeName: 'Sarah Wilson',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-14'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 5,
        reason: 'Family vacation',
        status: 'pending',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
        conflictSeverity: 'high',
    },
    {
        id: '2',
        employeeId: 'emp2',
        employeeEmail: 'james@example.com',
        employeeName: 'James Chen',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-03-20'),
        endDate: new Date('2026-03-21'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 2,
        reason: 'Personal appointment',
        status: 'pending',
        createdAt: new Date('2026-02-02'),
        updatedAt: new Date('2026-02-02'),
        conflictSeverity: 'medium',
    },
    {
        id: '3',
        employeeId: 'emp3',
        employeeEmail: 'emma@example.com',
        employeeName: 'Emma Thompson',
        leaveTypeId: '3',
        leaveType: mockLeaveTypes[2],
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-02-15'),
        halfDayStart: true,
        halfDayEnd: false,
        totalDays: 0.5,
        status: 'pending',
        createdAt: new Date('2026-02-02'),
        updatedAt: new Date('2026-02-02'),
    },
];

const mockProcessedRequests: LeaveRequest[] = [
    {
        id: '4',
        employeeId: 'emp1',
        employeeEmail: 'sarah@example.com',
        employeeName: 'Sarah Wilson',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-01-17'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 3,
        status: 'approved',
        approverId: 'manager1',
        approverName: 'You',
        approvedAt: new Date('2026-01-10'),
        createdAt: new Date('2026-01-08'),
        updatedAt: new Date('2026-01-10'),
    },
    {
        id: '5',
        employeeId: 'emp2',
        employeeEmail: 'james@example.com',
        employeeName: 'James Chen',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-25'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 6,
        reason: 'Conference attendance',
        status: 'rejected',
        approverId: 'manager1',
        approverName: 'You',
        approverComments: 'Team is already at reduced capacity during this period. Please choose alternative dates.',
        approvedAt: new Date('2026-01-10'),
        createdAt: new Date('2026-01-05'),
        updatedAt: new Date('2026-01-10'),
    },
];

// Container animation
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export default function Approvals() {
    const [activeTab, setActiveTab] = useState('pending');
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    // Filter pending requests
    const filteredPending = useMemo(() => {
        if (filterType === 'all') return mockPendingRequests;
        if (filterType === 'conflicts') return mockPendingRequests.filter(r => r.conflictSeverity && r.conflictSeverity !== 'low');
        return mockPendingRequests.filter(r => r.leaveTypeId === filterType);
    }, [filterType]);

    // Handle approve
    const handleApprove = async (id: string) => {
        setProcessing(id);
        await new Promise(resolve => setTimeout(resolve, 800));
        setProcessing(null);
        console.log('Approved:', id);
        // Would remove from list and show toast
    };

    // Handle reject
    const handleRejectClick = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setRejectComment('');
        setRejectDialogOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedRequest) return;
        setProcessing(selectedRequest.id);
        await new Promise(resolve => setTimeout(resolve, 800));
        setProcessing(null);
        setRejectDialogOpen(false);
        console.log('Rejected:', selectedRequest.id, 'Comment:', rejectComment);
        // Would remove from list and show toast
    };

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                        Approvals
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review and manage leave requests from your team
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {mockPendingRequests.length} pending
                    </span>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="pending" className="gap-2">
                            Pending
                            {mockPendingRequests.length > 0 && (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                    {mockPendingRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="processed">Processed</TabsTrigger>
                    </TabsList>

                    {activeTab === 'pending' && (
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Requests</SelectItem>
                                <SelectItem value="conflicts">
                                    <span className="flex items-center gap-2">
                                        With Conflicts
                                        <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                                            {mockPendingRequests.filter(r => r.conflictSeverity && r.conflictSeverity !== 'low').length}
                                        </span>
                                    </span>
                                </SelectItem>
                                {mockLeaveTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>
                                        <span className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
                                            {type.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <TabsContent value="pending" className="mt-4">
                    {filteredPending.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Check className="mx-auto h-12 w-12 text-success/50" />
                            <p className="mt-2 text-muted-foreground">No pending requests</p>
                        </Card>
                    ) : (
                        <motion.div
                            className="space-y-3"
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {filteredPending.map((request) => (
                                <motion.div key={request.id} variants={item}>
                                    <LeaveRequestCard
                                        request={request}
                                        showEmployee
                                        showActions
                                        conflictSeverity={request.conflictSeverity}
                                        onApprove={handleApprove}
                                        onReject={() => handleRejectClick(request)}
                                        className={processing === request.id ? 'opacity-50 pointer-events-none' : ''}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="processed" className="mt-4">
                    {mockProcessedRequests.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">No processed requests yet</p>
                        </Card>
                    ) : (
                        <motion.div
                            className="space-y-3"
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {mockProcessedRequests.map((request) => (
                                <motion.div key={request.id} variants={item}>
                                    <LeaveRequestCard request={request} showEmployee />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject {selectedRequest?.employeeName}'s leave request?
                            You can provide a reason to help them understand.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="rejectComment">Reason (optional)</Label>
                        <Textarea
                            id="rejectComment"
                            placeholder="Add a comment explaining why this request was rejected..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRejectConfirm}>
                            <X className="mr-2 h-4 w-4" />
                            Reject Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
