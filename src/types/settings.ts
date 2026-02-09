// Leave Management App - Settings Types

/**
 * Application setting entity
 */
export interface AppSetting {
    key: string;
    value: string;
    category: 'general' | 'leave' | 'approval' | 'ai';
}

/**
 * Parsed application settings
 */
export interface AppSettings {
    // General
    appName: string;
    appLogoUrl: string;
    defaultRegion: string;

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
}

/**
 * Default application settings (UK-focused)
 */
export const DEFAULT_SETTINGS: AppSettings = {
    appName: 'Leave Management App',
    appLogoUrl: '',
    defaultRegion: 'GB',

    defaultAnnualEntitlement: 28, // UK statutory
    financialYearStart: '01-01', // January 1st
    allowCarryOver: true,
    maxCarryOverDays: 5,

    approvalRequired: true,
    approvalDepth: 1,
    allowSelfApproval: false,

    aiConflictDetection: true,
    conflictWarningThreshold: 25, // 25% team off = warning
    conflictCriticalThreshold: 50, // 50% team off = critical
};

/**
 * Theme preference
 */
export type Theme = 'light' | 'dark' | 'system';
