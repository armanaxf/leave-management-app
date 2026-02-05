// Leave Management App - Settings Types

/**
 * Application setting entity
 */
export interface AppSetting {
    key: string;
    value: string;
    category: 'general' | 'leave' | 'approval' | 'ai' | 'branding' | 'admins';
}

/**
 * Admin user entry
 */
export interface AdminUser {
    id: string;
    email: string;
    displayName: string;
    addedAt: Date;
    addedBy: string;
}

/**
 * Parsed application settings
 */
export interface AppSettings {
    // General
    appName: string;
    defaultRegion: string;

    // Branding
    headerIcon: string; // Base64 data URL or empty
    headerIconFileName: string; // Original filename for reference

    // Leave
    defaultAnnualEntitlement: number;
    financialYearStart: string; // MM-DD format
    allowCarryOver: boolean;
    maxCarryOverDays: number;

    // Approval
    approvalRequired: boolean;
    approvalDepth: number; // 1 = direct manager only
    allowSelfApproval: boolean;

    // AI
    aiConflictDetection: boolean;
    conflictWarningThreshold: number; // percentage
    conflictCriticalThreshold: number; // percentage

    // Admins (stored as JSON string in Dataverse)
    adminEmails: string; // JSON array of admin emails
}

/**
 * Default application settings (UK-focused)
 */
export const DEFAULT_SETTINGS: AppSettings = {
    appName: 'Leave Management App',
    defaultRegion: 'GB',

    // Branding
    headerIcon: '',
    headerIconFileName: '',

    // Leave policy
    defaultAnnualEntitlement: 28, // UK statutory
    financialYearStart: '01-01', // January 1st
    allowCarryOver: true,
    maxCarryOverDays: 5,

    // Approval workflow
    approvalRequired: true,
    approvalDepth: 1,
    allowSelfApproval: false,

    // AI features
    aiConflictDetection: true,
    conflictWarningThreshold: 25, // 25% team off = warning
    conflictCriticalThreshold: 50, // 50% team off = critical

    // Admins
    adminEmails: '[]', // Empty JSON array
};

/**
 * Theme preference
 */
export type Theme = 'light' | 'dark' | 'system';
