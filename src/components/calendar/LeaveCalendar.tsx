// Leave Management App - Leave Calendar Component

import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isWeekend
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type { LeaveRequest, PublicHoliday } from '@/types';

interface LeaveCalendarProps {
    /** Array of leave requests to display */
    requests?: LeaveRequest[];
    /** Array of public holidays */
    publicHolidays?: PublicHoliday[];
    /** Callback when a date is clicked */
    onDateClick?: (date: Date) => void;
    /** Custom class name */
    className?: string;
}

export function LeaveCalendar({
    requests = [],
    publicHolidays = [],
    onDateClick,
    className
}: LeaveCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Navigation
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Calendar grid generation
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Helper to get events for a day
    const getEventsForDay = (date: Date) => {
        const dayRequests = requests.filter(req => {
            // Simple inclusive check - real app might need more precise overlap logic for partial days
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
        });

        const holiday = publicHolidays.find(h => isSameDay(new Date(h.date), date));

        return { requests: dayRequests, holiday };
    };

    return (
        <div className={cn("bg-card border rounded-lg shadow-sm overflow-hidden", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-display font-semibold text-lg text-foreground">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-2 text-xs">
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 auto-rows-[minmax(80px,_1fr)] divide-x divide-y">
                {calendarDays.map((day) => {
                    const { requests: dayRequests, holiday } = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isDayToday = isToday(day);
                    const isDayWeekend = isWeekend(day);

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => onDateClick?.(day)}
                            className={cn(
                                "relative p-2 transition-colors hover:bg-muted/30 flex flex-col gap-1",
                                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                isDayWeekend && "bg-muted/5",
                                onDateClick && "cursor-pointer"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                    isDayToday && "bg-primary text-primary-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {/* Holiday Indicator */}
                                {holiday && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="h-1.5 w-1.5 rounded-full bg-success opacity-80" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{holiday.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>

                            {/* Leave Bars */}
                            <div className="flex flex-col gap-1 mt-1">
                                {dayRequests.map((req) => (
                                    <TooltipProvider key={req.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="text-[10px] px-1 py-0.5 rounded truncate font-medium border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors"
                                                    style={{
                                                        backgroundColor: `${req.leaveType?.color}20`, // 20 = ~12% opacity hex
                                                        color: req.leaveType?.color || 'currentColor'
                                                    }}
                                                >
                                                    {req.employeeName || req.leaveType?.name || 'Leave'}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold">{req.employeeName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {req.leaveType?.name} • {req.status}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
