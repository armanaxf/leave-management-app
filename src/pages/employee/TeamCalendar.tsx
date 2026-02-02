// Leave Management App - Team Calendar Page

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveCalendar } from '@/components/calendar/LeaveCalendar';
import { UserAvatar } from "@/components/layout/UserAvatar";
import { format, isSameDay } from 'date-fns';
import { Users, Calendar as CalendarIcon } from 'lucide-react';
import type { LeaveRequest, LeaveType, PublicHoliday, TeamMember } from '@/types';

// Mock Data
const mockPublicHolidays: PublicHoliday[] = [
    { id: '1', name: 'New Year Day', date: new Date('2026-01-01'), region: 'UK', isRecurring: true },
    { id: '2', name: 'Good Friday', date: new Date('2026-04-03'), region: 'UK', isRecurring: false },
    { id: '3', name: 'Easter Monday', date: new Date('2026-04-06'), region: 'UK', isRecurring: false },
    { id: '4', name: 'May Day', date: new Date('2026-05-04'), region: 'UK', isRecurring: true },
];

const mockLeaveTypes: LeaveType[] = [
    { id: '1', name: 'Annual Leave', code: 'AL', color: '#3B82F6', icon: 'sun', requiresApproval: true, maxDaysPerRequest: null, isActive: true, sortOrder: 1 },
    { id: '2', name: 'Sick Leave', code: 'SL', color: '#EF4444', icon: 'thermometer', requiresApproval: false, maxDaysPerRequest: 5, isActive: true, sortOrder: 2 },
    { id: '3', name: 'Personal Leave', code: 'PL', color: '#8B5CF6', icon: 'user', requiresApproval: true, maxDaysPerRequest: 3, isActive: true, sortOrder: 3 },
];

const mockTeamRequests: LeaveRequest[] = [
    {
        id: '1',
        employeeId: 'emp1',
        employeeName: 'Sarah Wilson',
        employeeEmail: 'sarah@example.com',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-14'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 5,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        approverId: 'manager1',
        approverName: 'You'
    },
    {
        id: '2',
        employeeId: 'emp2',
        employeeName: 'James Chen',
        employeeEmail: 'james@example.com',
        leaveTypeId: '2',
        leaveType: mockLeaveTypes[1], // Sick
        startDate: new Date('2026-03-12'),
        endDate: new Date('2026-03-13'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 2,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        approverId: 'manager1',
        approverName: 'You'
    },
    {
        id: '3',
        employeeId: 'emp3',
        employeeName: 'Emma Thompson',
        employeeEmail: 'emma@example.com',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-03-23'),
        endDate: new Date('2026-03-27'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 5,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        approverId: 'manager1',
        approverName: 'You'
    },
];

const mockTeamMembers: TeamMember[] = [
    {
        id: 'emp1',
        displayName: 'Sarah Wilson',
        email: 'sarah@example.com',
        isManager: false,
        isAdmin: false,
        currentStatus: 'available'
    },
    {
        id: 'emp2',
        displayName: 'James Chen',
        email: 'james@example.com',
        isManager: false,
        isAdmin: false,
        currentStatus: 'available'
    },
    {
        id: 'emp3',
        displayName: 'Emma Thompson',
        email: 'emma@example.com',
        isManager: false,
        isAdmin: false,
        currentStatus: 'available'
    },
    {
        id: 'manager1',
        displayName: 'You',
        email: 'you@example.com',
        isManager: true,
        isAdmin: false,
        currentStatus: 'available'
    },
];

export default function TeamCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    // Filter requests for selected date
    const selectedDateRequests = selectedDate
        ? mockTeamRequests.filter(req => {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return selectedDate >= start && selectedDate <= end;
        })
        : [];

    const selectedHoliday = selectedDate
        ? mockPublicHolidays.find(h => isSameDay(new Date(h.date), selectedDate))
        : undefined;

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                        Team Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        See who's out and plan ahead
                    </p>
                </div>

                {/* Team Avatars Summary */}
                <div className="flex items-center -space-x-2">
                    {mockTeamMembers.map(member => (
                        <UserAvatar
                            key={member.id}
                            name={member.displayName}
                            className="border-2 border-background w-8 h-8"
                        />
                    ))}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] font-medium border-2 border-background">
                        +2
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Calendar - Span 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <LeaveCalendar
                        requests={mockTeamRequests}
                        publicHolidays={mockPublicHolidays}
                        onDateClick={setSelectedDate}
                        className="min-h-[500px]"
                    />

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-card p-4 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-success"></span>
                            Public Holiday
                        </div>
                        {mockLeaveTypes.map(type => (
                            <div key={type.id} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full opacity-20" style={{ backgroundColor: type.color }}></span>
                                <span style={{ color: type.color }} className="font-medium">{type.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar - Selected Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                {selectedDate ? format(selectedDate, 'EEEE, d MMMM') : 'Select a date'}
                            </CardTitle>
                            <CardDescription>
                                {selectedDate ? 'Leave details for this day' : 'Click on the calendar to view details'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedHoliday && (
                                <div className="p-3 bg-success/10 text-success rounded-md flex items-center gap-2 text-sm font-medium">
                                    <span className="text-xl">🎉</span>
                                    {selectedHoliday.name}
                                </div>
                            )}

                            {selectedDate && selectedDateRequests.length === 0 && !selectedHoliday && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Everyone is available</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {selectedDateRequests.map(req => (
                                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <UserAvatar name={req.employeeName || 'Unknown'} size="sm" />
                                        <div>
                                            <p className="text-sm font-medium leading-none mb-1">{req.employeeName}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.leaveType?.color }}></span>
                                                {req.leaveType?.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Team Leave */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-muted-foreground font-medium uppercase tracking-wider text-xs">
                                Upcoming - Next 14 Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockTeamRequests
                                .filter(r => new Date(r.startDate) > new Date())
                                .slice(0, 3)
                                .map(req => (
                                    <div key={req.id} className="flex items-start gap-3">
                                        <UserAvatar name={req.employeeName || ''} size="sm" className="mt-0.5" />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium block">{req.employeeName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(req.startDate, 'MMM d')} - {format(req.endDate, 'MMM d')}
                                            </span>
                                        </div>
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded font-medium border"
                                            style={{
                                                color: req.leaveType?.color,
                                                borderColor: `${req.leaveType?.color}40`,
                                                backgroundColor: `${req.leaveType?.color}10`
                                            }}
                                        >
                                            {req.leaveType?.name}
                                        </span>
                                    </div>
                                ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
