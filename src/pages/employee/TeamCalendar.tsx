// Leave Management App - Team Calendar Page

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveCalendar } from '@/components/calendar/LeaveCalendar';
import { UserAvatar } from "@/components/layout/UserAvatar";
import { format, isSameDay } from 'date-fns';
import { Users, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useLeaveRequests, useLeaveTypes, usePublicHolidays, useTeamMembers } from '@/hooks';


export default function TeamCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const currentYear = new Date().getFullYear();

    // Fetch Data
    const { data: teamMembers, isLoading: membersLoading } = useTeamMembers();
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();
    const { data: publicHolidays, isLoading: holidaysLoading } = usePublicHolidays('GB', currentYear);

    // Fetch all requests (Dataverse security will filter what we can see)
    // We filter for "approved" status usually for calendar, but let's fetch all active
    const { data: leaveRequests, isLoading: requestsLoading } = useLeaveRequests({
        status: ['approved', 'pending']
    });

    const isLoading = membersLoading || typesLoading || holidaysLoading || requestsLoading;

    // Filter requests for selected date
    const selectedDateRequests = selectedDate && leaveRequests
        ? leaveRequests.filter(req => {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return selectedDate >= start && selectedDate <= end;
        })
        : [];

    const selectedHoliday = selectedDate && publicHolidays
        ? publicHolidays.find(h => isSameDay(new Date(h.date), selectedDate))
        : undefined;

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                        Team Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        See who's out and plan ahead
                    </p>
                </div>

                {/* Team Avatars Summary */}
                <div className="flex items-center -space-x-2">
                    {teamMembers?.slice(0, 5).map(member => (
                        <UserAvatar
                            key={member.id}
                            name={member.displayName}
                            className="border-2 border-background w-8 h-8"
                        />
                    ))}
                    {(teamMembers?.length || 0) > 5 && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[10px] font-medium border-2 border-background">
                            +{(teamMembers?.length || 0) - 5}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Calendar - Span 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <LeaveCalendar
                        requests={leaveRequests || []}
                        publicHolidays={publicHolidays || []}
                        onDateClick={setSelectedDate}
                        className="min-h-[500px]"
                    />

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-card p-4 rounded-lg border">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-success"></span>
                            Public Holiday
                        </div>
                        {leaveTypes?.map(type => (
                            <div key={type.id} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full opacity-20" style={{ backgroundColor: type.color }}></span>
                                <span style={{ color: type.color }} className="font-medium">{type.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar - Selected Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                {selectedDate ? format(selectedDate, 'EEEE, d MMMM') : 'Select a date'}
                            </CardTitle>
                            <CardDescription>
                                {selectedDate ? 'Leave details for this day' : 'Click on the calendar to view details'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedHoliday && (
                                <div className="p-3 bg-success/10 text-success rounded-md flex items-center gap-2 text-sm font-medium">
                                    <span className="text-xl">🎉</span>
                                    {selectedHoliday.name}
                                </div>
                            )}

                            {selectedDate && selectedDateRequests.length === 0 && !selectedHoliday && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Everyone is available</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {selectedDateRequests.map(req => (
                                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <UserAvatar name={req.employeeName || 'Unknown'} size="sm" />
                                        <div>
                                            <p className="text-sm font-medium leading-none mb-1">{req.employeeName}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.leaveType?.color }}></span>
                                                {req.leaveType?.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Team Leave */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-muted-foreground font-medium uppercase tracking-wider text-xs">
                                Upcoming - Who's Away
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {leaveRequests
                                ?.filter(r => new Date(r.startDate) > new Date() && r.status === 'approved')
                                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                                .slice(0, 5)
                                .map(req => (
                                    <div key={req.id} className="flex items-start gap-3">
                                        <UserAvatar name={req.employeeName || ''} size="sm" className="mt-0.5" />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium block">{req.employeeName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(req.startDate), 'MMM d')} - {format(new Date(req.endDate), 'MMM d')}
                                            </span>
                                        </div>
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded font-medium border"
                                            style={{
                                                color: req.leaveType?.color,
                                                borderColor: `${req.leaveType?.color}40`,
                                                backgroundColor: `${req.leaveType?.color}10`
                                            }}
                                        >
                                            {req.leaveType?.name}
                                        </span>
                                    </div>
                                ))}
                            {(!leaveRequests || leaveRequests.filter(r => new Date(r.startDate) > new Date() && r.status === 'approved').length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No upcoming leave scheduled.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
