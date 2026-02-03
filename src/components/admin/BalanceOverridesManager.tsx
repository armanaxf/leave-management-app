// Leave Management App - Leave Balance Overrides Manager

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Edit2,
    Search,
    Loader2,
    Check,
    X,
    User,
    CalendarDays,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLeaveBalances, useLeaveTypes, useCreateLeaveBalance, useUpdateLeaveBalance } from '@/hooks';
import type { LeaveBalance, LeaveType } from '@/types';

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

interface BalanceOverride extends LeaveBalance {
    isOverride?: boolean;
}

export default function BalanceOverridesManager() {
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState<BalanceOverride | null>(null);

    // Form state
    const [formEmployeeId, setFormEmployeeId] = useState('');
    const [formEmployeeName, setFormEmployeeName] = useState('');
    const [formLeaveTypeId, setFormLeaveTypeId] = useState('');
    const [formEntitlement, setFormEntitlement] = useState('');
    const [formUsed, setFormUsed] = useState('');
    const [formPending, setFormPending] = useState('');
    const [formCarriedOver, setFormCarriedOver] = useState('');

    // Hooks
    const { data: balances, isLoading } = useLeaveBalances();
    const { data: leaveTypes } = useLeaveTypes();
    const createMutation = useCreateLeaveBalance();
    const updateMutation = useUpdateLeaveBalance();

    // Filter balances by year and search
    const filteredBalances = useMemo(() => {
        if (!balances) return [];
        return balances.filter(b => {
            const yearMatch = b.year === selectedYear;
            const searchMatch = !searchQuery ||
                b.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
            return yearMatch && searchMatch;
        });
    }, [balances, selectedYear, searchQuery]);

    // Group by employee
    const balancesByEmployee = useMemo(() => {
        return filteredBalances.reduce((acc, balance) => {
            const key = balance.employeeId;
            if (!acc[key]) acc[key] = { name: balance.employeeName || balance.employeeId, balances: [] };
            acc[key].balances.push(balance);
            return acc;
        }, {} as Record<string, { name: string; balances: LeaveBalance[] }>);
    }, [filteredBalances]);

    const getLeaveType = (id: string): LeaveType | undefined => {
        return leaveTypes?.find(t => t.id === id);
    };

    const openCreateDialog = () => {
        setEditingBalance(null);
        setFormEmployeeId('');
        setFormEmployeeName('');
        setFormLeaveTypeId(leaveTypes?.[0]?.id || '');
        setFormEntitlement('20');
        setFormUsed('0');
        setFormPending('0');
        setFormCarriedOver('0');
        setIsDialogOpen(true);
    };

    const openEditDialog = (balance: LeaveBalance) => {
        setEditingBalance({ ...balance, isOverride: true });
        setFormEmployeeId(balance.employeeId);
        setFormEmployeeName(balance.employeeName || '');
        setFormLeaveTypeId(balance.leaveTypeId);
        setFormEntitlement(balance.entitlement.toString());
        setFormUsed(balance.used.toString());
        setFormPending(balance.pending.toString());
        setFormCarriedOver((balance.carriedOver || 0).toString());
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formEmployeeId || !formLeaveTypeId) return;

        const balanceData = {
            employeeId: formEmployeeId,
            employeeName: formEmployeeName || formEmployeeId,
            leaveTypeId: formLeaveTypeId,
            leaveTypeCode: getLeaveType(formLeaveTypeId)?.code || 'AL',
            year: selectedYear,
            entitlement: Number(formEntitlement) || 0,
            used: Number(formUsed) || 0,
            pending: Number(formPending) || 0,
            carriedOver: Number(formCarriedOver) || 0,
        };

        try {
            if (editingBalance) {
                await updateMutation.mutateAsync({
                    id: editingBalance.id,
                    updates: balanceData,
                });
            } else {
                await createMutation.mutateAsync(balanceData);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to save balance:', error);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-[200px]"
                        />
                    </div>

                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[120px]">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Override
                </Button>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : Object.keys(balancesByEmployee).length > 0 ? (
                <div className="space-y-4">
                    <AnimatePresence>
                        {Object.entries(balancesByEmployee).map(([employeeId, { name, balances }]) => (
                            <motion.div
                                key={employeeId}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card className="overflow-hidden">
                                    <div className="p-4 border-b bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{name}</p>
                                                <p className="text-sm text-muted-foreground">{employeeId}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="divide-y">
                                        {balances.map(balance => {
                                            const leaveType = getLeaveType(balance.leaveTypeId);
                                            const remaining = balance.entitlement - balance.used - balance.pending;

                                            return (
                                                <div key={balance.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: leaveType?.color || '#888' }}
                                                        />
                                                        <div>
                                                            <p className="font-medium text-sm">{leaveType?.name || 'Unknown'}</p>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                                <span>{balance.entitlement} entitled</span>
                                                                <span>•</span>
                                                                <span>{balance.used} used</span>
                                                                <span>•</span>
                                                                <span>{balance.pending} pending</span>
                                                                {balance.carriedOver ? (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{balance.carriedOver} carried</span>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <Badge variant={remaining > 5 ? 'default' : remaining > 0 ? 'secondary' : 'destructive'}>
                                                            {remaining} remaining
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(balance)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No balance records found for {selectedYear}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add an override to adjust an employee's leave entitlement
                    </p>
                    <Button className="mt-4" onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Override
                    </Button>
                </Card>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBalance ? 'Edit Balance' : 'Add Balance Override'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingBalance
                                ? 'Modify the employee\'s leave balance for this period.'
                                : 'Create a custom leave balance for an employee.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {!editingBalance && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="employeeId">Employee ID</Label>
                                    <Input
                                        id="employeeId"
                                        placeholder="e.g. user@company.com"
                                        value={formEmployeeId}
                                        onChange={(e) => setFormEmployeeId(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employeeName">Employee Name</Label>
                                    <Input
                                        id="employeeName"
                                        placeholder="e.g. John Smith"
                                        value={formEmployeeName}
                                        onChange={(e) => setFormEmployeeName(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label>Leave Type</Label>
                            <Select value={formLeaveTypeId} onValueChange={setFormLeaveTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes?.map(type => (
                                        <SelectItem key={type.id} value={type.id}>
                                            <span className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
                                                {type.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="entitlement">Entitlement (days)</Label>
                                <Input
                                    id="entitlement"
                                    type="number"
                                    min="0"
                                    value={formEntitlement}
                                    onChange={(e) => setFormEntitlement(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="used">Used (days)</Label>
                                <Input
                                    id="used"
                                    type="number"
                                    min="0"
                                    value={formUsed}
                                    onChange={(e) => setFormUsed(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pending">Pending (days)</Label>
                                <Input
                                    id="pending"
                                    type="number"
                                    min="0"
                                    value={formPending}
                                    onChange={(e) => setFormPending(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="carriedOver">Carried Over</Label>
                                <Input
                                    id="carriedOver"
                                    type="number"
                                    min="0"
                                    value={formCarriedOver}
                                    onChange={(e) => setFormCarriedOver(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!formEmployeeId || !formLeaveTypeId || isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            {editingBalance ? 'Save Changes' : 'Add Override'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
