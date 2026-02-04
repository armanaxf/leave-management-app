// Leave Management App - Hooks Index
// Re-exports all custom hooks

export { useTheme } from './use-theme';

// Dataverse hooks
export {
    // Query keys
    queryKeys,

    // Leave Types
    useLeaveTypes,
    useCreateLeaveType,
    useUpdateLeaveType,
    useDeleteLeaveType,

    // Leave Requests
    useLeaveRequests,
    useLeaveRequest,
    useCreateLeaveRequest,
    useUpdateLeaveRequest,
    useDeleteLeaveRequest,
    useApproveLeaveRequest,
    useRejectLeaveRequest,

    // Leave Balances
    useLeaveBalances,
    useCreateLeaveBalance,
    useUpdateLeaveBalance,

    usePublicHolidays,
    useCreatePublicHoliday,
    useUpdatePublicHoliday,
    useDeletePublicHoliday,

    // Settings
    useSettings,
    useUpdateSetting,

    // Composite
    useEmployeeDashboard,
    usePendingApprovals,
} from './use-dataverse';
