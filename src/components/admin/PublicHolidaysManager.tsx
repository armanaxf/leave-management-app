// Leave Management App - Public Holidays Manager Component

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    Plus,
    Trash2,
    Edit2,
    Calendar,
    Loader2,
    Check,
    X,
    CalendarDays,
    Globe,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    usePublicHolidays,
    useCreatePublicHoliday,
    useUpdatePublicHoliday,
    useDeletePublicHoliday,
} from '@/hooks';
import type { PublicHoliday } from '@/types';

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

const regions = [
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'AU', name: 'Australia' },
    { code: 'EU', name: 'Europe' },
];

export default function PublicHolidaysManager() {
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedRegion, setSelectedRegion] = useState('GB');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<PublicHoliday | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDate, setFormDate] = useState<Date>();
    const [formRegion, setFormRegion] = useState('GB');

    // Hooks
    const { data: holidays, isLoading } = usePublicHolidays(selectedRegion, selectedYear);
    const createMutation = useCreatePublicHoliday();
    const updateMutation = useUpdatePublicHoliday();
    const deleteMutation = useDeletePublicHoliday();

    const openCreateDialog = () => {
        setEditingHoliday(null);
        setFormName('');
        setFormDate(undefined);
        setFormRegion(selectedRegion);
        setIsDialogOpen(true);
    };

    const openEditDialog = (holiday: PublicHoliday) => {
        setEditingHoliday(holiday);
        setFormName(holiday.name);
        setFormDate(new Date(holiday.date));
        setFormRegion(holiday.region);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formName || !formDate) return;

        const holidayData = {
            name: formName,
            date: formDate,
            region: formRegion,
            year: formDate.getFullYear(),
            isRecurring: false,
        };

        try {
            if (editingHoliday) {
                await updateMutation.mutateAsync({
                    id: editingHoliday.id,
                    updates: holidayData,
                });
            } else {
                await createMutation.mutateAsync(holidayData);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to save holiday:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete holiday:', error);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    // Group holidays by month
    const holidaysByMonth = (holidays || []).reduce((acc, holiday) => {
        const month = format(new Date(holiday.date), 'MMMM');
        if (!acc[month]) acc[month] = [];
        acc[month].push(holiday);
        return acc;
    }, {} as Record<string, PublicHoliday[]>);

    const months = Object.keys(holidaysByMonth).sort((a, b) => {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger className="w-[180px]">
                            <Globe className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {regions.map(r => (
                                <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[120px]">
                            <Calendar className="h-4 w-4 mr-2" />
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
                    Add Holiday
                </Button>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : holidays && holidays.length > 0 ? (
                <div className="space-y-6">
                    {months.map(month => (
                        <div key={month}>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">{month}</h3>
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {holidaysByMonth[month]
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .map(holiday => (
                                            <motion.div
                                                key={holiday.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                            >
                                                <Card className="overflow-hidden">
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <CalendarDays className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{holiday.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {format(new Date(holiday.date), 'EEEE, d MMMM yyyy')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {deleteConfirm === holiday.id ? (
                                                                <>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(holiday.id)}
                                                                        disabled={deleteMutation.isPending}
                                                                    >
                                                                        {deleteMutation.isPending ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Check className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setDeleteConfirm(null)}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openEditDialog(holiday)}
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-destructive hover:text-destructive"
                                                                        onClick={() => setDeleteConfirm(holiday.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No public holidays configured for {selectedYear}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Add holidays manually or import from a template
                    </p>
                    <Button className="mt-4" onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Holiday
                    </Button>
                </Card>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingHoliday ? 'Edit Holiday' : 'Add Public Holiday'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingHoliday
                                ? 'Update the holiday details below.'
                                : 'Enter the details for the new public holiday.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="holidayName">Holiday Name</Label>
                            <Input
                                id="holidayName"
                                placeholder="e.g. Christmas Day"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !formDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {formDate ? format(formDate, 'EEE, d MMM yyyy') : 'Select date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarPicker
                                        mode="single"
                                        selected={formDate}
                                        onSelect={setFormDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Region</Label>
                            <Select value={formRegion} onValueChange={setFormRegion}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {regions.map(r => (
                                        <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!formName || !formDate || isSaving}>
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            {editingHoliday ? 'Save Changes' : 'Add Holiday'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
