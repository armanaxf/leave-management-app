// Leave Management App - My Requests Page

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import { useLeaveRequests, useLeaveTypes, useDeleteLeaveRequest } from '@/hooks';
import { useUserStore } from '@/stores';
import type { LeaveRequest, LeaveStatus } from '@/types';

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
    const { currentUser } = useUserStore();

    // Fetch data using hooks
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();
    const { data: requests, isLoading: requestsLoading } = useLeaveRequests({
        employeeId: currentUser?.id
    });
    const cancelMutation = useDeleteLeaveRequest();

    const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all');
    const [filterType, setFilterType] = useState<string>('all');

    const isLoading = typesLoading || requestsLoading;

    // Filter requests
    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        return requests.filter((r) => {
            if (filterStatus !== 'all' && r.status !== filterStatus) return false;
            if (filterType !== 'all' && r.leaveTypeId !== filterType) return false;
            return true;
        });
    }, [requests, filterStatus, filterType]);

    // Group by year, sorted descending
    const groupedByYear = groupByYear(filteredRequests);
    const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

    // Handle cancel
    const handleCancel = async (id: string) => {
        try {
            await cancelMutation.mutateAsync(id);
        } catch (error) {
            console.error('Failed to cancel request:', error);
        }
    };

    // Summary stats
    const stats = useMemo(() => ({
        pending: requests?.filter((r) => r.status === 'pending').length || 0,
        approved: requests?.filter((r) => r.status === 'approved').length || 0,
        total: requests?.reduce((sum, r) => sum + r.totalDays, 0) || 0,
    }), [requests]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
                            {leaveTypes?.map((type) => (
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
                                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
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
