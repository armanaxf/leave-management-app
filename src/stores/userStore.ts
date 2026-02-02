// Leave Management App - User Store

import { create } from 'zustand';
import type { CurrentUser, UserRole } from '@/types';

interface UserState {
    // Current user
    currentUser: CurrentUser | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setCurrentUser: (user: CurrentUser | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Computed helpers
    hasRole: (role: UserRole) => boolean;
    isManager: () => boolean;
    isAdmin: () => boolean;
}

export const useUserStore = create<UserState>()((set, get) => ({
    currentUser: null,
    isLoading: true,
    error: null,

    setCurrentUser: (user) => set({ currentUser: user, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }),

    hasRole: (role) => {
        const user = get().currentUser;
        return user?.roles.includes(role) ?? false;
    },

    isManager: () => {
        const user = get().currentUser;
        return user?.isManager ?? false;
    },

    isAdmin: () => {
        const user = get().currentUser;
        return user?.isAdmin ?? false;
    },
}));
