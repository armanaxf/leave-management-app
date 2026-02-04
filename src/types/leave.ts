// Leave Management App - Core Types

/**
 * Status of a leave request
 */
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/**
 * Severity levels for conflict detection
 */
export type ConflictSeverity = 'low' | 'medium' | 'high';

/**
 * Leave type entity
 */
export interface LeaveType {
    id: string;
    name: string;
    code: string;
    color: string;
    icon: string;
    requiresApproval: boolean;
    maxDaysPerRequest: number | null;
    isActive: boolean;
    sortOrder: number;
}

/**
 * Leave request entity
 */
export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeEmail: string;
    employeeName?: string;
    leaveTypeId: string;
    leaveType?: LeaveType;
    startDate: Date;
    endDate: Date;
    halfDayStart: boolean;
    halfDayEnd: boolean;
    totalDays: number;
    reason?: string;
    status: LeaveStatus;
    approverId?: string;
    approverName?: string;
    approverComments?: string;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Leave balance entity
 */
export interface LeaveBalance {
    id: string;
    employeeId: string;
    employeeName?: string;
    leaveTypeId: string;
    leaveTypeCode?: string;
    leaveType?: LeaveType;
    year: number;
    entitlement: number;
    used: number;
    pending: number;
    carryOver: number;
    /** Calculated: entitlement + carryOver - used - pending */
    available: number;
}

/**
 * Public holiday entity
 */
export interface PublicHoliday {
    id: string;
    name: string;
    date: Date;
    region: string;
    isRecurring: boolean;
}

/**
 * Create leave request payload
 */
export interface CreateLeaveRequest {
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    halfDayStart?: boolean;
    halfDayEnd?: boolean;
    reason?: string;
}

/**
 * Filter options for leave requests
 */
export interface LeaveRequestFilters {
    employeeId?: string;
    teamId?: string;
    status?: LeaveStatus | LeaveStatus[];
    leaveTypeId?: string;
    startDate?: Date;
    endDate?: Date;
    approverId?: string;
}

/**
 * Conflict analysis result from AI service
 */
export interface ConflictAnalysis {
    hasConflict: boolean;
    severity: ConflictSeverity;
    overlappingRequests: LeaveRequest[];
    teamCoveragePercent: number;
    message: string;
    suggestions?: string[];
}

/**
 * Team availability summary
 */
export interface TeamAvailability {
    date: Date;
    totalMembers: number;
    availableMembers: number;
    onLeave: {
        employeeId: string;
        employeeName: string;
        leaveType: string;
    }[];
}
