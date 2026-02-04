// Leave Management App - Admin Settings Page

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Save,
    Globe,
    Calendar,
    Shield,
    BrainCircuit,
    Building,
    CheckCircle2,
    Database,
    List,
    CalendarDays,
    Users,
} from 'lucide-react';

import LeaveTypesManager from '@/components/admin/LeaveTypesManager';
import PublicHolidaysManager from '@/components/admin/PublicHolidaysManager';
import BalanceOverridesManager from '@/components/admin/BalanceOverridesManager';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        // In a real app, this would show a toast
    };

    const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 container mx-auto p-6 space-y-8 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        System Settings
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Configure global preferences, policies, and AI integrations.
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="lg"
                    className="w-full md:w-auto min-w-[140px] shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
                >
                    {isSaving ? (
                        <>
                            <span className="animate-spin mr-2 h-4 w-4 border-2 border-background/20 border-t-background rounded-full" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Layout */}
            <Tabs
                defaultValue="general"
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-8"
            >
                <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap gap-2 rounded-xl">
                    <TabsTrigger value="general" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
                        <Globe className="h-4 w-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="policy" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
                        <Calendar className="h-4 w-4 mr-2" />
                        Leave Policy
                    </TabsTrigger>
                    <TabsTrigger value="types" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
                        <List className="h-4 w-4 mr-2" />
                        Leave Types
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Holidays
                    </TabsTrigger>
                    <TabsTrigger value="balances" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
                        <Users className="h-4 w-4 mr-2" />
                        Balances
                    </TabsTrigger>
                    <TabsTrigger value="approvals" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
                        <Shield className="h-4 w-4 mr-2" />
                        Approvals
                    </TabsTrigger>
                    <TabsTrigger value="intelligence" className="py-2.5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">
                        <BrainCircuit className="h-4 w-4 mr-2" />
                        Intelligence
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" asChild>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="md:col-span-2 border-muted/40 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Organization Details</CardTitle>
                                    <CardDescription>Basic information used in emails and headers.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="appName">Application Name</Label>
                                        <Input
                                            id="appName"
                                            value={settings.appName}
                                            onChange={(e) => updateSetting('appName', e.target.value)}
                                            className="max-w-md bg-muted/20"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="region">Regional Format</Label>
                                        <Select
                                            value={settings.defaultRegion}
                                            onValueChange={(val) => updateSetting('defaultRegion', val)}
                                        >
                                            <SelectTrigger id="region" className="max-w-xs bg-muted/20">
                                                <SelectValue placeholder="Select region" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                                                <SelectItem value="US">United States (US)</SelectItem>
                                                <SelectItem value="EU">Europe (EU)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[13px] text-muted-foreground">
                                            Determines date formats (DD/MM/YYYY) and default currency symbols.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-muted/40 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="h-5 w-5 text-muted-foreground" />
                                        Fiscal Year
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fiscalStart">Year Start Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="fiscalStart"
                                                placeholder="MM-DD"
                                                value={settings.financialYearStart}
                                                onChange={(e) => updateSetting('financialYearStart', e.target.value)}
                                                className="max-w-[120px] bg-muted/20"
                                            />
                                        </div>
                                        <p className="text-[13px] text-muted-foreground">
                                            Leave balances reset on this date.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-muted/40 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5 text-muted-foreground" />
                                        Data Source
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/10">
                                        <div className="space-y-0.5">
                                            <Label>Connected to</Label>
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                                                Dataverse
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">Manage</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </TabsContent>

                {/* Leave Policy Settings */}
                <TabsContent value="policy" asChild>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <Card className="border-muted/40 shadow-sm">
                            <CardHeader>
                                <CardTitle>Entitlement & Carry Over</CardTitle>
                                <CardDescription>Define how leave balances are calculated and carried forward.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="defaultEntitlement" className="text-base font-semibold">Standard Annual Allowance</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="defaultEntitlement"
                                                    type="number"
                                                    value={settings.defaultAnnualEntitlement}
                                                    onChange={(e) => updateSetting('defaultAnnualEntitlement', parseInt(e.target.value))}
                                                    className="w-24 text-lg font-medium bg-muted/20"
                                                />
                                                <span className="text-muted-foreground">days per year</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Default value for new employees. Can be overridden per user.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 p-4 rounded-xl border bg-muted/10">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Allow Carry Over</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Employees can transfer unused days to next year
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.allowCarryOver}
                                                onCheckedChange={(checked) => updateSetting('allowCarryOver', checked)}
                                            />
                                        </div>

                                        {settings.allowCarryOver && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pl-4 border-l-2 border-primary/20 space-y-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="maxCarryOver">Maximum Days Transferable</Label>
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            id="maxCarryOver"
                                                            type="number"
                                                            value={settings.maxCarryOverDays}
                                                            onChange={(e) => updateSetting('maxCarryOverDays', parseInt(e.target.value))}
                                                            className="w-20 bg-background"
                                                        />
                                                        <span className="text-sm text-muted-foreground">days</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* Leave Types Management */}
                <TabsContent value="types" asChild>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.3 }}
                    >
                        <LeaveTypesManager />
                    </motion.div>
                </TabsContent>

                {/* Public Holidays Management */}
                <TabsContent value="holidays" asChild>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.3 }}
                    >
                        <PublicHolidaysManager />
                    </motion.div>
                </TabsContent>

                {/* Balance Overrides Management */}
                <TabsContent value="balances" asChild>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.3 }}
                    >
                        <BalanceOverridesManager />
                    </motion.div>
                </TabsContent>

                {/* Approval Settings */}
                <TabsContent value="approvals" asChild>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-6">
                                <Card className="h-full border-muted/40 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                            Approval Workflow
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Manager Approval Required</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Requests must be approved by a line manager
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.approvalRequired}
                                                onCheckedChange={(checked) => updateSetting('approvalRequired', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Self-Approval</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Managers can approve their own requests
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.allowSelfApproval}
                                                onCheckedChange={(checked) => updateSetting('allowSelfApproval', checked)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="h-full border-muted/40 shadow-sm bg-gradient-to-br from-card to-muted/20">
                                    <CardHeader>
                                        <CardTitle>Workflow Visualization</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col items-center justify-center py-6 gap-3 text-sm text-muted-foreground">
                                            <div className="p-3 rounded-lg border bg-background shadow-sm w-32 text-center">Employee</div>
                                            <div className="h-6 w-0.5 bg-border relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-1 rounded-full border">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-lg border shadow-sm w-32 text-center transition-colors",
                                                settings.approvalRequired ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground dashed border-dashed"
                                            )}>
                                                {settings.approvalRequired ? "Manager" : "Auto-Approve"}
                                            </div>
                                            <div className="h-6 w-0.5 bg-border" />
                                            <div className="p-3 rounded-lg border bg-success/10 text-success border-success/20 w-32 text-center font-medium">Approved</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>

                {/* Intelligence (AI) Settings */}
                <TabsContent value="intelligence" asChild>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 rounded-2xl border p-1">
                            <Card className="border-none shadow-none bg-transparent">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <BrainCircuit className="h-6 w-6 text-indigo-500" />
                                                AI Assistant & Conflict Guard
                                            </CardTitle>
                                            <CardDescription className="text-base">
                                                Configure how AI helps managers make better decisions.
                                            </CardDescription>
                                        </div>
                                        <Switch
                                            checked={settings.aiConflictDetection}
                                            onCheckedChange={(checked: boolean) => updateSetting('aiConflictDetection', checked)}
                                            className="data-[state=checked]:bg-indigo-600"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    {settings.aiConflictDetection ? (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-8 pt-4"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor="warningThreshold" className="font-semibold text-warning-foreground text-base">Warning Threshold (Medium)</Label>
                                                    <span className="text-2xl font-bold text-warning" aria-hidden="true">{settings.conflictWarningThreshold}%</span>
                                                </div>
                                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden" aria-hidden="true">
                                                    <div
                                                        className="h-full bg-warning transition-all duration-500"
                                                        style={{ width: `${settings.conflictWarningThreshold}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground" id="warning-desc">
                                                    <span>0%</span>
                                                    <p>Trigger warnings when {settings.conflictWarningThreshold}% or more of the team is absent.</p>
                                                    <span>100%</span>
                                                </div>
                                                <Input
                                                    id="warningThreshold"
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={settings.conflictWarningThreshold}
                                                    onChange={(e) => updateSetting('conflictWarningThreshold', parseInt(e.target.value))}
                                                    className="w-full"
                                                    aria-valuetext={`${settings.conflictWarningThreshold} percent`}
                                                    aria-describedby="warning-desc"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor="criticalThreshold" className="font-semibold text-destructive text-base">Critical Threshold (High)</Label>
                                                    <span className="text-2xl font-bold text-destructive" aria-hidden="true">{settings.conflictCriticalThreshold}%</span>
                                                </div>
                                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden" aria-hidden="true">
                                                    <div
                                                        className="h-full bg-destructive transition-all duration-500"
                                                        style={{ width: `${settings.conflictCriticalThreshold}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground" id="critical-desc">
                                                    <span>0%</span>
                                                    <p>Block requests or require skip-level approval when {settings.conflictCriticalThreshold}% absent.</p>
                                                    <span>100%</span>
                                                </div>
                                                <Input
                                                    id="criticalThreshold"
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={settings.conflictCriticalThreshold}
                                                    onChange={(e) => updateSetting('conflictCriticalThreshold', parseInt(e.target.value))}
                                                    className="w-full accent-destructive"
                                                    aria-valuetext={`${settings.conflictCriticalThreshold} percent`}
                                                    aria-describedby="critical-desc"
                                                />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                            <BrainCircuit className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p>AI features are currently disabled.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
