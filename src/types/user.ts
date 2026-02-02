// Leave Management App - User Types

/**
 * User role in the application
 */
export type UserRole = 'employee' | 'manager' | 'admin';

/**
 * User entity from O365/Entra ID
 */
export interface User {
    id: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    department?: string;
    photoUrl?: string;
    managerId?: string;
    managerEmail?: string;
    isManager: boolean;
    isAdmin: boolean;
}

/**
 * Current authenticated user with additional context
 */
export interface CurrentUser extends User {
    roles: UserRole[];
    directReports: User[];
    teamMembers: User[];
}

/**
 * Team member with leave status
 */
export interface TeamMember extends User {
    currentStatus: 'available' | 'on-leave' | 'pending-leave';
    upcomingLeave?: {
        startDate: Date;
        endDate: Date;
        leaveType: string;
    };
}
