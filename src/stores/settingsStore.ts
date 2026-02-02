// Leave Management App - Settings Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, Theme } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

interface SettingsState {
    // Settings
    settings: AppSettings;
    isLoading: boolean;
    error: string | null;

    // Theme (persisted to localStorage)
    theme: Theme;

    // Actions
    setSettings: (settings: Partial<AppSettings>) => void;
    resetSettings: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setTheme: (theme: Theme) => void;

    // Computed helpers
    getCurrentFinancialYear: () => number;
    getFinancialYearStart: () => Date;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            isLoading: false,
            error: null,
            theme: 'system',

            setSettings: (updates) =>
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                })),

            resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

            setLoading: (loading) => set({ isLoading: loading }),

            setError: (error) => set({ error, isLoading: false }),

            setTheme: (theme) => {
                set({ theme });

                // Apply theme to document
                const root = document.documentElement;
                root.classList.remove('light', 'dark');

                if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                        ? 'dark'
                        : 'light';
                    root.classList.add(systemTheme);
                } else {
                    root.classList.add(theme);
                }
            },

            getCurrentFinancialYear: () => {
                const settings = get().settings;
                const [month, day] = settings.financialYearStart.split('-').map(Number);
                const now = new Date();
                const fyStart = new Date(now.getFullYear(), month - 1, day);

                // If we're before the FY start, we're in the previous FY
                return now < fyStart ? now.getFullYear() - 1 : now.getFullYear();
            },

            getFinancialYearStart: () => {
                const settings = get().settings;
                const [month, day] = settings.financialYearStart.split('-').map(Number);
                const year = get().getCurrentFinancialYear();
                return new Date(year, month - 1, day);
            },
        }),
        {
            name: 'leave-app-settings',
            partialize: (state) => ({ theme: state.theme }),
        }
    )
);
