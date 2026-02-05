// Leave Management App - Admins Manager Component
// Allows super admins to add/remove admin users
// Following accessibility skill guidelines for WCAG 2.2 compliance

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCog,
    Search,
    Plus,
    Trash2,
    AlertCircle,
    Shield,
    Users,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { dataverseAdapter } from '@/services/adapters';
import { useUserStore } from '@/stores/userStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface AdminEntry {
    email: string;
    displayName: string;
    addedAt: string;
}

interface SearchResult {
    id: string;
    email: string;
    displayName: string;
}

interface AdminsManagerProps {
    adminEmails: string; // JSON string of AdminEntry[]
    onAdminsChange: (adminsJson: string) => void;
}

export default function AdminsManager({
    adminEmails,
    onAdminsChange,
}: AdminsManagerProps) {
    const { currentUser } = useUserStore();
    const [admins, setAdmins] = useState<AdminEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Parse admin emails on mount/change
    useEffect(() => {
        try {
            const parsed = JSON.parse(adminEmails || '[]');
            // Handle both old format (string[]) and new format (AdminEntry[])
            if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'string') {
                    // Old format - convert to new
                    setAdmins(parsed.map((email: string) => ({
                        email,
                        displayName: email.split('@')[0],
                        addedAt: new Date().toISOString(),
                    })));
                } else {
                    setAdmins(parsed);
                }
            }
        } catch {
            setAdmins([]);
        }
    }, [adminEmails]);

    // Search users when search term changes
    useEffect(() => {
        const searchUsers = async () => {
            if (debouncedSearchTerm.length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            try {
                const results = await dataverseAdapter.searchUsers(debouncedSearchTerm, 5);
                // Filter out users who are already admins
                const filtered = results.filter(
                    r => !admins.some(a => a.email.toLowerCase() === r.email.toLowerCase())
                );
                setSearchResults(filtered);
                setShowResults(true);
            } catch (error) {
                console.error('User search failed:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        searchUsers();
    }, [debouncedSearchTerm, admins]);

    /**
     * Add a new admin
     */
    const handleAddAdmin = useCallback((user: SearchResult) => {
        const newAdmin: AdminEntry = {
            email: user.email,
            displayName: user.displayName,
            addedAt: new Date().toISOString(),
        };

        const updatedAdmins = [...admins, newAdmin];
        setAdmins(updatedAdmins);
        onAdminsChange(JSON.stringify(updatedAdmins));

        setSearchTerm('');
        setSearchResults([]);
        setShowResults(false);

        toast.success('Admin added', {
            description: `${user.displayName} has been added as an admin. Save settings to apply.`,
        });
    }, [admins, onAdminsChange]);

    /**
     * Remove an admin
     */
    const handleRemoveAdmin = useCallback((email: string) => {
        // Prevent removing yourself if you're the last admin
        if (admins.length === 1) {
            toast.error('Cannot remove last admin', {
                description: 'At least one admin must remain.',
            });
            return;
        }

        // Prevent removing yourself
        if (currentUser?.email?.toLowerCase() === email.toLowerCase()) {
            toast.error('Cannot remove yourself', {
                description: 'You cannot remove your own admin access. Ask another admin to do this.',
            });
            return;
        }

        const updatedAdmins = admins.filter(a => a.email.toLowerCase() !== email.toLowerCase());
        setAdmins(updatedAdmins);
        onAdminsChange(JSON.stringify(updatedAdmins));

        toast.info('Admin removed', {
            description: 'Save settings to apply this change.',
        });
    }, [admins, currentUser, onAdminsChange]);

    /**
     * Add admin by email (manual entry)
     */
    const handleAddByEmail = useCallback(() => {
        const email = searchTerm.trim();
        if (!email || !email.includes('@')) {
            toast.error('Invalid email', {
                description: 'Please enter a valid email address.',
            });
            return;
        }

        // Check if already an admin
        if (admins.some(a => a.email.toLowerCase() === email.toLowerCase())) {
            toast.error('Already an admin', {
                description: 'This user is already in the admin list.',
            });
            return;
        }

        handleAddAdmin({
            id: email,
            email,
            displayName: email.split('@')[0],
        });
    }, [searchTerm, admins, handleAddAdmin]);

    return (
        <Card className="border-muted/40 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    Admin Management
                </CardTitle>
                <CardDescription>
                    Add or remove users who have administrative access to this application.
                    Admins can manage settings, leave types, and approve special requests.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Search/Add Admin */}
                <div className="space-y-2">
                    <Label htmlFor="admin-search">Add Admin</Label>
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <Input
                                    id="admin-search"
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                    className="pl-10"
                                    aria-describedby="search-help"
                                    aria-expanded={showResults}
                                    aria-controls="search-results"
                                    role="combobox"
                                />
                                {isSearching && (
                                    <Loader2
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                )}
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleAddByEmail}
                                disabled={!searchTerm.includes('@')}
                                aria-label="Add admin by email"
                            >
                                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                                Add
                            </Button>
                        </div>
                        <p id="search-help" className="text-xs text-muted-foreground mt-1">
                            Search for O365 users or enter an email address directly
                        </p>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showResults && searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    id="search-results"
                                    role="listbox"
                                    className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
                                >
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            role="option"
                                            onClick={() => handleAddAdmin(user)}
                                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between group focus:outline-none focus:bg-muted"
                                        >
                                            <div>
                                                <p className="font-medium">{user.displayName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                            <Plus
                                                className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* No results message */}
                        {showResults && searchResults.length === 0 && debouncedSearchTerm.length >= 2 && !isSearching && (
                            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
                                <p>No users found. You can add by email address.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Admins List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4" aria-hidden="true" />
                            Current Admins ({admins.length})
                        </Label>
                    </div>

                    {admins.length === 0 ? (
                        <div
                            className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed"
                            role="status"
                        >
                            <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
                            <p>No admins configured</p>
                            <p className="text-sm mt-1">Add at least one admin to manage settings</p>
                        </div>
                    ) : (
                        <ul className="space-y-2" role="list" aria-label="List of current admins">
                            {admins.map((admin) => {
                                const isCurrentUser = currentUser?.email?.toLowerCase() === admin.email.toLowerCase();
                                const isLastAdmin = admins.length === 1;

                                return (
                                    <motion.li
                                        key={admin.email}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                                            </div>
                                            <div>
                                                <p className="font-medium flex items-center gap-2">
                                                    {admin.displayName}
                                                    {isCurrentUser && (
                                                        <Badge variant="secondary" className="text-xs">You</Badge>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{admin.email}</p>
                                            </div>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isCurrentUser || isLastAdmin}
                                                    className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                                                    aria-label={`Remove ${admin.displayName} as admin`}
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove admin?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to remove <strong>{admin.displayName}</strong> from the admin list?
                                                        They will no longer be able to access settings or manage the application.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRemoveAdmin(admin.email)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Remove Admin
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Warning for no admins */}
                {admins.length === 0 && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30 text-warning-foreground"
                    >
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="font-medium">No admins configured</p>
                            <p className="text-sm mt-1 opacity-90">
                                Without admins, no one will be able to access system settings.
                                Add at least one admin user.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
