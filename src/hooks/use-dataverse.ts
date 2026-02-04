// Leave Management App - TanStack Query Hooks
// Provides data fetching with caching and state management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataverseAdapter } from '@/services/adapters';
import type {
    LeaveRequest,
    LeaveBalance,
    LeaveType,
    PublicHoliday,
    CreateLeaveRequest,
    LeaveRequestFilters,
} from '@/types';

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

export const queryKeys = {
    // Leave Types
    leaveTypes: ['leaveTypes'] as const,

    // Leave Requests
    leaveRequests: (filters?: LeaveRequestFilters) => ['leaveRequests', filters] as const,
    leaveRequest: (id: string) => ['leaveRequest', id] as const,

    // Leave Balances
    leaveBalances: (employeeId: string, year: number) => ['leaveBalances', employeeId, year] as const,

    // Public Holidays
    publicHolidays: (region: string, year: number) => ['publicHolidays', region, year] as const,

    // Settings
    settings: ['settings'] as const,
};

// ─────────────────────────────────────────────────────────────
// Leave Types Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all active leave types
 */
export function useLeaveTypes() {
    return useQuery({
        queryKey: queryKeys.leaveTypes,
        queryFn: () => dataverseAdapter.getLeaveTypes(),
        staleTime: 10 * 60 * 1000, // 10 minutes - leave types rarely change
    });
}

/**
 * Create a new leave type
 */
export function useCreateLeaveType() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (leaveType: Omit<LeaveType, 'id'>) =>
            dataverseAdapter.createLeaveType(leaveType),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leaveTypes });
        },
    });
}

/**
 * Update an existing leave type
 */
export function useUpdateLeaveType() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<LeaveType> }) =>
            dataverseAdapter.updateLeaveType(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leaveTypes });
        },
    });
}

/**
 * Delete a leave type
 */
export function useDeleteLeaveType() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dataverseAdapter.deleteLeaveType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leaveTypes });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// Leave Requests Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch leave requests with optional filters
 */
export function useLeaveRequests(filters?: LeaveRequestFilters) {
    return useQuery({
        queryKey: queryKeys.leaveRequests(filters),
        queryFn: () => dataverseAdapter.getLeaveRequests(filters),
    });
}

/**
 * Fetch a single leave request by ID
 */
export function useLeaveRequest(id: string) {
    return useQuery({
        queryKey: queryKeys.leaveRequest(id),
        queryFn: () => dataverseAdapter.getLeaveRequest(id),
        enabled: !!id,
    });
}

/**
 * Create a new leave request
 */
export function useCreateLeaveRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ request, employeeId }: { request: CreateLeaveRequest; employeeId: string }) =>
            dataverseAdapter.createLeaveRequest(request, employeeId),
        onSuccess: (_, variables) => {
            // Invalidate all leave request queries
            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
            // Invalidate balances as pending may have changed
            queryClient.invalidateQueries({
                queryKey: ['leaveBalances', variables.employeeId]
            });
        },
    });
}

/**
 * Update a leave request (approve, reject, cancel)
 */
export function useUpdateLeaveRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<LeaveRequest> }) =>
            dataverseAdapter.updateLeaveRequest(id, updates),
        onSuccess: (data) => {
            // Invalidate all leave request queries
            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
            // Update the specific request in cache
            queryClient.setQueryData(queryKeys.leaveRequest(data.id), data);
            // Invalidate balances as used/pending may have changed
            queryClient.invalidateQueries({
                queryKey: ['leaveBalances', data.employeeId]
            });
        },
    });
}

/**
 * Delete/cancel a leave request
 */
export function useDeleteLeaveRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dataverseAdapter.deleteLeaveRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
            queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
        },
    });
}

/**
 * Approve a leave request (convenience hook)
 */
export function useApproveLeaveRequest() {
    const updateMutation = useUpdateLeaveRequest();

    return useMutation({
        mutationFn: ({
            id,
            approverId,
            approverName,
            comments
        }: {
            id: string;
            approverId: string;
            approverName: string;
            comments?: string;
        }) => updateMutation.mutateAsync({
            id,
            updates: {
                status: 'approved',
                approverId,
                approverName,
                approverComments: comments,
                approvedAt: new Date(),
            },
        }),
    });
}

/**
 * Reject a leave request (convenience hook)
 */
export function useRejectLeaveRequest() {
    const updateMutation = useUpdateLeaveRequest();

    return useMutation({
        mutationFn: ({
            id,
            approverId,
            approverName,
            comments
        }: {
            id: string;
            approverId: string;
            approverName: string;
            comments?: string;
        }) => updateMutation.mutateAsync({
            id,
            updates: {
                status: 'rejected',
                approverId,
                approverName,
                approverComments: comments,
            },
        }),
    });
}

// ─────────────────────────────────────────────────────────────
// Leave Balances Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch leave balances for an employee
 */
export function useLeaveBalances(employeeId?: string, year?: number) {
    return useQuery({
        queryKey: queryKeys.leaveBalances(employeeId || '', year || 0),
        queryFn: () => dataverseAdapter.getLeaveBalances(employeeId!, year!),
        enabled: !!employeeId && !!year,
    });
}

/**
 * Create a new leave balance (admin only)
 */
export function useCreateLeaveBalance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (balance: Omit<LeaveBalance, 'id' | 'available'>) =>
            dataverseAdapter.createLeaveBalance(balance),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['leaveBalances', data.employeeId]
            });
        },
    });
}

/**
 * Update a leave balance (admin only)
 */
export function useUpdateLeaveBalance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<LeaveBalance> }) =>
            dataverseAdapter.updateLeaveBalance(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['leaveBalances', data.employeeId]
            });
        },
    });
}

/**
 * Initialize balances for a new employee or year
 */
export function useInitializeBalances() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ employeeId, year }: { employeeId: string; year: number }) =>
            dataverseAdapter.initializeBalances(employeeId, year),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.leaveBalances(variables.employeeId, variables.year)
            });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// Public Holidays Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch public holidays for a region and year
 */
export function usePublicHolidays(region: string, year: number) {
    return useQuery({
        queryKey: queryKeys.publicHolidays(region, year),
        queryFn: () => dataverseAdapter.getPublicHolidays(region, year),
        enabled: !!region && !!year,
        staleTime: 30 * 60 * 1000, // 30 minutes - holidays rarely change
    });
}

/**
 * Create a public holiday
 */
export function useCreatePublicHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (holiday: Omit<PublicHoliday, 'id'>) =>
            dataverseAdapter.createPublicHoliday(holiday),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['publicHolidays'] });
        },
    });
}

/**
 * Update a public holiday
 */
export function useUpdatePublicHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<PublicHoliday> }) =>
            dataverseAdapter.updatePublicHoliday(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['publicHolidays'] });
        },
    });
}

/**
 * Delete a public holiday
 */
export function useDeletePublicHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dataverseAdapter.deletePublicHoliday(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['publicHolidays'] });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// Settings Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all application settings
 */
export function useSettings() {
    return useQuery({
        queryKey: queryKeys.settings,
        queryFn: () => dataverseAdapter.getSettings(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Update a setting
 */
export function useUpdateSetting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, value }: { key: string; value: string | number | boolean }) =>
            dataverseAdapter.updateSetting(key, String(value)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.settings });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// Composite Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all data needed for the employee dashboard
 */
export function useEmployeeDashboard(employeeId: string, year: number, region: string) {
    const leaveTypes = useLeaveTypes();
    const balances = useLeaveBalances(employeeId, year);
    const requests = useLeaveRequests({ employeeId });
    const holidays = usePublicHolidays(region, year);

    return {
        leaveTypes,
        balances,
        requests,
        holidays,
        isLoading: leaveTypes.isLoading || balances.isLoading || requests.isLoading,
        isError: leaveTypes.isError || balances.isError || requests.isError,
    };
}

/**
 * Fetch pending requests for manager approval
 */
export function usePendingApprovals(approverId?: string) {
    return useLeaveRequests({
        status: 'pending',
        approverId,
    });
}
