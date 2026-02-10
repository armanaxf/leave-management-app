// Leave Management App - Team Overview Page

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, Grid, List as ListIcon, MoreHorizontal, Calendar, Briefcase, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/layout/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { useTeamMembers, useLeaveRequests } from '@/hooks';

import { format } from 'date-fns';

export default function TeamOverview() {
    const { data: teamMembers = [], isLoading } = useTeamMembers();
    const { data: allRequests = [] } = useLeaveRequests();
    const pendingCount = allRequests.filter(r => r.status === 'pending').length;
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

    // Filter team members
    const filteredMembers = teamMembers.filter(member =>
        member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.jobTitle && member.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
                    Team Overview
                </h1>
                <p className="text-muted-foreground text-lg">
                    Manage your direct reports ({teamMembers.length})
                </p>
            </div>

            {/* Stats Cards - Bento Style */}
            <div className="grid gap-4 md:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Headcount</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{teamMembers.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Direct Reports</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="overflow-hidden border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Out Today</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground">
                                {teamMembers.filter(m => m.currentStatus === 'on-leave').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {teamMembers.filter(m => m.currentStatus === 'on-leave').length > 0 ? 'Requires coverage' : 'Full team attendance'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="overflow-hidden border-l-4 border-l-muted shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <Briefcase className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{pendingCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Filter and View Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, role, or department..."
                        className="pl-9 h-10 bg-background/50 border-input transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search team members"
                    />
                </div>

                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="h-8 w-8 p-0"
                        aria-label="Grid view"
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-8 w-8 p-0"
                        aria-label="List view"
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div
                        key="grid"
                        variants={container}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        {filteredMembers.map((member) => (
                            <motion.div key={member.id} variants={item}>
                                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-t-4 border-t-transparent hover:border-t-primary group">
                                    <CardHeader className="text-center pt-8 pb-4 relative">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                    <DropdownMenuItem>Leave History</DropdownMenuItem>
                                                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mx-auto mb-3">
                                            <UserAvatar
                                                name={member.displayName}
                                                size="xl"
                                                showStatus
                                                status={member.currentStatus === 'on-leave' ? 'away' : 'online'}
                                                className="h-20 w-20 ring-4 ring-background shadow-lg"
                                            />
                                        </div>
                                        <CardTitle className="text-lg">{member.displayName}</CardTitle>
                                        <CardDescription className="font-medium text-primary/80">{member.jobTitle}</CardDescription>
                                        <p className="text-xs text-muted-foreground mt-1">{member.department}</p>
                                    </CardHeader>
                                    <CardContent className="bg-muted/30 pt-6 pb-6 text-center border-t border-border/50">
                                        {member.currentStatus === 'on-leave' ? (
                                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-warning bg-warning/10 px-3 py-1 rounded-full">
                                                <Calendar className="h-3 w-3" />
                                                On Leave
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                                </span>
                                                Available
                                            </div>
                                        )}

                                        {member.upcomingLeave && (
                                            <div className="mt-4 text-xs text-muted-foreground bg-background/50 p-2 rounded border">
                                                <span className="block font-medium mb-0.5">Upcoming Absence</span>
                                                {format(member.upcomingLeave.startDate, 'MMM d')} - {member.upcomingLeave.leaveType}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Employee</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Upcoming Leave</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMembers.map((member) => (
                                        <TableRow key={member.id} className="group">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar
                                                        name={member.displayName}
                                                        status={member.currentStatus === 'on-leave' ? 'away' : 'online'}
                                                        showStatus
                                                    />
                                                    <div>
                                                        <div className="font-semibold">{member.displayName}</div>
                                                        <div className="text-xs text-muted-foreground">{member.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{member.jobTitle}</span>
                                                    <span className="text-xs text-muted-foreground">{member.department}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {member.currentStatus === 'on-leave' ? (
                                                    <Badge variant="outline" className="border-warning text-warning bg-warning/10">
                                                        On Leave
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-success text-success bg-success/10">
                                                        Available
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {member.upcomingLeave ? (
                                                    <div className="text-sm flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{format(member.upcomingLeave.startDate, 'MMM d')}</span>
                                                        <span className="text-muted-foreground text-xs border px-1 rounded">
                                                            {member.upcomingLeave.leaveType}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Email ${member.displayName}`}>
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More actions">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
