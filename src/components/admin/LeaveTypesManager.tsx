
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { LeaveType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    useLeaveTypes,
    useCreateLeaveType,
    useUpdateLeaveType,
    useDeleteLeaveType
} from '@/hooks';

export default function LeaveTypesManager() {
    const { data: leaveTypes = [], isLoading } = useLeaveTypes();
    const createMutation = useCreateLeaveType();
    const updateMutation = useUpdateLeaveType();
    const deleteMutation = useDeleteLeaveType();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<Partial<LeaveType> | null>(null);

    // Filter valid icons for the dropdown (simplified list for UI)
    const validIcons = ['Sun', 'Thermometer', 'User', 'Laptop', 'Heart', 'Briefcase', 'Plane', 'Home', 'Baby', 'Award', 'AlertCircle'];

    const handleEdit = (type: LeaveType) => {
        setEditingType({ ...type });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingType({
            name: '',
            code: '',
            color: '#3B82F6',
            icon: 'sun',
            requiresApproval: true,
            maxDaysPerRequest: null,
            isActive: true,
            sortOrder: leaveTypes.length + 1,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingType?.name || !editingType.code) {
            toast.error('Name and Code are required');
            return;
        }

        try {
            if (editingType.id) {
                // Update existing
                await updateMutation.mutateAsync({
                    id: editingType.id,
                    updates: editingType
                });
                toast.success('Leave type updated');
            } else {
                // Create new
                await createMutation.mutateAsync(editingType as Omit<LeaveType, 'id'>);
                toast.success('Leave type created');
            }
            setIsDialogOpen(false);
            setEditingType(null);
        } catch (error) {
            console.error('Failed to save leave type:', error);
            toast.error('Failed to save leave type');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this leave type?')) return;

        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Leave type deleted');
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to delete leave type:', error);
            toast.error('Failed to delete leave type');
        }
    };

    // Helper to render dynamic icon
    const renderIcon = (iconName: string, className?: string) => {
        // Capitalize first letter to match Lucide export
        const capitalized = iconName.charAt(0).toUpperCase() + iconName.slice(1);
        const IconComponent = (Icons as any)[capitalized] || Icons.Circle; // Fallback
        return <IconComponent className={className} />;
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
    }

    const getIconValue = () => {
        if (!editingType?.icon) return 'Circle';
        return editingType.icon.charAt(0).toUpperCase() + editingType.icon.slice(1);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Leave Categories</h2>
                    <p className="text-sm text-muted-foreground">
                        Define the types of leave available to employees.
                    </p>
                </div>
                <Button onClick={handleCreate} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Leave Type
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                    {leaveTypes.map((type) => (
                        <motion.div
                            key={type.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className={cn("overflow-hidden border-t-4 hover:shadow-md transition-shadow", !type.isActive && "opacity-60 grayscale")} style={{ borderTopColor: type.color }}>
                                <CardHeader className="flex flex-row items-start justify-between pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg bg-muted/50 text-foreground/80")}>
                                            {renderIcon(type.icon, "h-5 w-5")}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                {type.name}
                                                {!type.isActive && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Inactive</Badge>}
                                            </CardTitle>
                                            <CardDescription className="text-xs font-mono mt-0.5">
                                                Code: {type.code}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(type)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(type.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3 text-sm grid gap-2.5">
                                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">Approval Required</span>
                                        {type.requiresApproval ? (
                                            <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20">Yes</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-success/5 text-success border-success/20">Auto-Approve</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">Max Days / Request</span>
                                        <span className="font-medium">{type.maxDaysPerRequest ? `${type.maxDaysPerRequest} days` : 'Unlimited'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className={cn("flex items-center gap-1.5 font-medium", type.isActive ? "text-success" : "text-muted-foreground")}>
                                            <div className={cn("h-1.5 w-1.5 rounded-full", type.isActive ? "bg-success" : "bg-muted-foreground")} />
                                            {type.isActive ? 'Active' : 'Archived'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Promo Card for creating new */}
                <motion.div layout>
                    <Button
                        variant="ghost"
                        className="w-full h-full min-h-[220px] flex flex-col gap-4 border-2 border-dashed border-muted hover:border-primary/50 hover:bg-muted/10 rounded-xl"
                        onClick={handleCreate}
                    >
                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-muted-foreground">Create New Type</span>
                    </Button>
                </motion.div>
            </div>

            {/* Edit/Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingType?.id ? 'Edit Leave Type' : 'Create Leave Type'}</DialogTitle>
                        <DialogDescription>
                            Configure the settings for this leave category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={editingType?.name || ''}
                                    onChange={(e) => setEditingType(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Annual Leave"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Code</Label>
                                <Input
                                    id="code"
                                    value={editingType?.code || ''}
                                    onChange={(e) => setEditingType(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. AL"
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon</Label>
                                <Select
                                    value={getIconValue()}
                                    onValueChange={(val) => setEditingType(prev => ({ ...prev, icon: val.toLowerCase() }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {validIcons.map(icon => (
                                            <SelectItem key={icon} value={icon}>
                                                <div className="flex items-center gap-2">
                                                    {renderIcon(icon.toLowerCase(), "h-4 w-4")}
                                                    {icon}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color">Color Theme</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={editingType?.color || '#000000'}
                                        onChange={(e) => setEditingType(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={editingType?.color || ''}
                                        onChange={(e) => setEditingType(prev => ({ ...prev, color: e.target.value }))}
                                        className="font-mono"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4 bg-muted/10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Approval Required</Label>
                                    <p className="text-sm text-muted-foreground">Manager must approve requests</p>
                                </div>
                                <Switch
                                    checked={editingType?.requiresApproval ?? true}
                                    onCheckedChange={(c) => setEditingType(prev => ({ ...prev, requiresApproval: c }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Active Status</Label>
                                    <p className="text-sm text-muted-foreground">Visible to employees for new requests</p>
                                </div>
                                <Switch
                                    checked={editingType?.isActive ?? true}
                                    onCheckedChange={(c) => setEditingType(prev => ({ ...prev, isActive: c }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxDays">Maximum Days per Request (Optional)</Label>
                            <Input
                                id="maxDays"
                                type="number"
                                value={editingType?.maxDaysPerRequest || ''}
                                onChange={(e) => setEditingType(prev => ({ ...prev, maxDaysPerRequest: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="Unlimited"
                            />
                            <p className="text-xs text-muted-foreground">Leave empty for no limit.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        {editingType?.id && (
                            <Button variant="destructive" className="mr-auto" onClick={() => handleDelete(editingType?.id!)}>
                                Delete
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
