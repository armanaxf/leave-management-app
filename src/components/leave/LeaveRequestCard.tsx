// Leave Management App - Leave Request Card Component

import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    Check,
    X,
    AlertCircle,
    MoreHorizontal,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConflictBadge } from '@/components/leave/ConflictWarning';
import type { LeaveRequest, LeaveStatus, ConflictSeverity } from '@/types';

interface LeaveRequestCardProps {
    /** Leave request data */
    request: LeaveRequest;
    /** Show employee info (for manager view) */
    showEmployee?: boolean;
    /** Show action buttons (approve/reject for managers) */
    showActions?: boolean;
    /** Conflict severity for this request (for manager view) */
    conflictSeverity?: ConflictSeverity;
    /** Callback when approved */
    onApprove?: (id: string) => void;
    /** Callback when rejected */
    onReject?: (id: string) => void;
    /** Callback when cancelled */
    onCancel?: (id: string) => void;
    /** Callback when clicked */
    onClick?: (request: LeaveRequest) => void;
    /** Additional class names */
    className?: string;
}

const statusConfig: Record<
    LeaveStatus,
    { label: string; icon: typeof Check; color: string; bg: string }
> = {
    pending: {
        label: 'Pending',
        icon: Clock,
        color: 'text-warning',
        bg: 'bg-warning/10',
    },
    approved: {
        label: 'Approved',
        icon: Check,
        color: 'text-success',
        bg: 'bg-success/10',
    },
    rejected: {
        label: 'Rejected',
        icon: X,
        color: 'text-destructive',
        bg: 'bg-destructive/10',
    },
    cancelled: {
        label: 'Cancelled',
        icon: AlertCircle,
        color: 'text-muted-foreground',
        bg: 'bg-muted',
    },
};

export function LeaveRequestCard({
    request,
    showEmployee = false,
    showActions = false,
    conflictSeverity,
    onApprove,
    onReject,
    onCancel,
    onClick,
    className,
}: LeaveRequestCardProps) {
    const status = statusConfig[request.status];
    const StatusIcon = status.icon;
    const leaveTypeColor = request.leaveType?.color || 'var(--primary)';

    const dateRange =
        differenceInDays(request.endDate, request.startDate) === 0
            ? format(request.startDate, 'EEE, d MMM yyyy')
            : `${format(request.startDate, 'EEE, d MMM')} → ${format(request.endDate, 'EEE, d MMM yyyy')}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'group relative rounded-lg border bg-card p-4 shadow-sm transition-all',
                onClick && 'cursor-pointer hover:shadow-md hover:border-primary/20',
                // Add border highlight for conflicts
                conflictSeverity === 'high' && 'border-destructive/40',
                conflictSeverity === 'medium' && 'border-warning/40',
                className
            )}
            onClick={() => onClick?.(request)}
        >
            {/* Leave type color bar */}
            <div
                className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                style={{ backgroundColor: leaveTypeColor }}
            />

            <div className="flex items-start gap-4 pl-3">
                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {/* Header: Employee name (if shown), leave type, and conflict badge */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {showEmployee && request.employeeName && (
                            <>
                                <span className="font-display font-semibold text-foreground truncate">
                                    {request.employeeName}
                                </span>
                                <span className="text-muted-foreground">·</span>
                            </>
                        )}
                        <span
                            className="text-sm font-medium"
                            style={{ color: leaveTypeColor }}
                        >
                            {request.leaveType?.name || 'Leave'}
                        </span>
                        {/* Conflict badge - integrated into header */}
                        {conflictSeverity && conflictSeverity !== 'low' && (
                            <ConflictBadge
                                severity={conflictSeverity}
                                message={
                                    conflictSeverity === 'high'
                                        ? 'Critical: >50% team off'
                                        : 'Warning: Team overlap'
                                }
                            />
                        )}
                    </div>

                    {/* Date range */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{dateRange}</span>
                        {(request.halfDayStart || request.halfDayEnd) && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                Half day
                            </span>
                        )}
                    </div>

                    {/* Days count */}
                    <div className="mt-1 text-sm font-medium text-foreground">
                        {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
                    </div>

                    {/* Reason (if any) */}
                    {request.reason && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {request.reason}
                        </p>
                    )}

                    {/* Approver comments (if rejected) */}
                    {request.approverComments && request.status === 'rejected' && (
                        <div className="mt-2 flex items-start gap-1.5 text-sm text-destructive/80">
                            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{request.approverComments}</span>
                        </div>
                    )}
                </div>

                {/* Status badge and actions */}
                <div className="flex flex-col items-end gap-2">
                    {/* Status badge */}
                    <div
                        className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            status.bg,
                            status.color
                        )}
                    >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </div>

                    {/* Actions */}
                    {showActions && request.status === 'pending' && (
                        <div className="flex items-center gap-1">
                            {onApprove && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApprove(request.id);
                                    }}
                                    aria-label="Approve request"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                            {onReject && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReject(request.id);
                                    }}
                                    aria-label="Reject request"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* More actions menu for own requests */}
                    {!showActions && request.status === 'pending' && onCancel && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="More options"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onCancel(request.id)}
                                >
                                    Cancel request
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
