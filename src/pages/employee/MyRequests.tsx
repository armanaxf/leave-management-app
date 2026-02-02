// Leave Management App - My Requests Page

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import type { LeaveRequest, LeaveType, LeaveStatus } from '@/types';

// Mock data
const mockLeaveTypes: LeaveType[] = [
    { id: '1', name: 'Annual Leave', code: 'AL', color: '#3B82F6', icon: 'sun', requiresApproval: true, maxDaysPerRequest: null, isActive: true, sortOrder: 1 },
    { id: '2', name: 'Sick Leave', code: 'SL', color: '#EF4444', icon: 'thermometer', requiresApproval: false, maxDaysPerRequest: 5, isActive: true, sortOrder: 2 },
    { id: '3', name: 'Personal Leave', code: 'PL', color: '#8B5CF6', icon: 'user', requiresApproval: true, maxDaysPerRequest: 3, isActive: true, sortOrder: 3 },
];

const mockRequests: LeaveRequest[] = [
    {
        id: '1',
        employeeId: 'me',
        employeeEmail: 'me@example.com',
        employeeName: 'Me',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-14'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 5,
        reason: 'Family vacation to Cornwall',
        status: 'pending',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
    },
    {
        id: '2',
        employeeId: 'me',
        employeeEmail: 'me@example.com',
        employeeName: 'Me',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-01-17'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 3,
        reason: 'Long weekend trip',
        status: 'approved',
        approverId: 'manager1',
        approverName: 'Alex Thompson',
        approvedAt: new Date('2026-01-10'),
        createdAt: new Date('2026-01-08'),
        updatedAt: new Date('2026-01-10'),
    },
    {
        id: '3',
        employeeId: 'me',
        employeeEmail: 'me@example.com',
        employeeName: 'Me',
        leaveTypeId: '2',
        leaveType: mockLeaveTypes[1],
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-20'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 1,
        reason: 'Feeling unwell',
        status: 'approved',
        approverId: 'manager1',
        approverName: 'Alex Thompson',
        approvedAt: new Date('2026-01-20'),
        createdAt: new Date('2026-01-20'),
        updatedAt: new Date('2026-01-20'),
    },
    {
        id: '4',
        employeeId: 'me',
        employeeEmail: 'me@example.com',
        employeeName: 'Me',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2025-12-23'),
        endDate: new Date('2025-12-31'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 6,
        reason: 'Christmas holidays',
        status: 'approved',
        approverId: 'manager1',
        approverName: 'Alex Thompson',
        approvedAt: new Date('2025-12-01'),
        createdAt: new Date('2025-11-15'),
        updatedAt: new Date('2025-12-01'),
    },
    {
        id: '5',
        employeeId: 'me',
        employeeEmail: 'me@example.com',
        employeeName: 'Me',
        leaveTypeId: '3',
        leaveType: mockLeaveTypes[2],
        startDate: new Date('2026-02-20'),
        endDate: new Date('2026-02-20'),
        halfDayStart: true,
        halfDayEnd: false,
        totalDays: 0.5,
        status: 'cancelled',
        createdAt: new Date('2026-02-10'),
        updatedAt: new Date('2026-02-12'),
    },
];

// Animation variants
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

// Group requests by year
function groupByYear(requests: LeaveRequest[]): Record<string, LeaveRequest[]> {
    return requests.reduce((acc, request) => {
        const year = format(request.startDate, 'yyyy');
        if (!acc[year]) acc[year] = [];
        acc[year].push(request);
        return acc;
    }, {} as Record<string, LeaveRequest[]>);
}

export default function MyRequests() {
    const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Filter requests
    const filteredRequests = mockRequests.filter((r) => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (filterType !== 'all' && r.leaveTypeId !== filterType) return false;
        return true;
    });

    // Group by year, sorted descending
    const groupedByYear = groupByYear(filteredRequests);
    const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

    // Handle cancel
    const handleCancel = async (id: string) => {
        console.log('Cancelling:', id);
        // Would call API and update state
    };

    // Summary stats
    const stats = {
        pending: mockRequests.filter((r) => r.status === 'pending').length,
        approved: mockRequests.filter((r) => r.status === 'approved').length,
        total: mockRequests.reduce((sum, r) => sum + r.totalDays, 0),
    };

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                        My Requests
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View and manage your leave request history
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as LeaveStatus | 'all')}>
                        <SelectTrigger className="w-[140px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Leave type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {mockLeaveTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
                                        {type.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-display font-bold text-warning">{stats.pending}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Approved This Year</p>
                    <p className="text-2xl font-display font-bold text-success">{stats.approved}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Total Days Requested</p>
                    <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
                </Card>
            </div>

            {/* Request list by year */}
            {years.length === 0 ? (
                <Card className="p-8 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No requests found</p>
                    <Button asChild className="mt-4">
                        <a href="/request">Request Leave</a>
                    </Button>
                </Card>
            ) : (
                <div className="space-y-6">
                    {years.map((year) => (
                        <div key={year}>
                            <h2 className="mb-3 text-sm font-medium text-muted-foreground">{year}</h2>
                            <motion.div
                                className="space-y-3"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {groupedByYear[year]
                                    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                                    .map((request) => (
                                        <motion.div key={request.id} variants={item}>
                                            <LeaveRequestCard
                                                request={request}
                                                onCancel={request.status === 'pending' ? handleCancel : undefined}
                                            />
                                        </motion.div>
                                    ))}
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
