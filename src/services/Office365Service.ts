// Leave Management App - Office 365 Users Service
// Uses the O365 connector for user profiles instead of systemuser table
// Reference: https://learn.microsoft.com/en-us/connectors/office365users/

import type { User, TeamMember, CurrentUser } from '@/types';

/**
 * O365 User Profile from the connector
 */
interface O365UserProfile {
    Id: string;
    DisplayName: string;
    GivenName?: string;
    Surname?: string;
    Mail?: string;
    UserPrincipalName?: string;
    JobTitle?: string;
    Department?: string;
    OfficeLocation?: string;
    City?: string;
    Country?: string;
    CompanyName?: string;
    mobilePhone?: string;
    TelephoneNumber?: string;
    AccountEnabled?: boolean;
}

/**
 * Maps O365 profile to app User type
 */
function mapO365UserToUser(profile: O365UserProfile): User {
    return {
        id: profile.Id,
        email: profile.Mail || profile.UserPrincipalName || '',
        displayName: profile.DisplayName || 'Unknown User',
        firstName: profile.GivenName,
        lastName: profile.Surname,
        jobTitle: profile.JobTitle,
        department: profile.Department,
        isManager: false, // Will be determined by checking direct reports
        isAdmin: false,   // Will be determined by admin list
    };
}

/**
 * Office 365 Users Service
 * Provides user profile operations using the O365 connector
 */
export class Office365Service {
    private connector: any = null;

    /**
     * Initialize the O365 connector
     * Must be called before using other methods
     */
    async initialize(): Promise<boolean> {
        try {
            // Get the Office365Users connector from Power Apps runtime
            const powerApps = (window as any).PowerApps;
            if (powerApps?.Office365Users) {
                this.connector = powerApps.Office365Users;
                return true;
            }

            // Try alternate access method via Xrm
            const xrm = (window as any).Xrm;
            if (xrm?.WebApi?.online?.execute) {
                // Use Web API to call O365 connector actions
                this.connector = {
                    _useWebApi: true,
                    _xrm: xrm,
                };
                return true;
            }

            console.warn('Office365Users connector not available. Running in local dev mode.');
            return false;
        } catch (error) {
            console.error('Failed to initialize O365 connector:', error);
            return false;
        }
    }

    /**
     * Check if the connector is available
     */
    isAvailable(): boolean {
        return this.connector !== null;
    }

    /**
     * Get the current user's profile
     */
    async getMyProfile(): Promise<User | null> {
        if (!this.connector) {
            console.warn('O365 connector not initialized');
            return null;
        }

        try {
            if (this.connector._useWebApi) {
                // Fallback to Xrm context for current user
                const xrm = this.connector._xrm;
                const globalContext = xrm?.Utility?.getGlobalContext?.();
                const userId = globalContext?.userSettings?.userId?.replace(/[{}]/g, '').toLowerCase();
                const userName = globalContext?.userSettings?.userName;

                if (userId) {
                    return {
                        id: userId,
                        email: '',
                        displayName: userName || 'Power Apps User',
                        isManager: false,
                        isAdmin: false,
                    };
                }
                return null;
            }

            // Use O365 connector MyProfile method
            const profile: O365UserProfile = await this.connector.MyProfile();
            return mapO365UserToUser(profile);
        } catch (error) {
            console.error('Failed to get my profile:', error);
            return null;
        }
    }

    /**
     * Get a specific user's profile by email or ID
     */
    async getUserProfile(userIdOrEmail: string): Promise<User | null> {
        if (!this.connector) {
            return null;
        }

        try {
            if (this.connector._useWebApi) {
                // Web API doesn't support direct user profile lookup without systemuser
                // This would need a custom API or Flow
                return null;
            }

            // Use O365 connector UserProfileV2 method
            const profile: O365UserProfile = await this.connector.UserProfileV2(userIdOrEmail);
            return mapO365UserToUser(profile);
        } catch (error) {
            console.error('Failed to get user profile:', error);
            return null;
        }
    }

    /**
     * Search for users by name or email
     */
    async searchUsers(searchTerm: string, top: number = 10): Promise<User[]> {
        if (!this.connector) {
            return [];
        }

        try {
            if (this.connector._useWebApi) {
                // Web API fallback not supported for search
                return [];
            }

            // Use O365 connector SearchUserV2 method
            const result = await this.connector.SearchUserV2({
                searchTerm,
                top,
            });

            const profiles: O365UserProfile[] = result?.value || [];
            return profiles.map(mapO365UserToUser);
        } catch (error) {
            console.error('Failed to search users:', error);
            return [];
        }
    }

    /**
     * Get the manager of a specific user
     */
    async getManager(userIdOrEmail: string): Promise<User | null> {
        if (!this.connector) {
            return null;
        }

        try {
            if (this.connector._useWebApi) {
                return null;
            }

            // Use O365 connector Manager method
            const profile: O365UserProfile = await this.connector.Manager(userIdOrEmail);
            return mapO365UserToUser(profile);
        } catch (error) {
            console.error('Failed to get manager:', error);
            return null;
        }
    }

    /**
     * Get direct reports of a specific user
     */
    async getDirectReports(userIdOrEmail: string): Promise<User[]> {
        if (!this.connector) {
            return [];
        }

        try {
            if (this.connector._useWebApi) {
                return [];
            }

            // Use O365 connector DirectReportsV2 method
            const result = await this.connector.DirectReportsV2(userIdOrEmail);
            const profiles: O365UserProfile[] = result?.value || [];
            return profiles.map(mapO365UserToUser);
        } catch (error) {
            console.error('Failed to get direct reports:', error);
            return [];
        }
    }

    /**
     * Get current user with full context (roles, direct reports, etc.)
     */
    async getCurrentUser(adminEmails: string[] = []): Promise<CurrentUser | null> {
        const profile = await this.getMyProfile();
        if (!profile) {
            return null;
        }

        // Get direct reports to determine if user is a manager
        const directReports = await this.getDirectReports(profile.email || profile.id);
        const isManager = directReports.length > 0;

        // Check if user is an admin
        const isAdmin = adminEmails.some(
            email => email.toLowerCase() === profile.email?.toLowerCase()
        );

        // Build roles array
        const roles: ('employee' | 'manager' | 'admin')[] = ['employee'];
        if (isManager) roles.push('manager');
        if (isAdmin) roles.push('admin');

        return {
            ...profile,
            isManager,
            isAdmin,
            roles,
            directReports,
            teamMembers: directReports as TeamMember[],
        };
    }

    /**
     * Get team members with leave status
     */
    async getTeamMembers(managerIdOrEmail: string): Promise<TeamMember[]> {
        const directReports = await this.getDirectReports(managerIdOrEmail);

        return directReports.map(user => ({
            ...user,
            currentStatus: 'available' as const, // Status will be updated from leave requests
        }));
    }
}

// Export singleton instance
export const office365Service = new Office365Service();
