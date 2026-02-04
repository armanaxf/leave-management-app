// Leave Management App - Data Source Adapter Interface

import type {
    LeaveRequest,
    LeaveBalance,
    LeaveType,
    PublicHoliday,
    CreateLeaveRequest,
    LeaveRequestFilters,
    AppSetting,
} from '@/types';

/**
 * Abstract data source adapter interface
 * Implementations: DataverseAdapter, SharePointAdapter, SQLAdapter
 */
export interface DataSourceAdapter {
    /** Adapter identifier */
    readonly name: string;

    // ─────────────────────────────────────────────────────────────
    // Leave Requests
    // ─────────────────────────────────────────────────────────────

    /**
     * Get leave requests with optional filters
     */
    getLeaveRequests(filters?: LeaveRequestFilters): Promise<LeaveRequest[]>;

    /**
     * Get a single leave request by ID
     */
    getLeaveRequest(id: string): Promise<LeaveRequest | null>;

    /**
     * Create a new leave request
     */
    createLeaveRequest(request: CreateLeaveRequest, employeeId: string): Promise<LeaveRequest>;

    /**
     * Update an existing leave request
     */
    updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest>;

    /**
     * Delete/cancel a leave request
     */
    deleteLeaveRequest(id: string): Promise<void>;

    // ─────────────────────────────────────────────────────────────
    // Leave Balances
    // ─────────────────────────────────────────────────────────────

    /**
     * Get leave balances for an employee
     */
    getLeaveBalances(employeeId: string, year: number): Promise<LeaveBalance[]>;

    /**
     * Update a leave balance (admin only)
     */
    updateLeaveBalance(id: string, updates: Partial<LeaveBalance>): Promise<LeaveBalance>;

    /**
     * Create a new leave balance (admin only)
     */
    createLeaveBalance(balance: Omit<LeaveBalance, 'id' | 'available'>): Promise<LeaveBalance>;

    /**
     * Initialize balances for a new employee or year
     */
    initializeBalances(employeeId: string, year: number): Promise<LeaveBalance[]>;

    // ─────────────────────────────────────────────────────────────
    // Leave Types
    // ─────────────────────────────────────────────────────────────

    /**
     * Get all leave types
     */
    getLeaveTypes(): Promise<LeaveType[]>;

    /**
     * Create a new leave type (admin only)
     */
    createLeaveType(leaveType: Omit<LeaveType, 'id'>): Promise<LeaveType>;

    /**
     * Update a leave type (admin only)
     */
    updateLeaveType(id: string, updates: Partial<LeaveType>): Promise<LeaveType>;

    /**
     * Delete a leave type (admin only)
     */
    deleteLeaveType(id: string): Promise<void>;

    // ─────────────────────────────────────────────────────────────
    // Settings
    // ─────────────────────────────────────────────────────────────

    /**
     * Get all application settings
     */
    getSettings(): Promise<AppSetting[]>;

    /**
     * Update a setting (admin only)
     */
    updateSetting(key: string, value: string): Promise<void>;

    // ─────────────────────────────────────────────────────────────
    // Public Holidays
    // ─────────────────────────────────────────────────────────────

    /**
     * Get public holidays for a region and year
     */
    getPublicHolidays(region: string, year: number): Promise<PublicHoliday[]>;

    /**
     * Create a public holiday (admin only)
     */
    createPublicHoliday(holiday: Omit<PublicHoliday, 'id'>): Promise<PublicHoliday>;

    /**
     * Update a public holiday (admin only)
     */
    updatePublicHoliday(id: string, updates: Partial<PublicHoliday>): Promise<PublicHoliday>;

    /**
     * Delete a public holiday (admin only)
     */
    deletePublicHoliday(id: string): Promise<void>;
}
