import type { LeaveType, TeamMember, LeaveBalance, LeaveRequest } from "@/types";

export const mockLeaveTypes: LeaveType[] = [
    {
        id: '1',
        name: 'Annual Leave',
        code: 'AL',
        color: '#3B82F6', // Blue-500
        icon: 'sun',
        requiresApproval: true,
        maxDaysPerRequest: null,
        isActive: true,
        sortOrder: 1,
    },
    {
        id: '2',
        name: 'Sick Leave',
        code: 'SL',
        color: '#EF4444', // Red-500
        icon: 'thermometer',
        requiresApproval: false,
        maxDaysPerRequest: 5,
        isActive: true,
        sortOrder: 2,
    },
    {
        id: '3',
        name: 'Personal Leave',
        code: 'PL',
        color: '#8B5CF6', // Violet-500
        icon: 'user',
        requiresApproval: true,
        maxDaysPerRequest: 3,
        isActive: true,
        sortOrder: 3,
    },
    {
        id: '4',
        name: 'Work From Home',
        code: 'WFH',
        color: '#10B981', // Emerald-500
        icon: 'laptop',
        requiresApproval: true,
        maxDaysPerRequest: null,
        isActive: true,
        sortOrder: 4,
    }
];

export const mockTeamMembers: TeamMember[] = [
    {
        id: 'user-1',
        email: 'josh@example.com',
        displayName: 'Josh Admin',
        firstName: 'Josh',
        lastName: 'Admin',
        jobTitle: 'Engineering Lead',
        department: 'Engineering',
        isAdmin: true,
        isManager: true, // roles will be added when converting to CurrentUser
        currentStatus: 'available',
        photoUrl: undefined // In a real app, this would be a URL
    },
    {
        id: 'user-2',
        email: 'sarah@example.com',
        displayName: 'Sarah Engineer',
        firstName: 'Sarah',
        lastName: 'Engineer',
        jobTitle: 'Senior Developer',
        department: 'Engineering',
        isAdmin: false,
        isManager: false,
        currentStatus: 'available',
        managerId: 'user-1'
    },
    {
        id: 'user-3',
        email: 'mike@example.com',
        displayName: 'Mike Designer',
        firstName: 'Mike',
        lastName: 'Designer',
        jobTitle: 'Product Designer',
        department: 'Design',
        isAdmin: false,
        isManager: false,
        currentStatus: 'on-leave',
        upcomingLeave: {
            startDate: new Date('2026-02-10'),
            endDate: new Date('2026-02-14'),
            leaveType: 'Annual Leave'
        },
        managerId: 'user-1'
    }
];

export const mockBalances: LeaveBalance[] = [
    {
        id: '1',
        employeeId: 'user-1',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        year: 2026,
        entitlement: 28,
        used: 8,
        pending: 2,
        carryOver: 3,
        available: 21,
    },
    {
        id: '2',
        employeeId: 'user-1',
        leaveTypeId: '2',
        leaveType: mockLeaveTypes[1],
        year: 2026,
        entitlement: 10,
        used: 2,
        pending: 0,
        carryOver: 0,
        available: 8,
    },
    {
        id: '3',
        employeeId: 'user-1',
        leaveTypeId: '3',
        leaveType: mockLeaveTypes[2],
        year: 2026,
        entitlement: 5,
        used: 0,
        pending: 1,
        carryOver: 0,
        available: 4,
    }
];

export const mockRequests: LeaveRequest[] = [
    {
        id: '1',
        employeeId: 'user-1',
        employeeEmail: 'josh@example.com',
        employeeName: 'Josh Admin',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-16'),
        halfDayStart: false,
        halfDayEnd: false,
        totalDays: 2,
        reason: 'Weekend trip to visit family',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '2',
        employeeId: 'user-1',
        employeeEmail: 'josh@example.com',
        employeeName: 'Josh Admin',
        leaveTypeId: '1',
        leaveType: mockLeaveTypes[0],
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-14'),
        halfDayStart: false,
        halfDayEnd: true,
        totalDays: 4.5,
        status: 'approved',
        approverId: 'manager1',
        approverName: 'John Manager',
        approvedAt: new Date('2026-01-20'),
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-20'),
    },
];
