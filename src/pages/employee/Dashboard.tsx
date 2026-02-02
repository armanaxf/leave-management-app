// Leave Management App - Employee Dashboard Page

import { motion } from 'framer-motion';
import { Plus, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceRing } from '@/components/leave/BalanceRing';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import { mockBalances, mockRequests } from '@/lib/mockData';

// Container animation
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your leave and time off
                    </p>
                </div>
                <Button asChild>
                    <Link to="/request">
                        <Plus className="mr-2 h-4 w-4" />
                        Request Leave
                    </Link>
                </Button>
            </div>

            <motion.div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* Leave Balances */}
                {mockBalances.map((balance, index) => (
                    <motion.div key={balance.id} variants={item}>
                        <Card className="relative overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base font-medium">
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: balance.leaveType?.color }}
                                    />
                                    {balance.leaveType?.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-6">
                                <BalanceRing
                                    total={balance.entitlement + balance.carryOver}
                                    used={balance.used}
                                    pending={balance.pending}
                                    size={100}
                                    strokeWidth={8}
                                    usedColor={balance.leaveType?.color}
                                    delay={index * 0.15}
                                />
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Entitlement</span>
                                        <span className="font-medium">{balance.entitlement}</span>
                                    </div>
                                    {balance.carryOver > 0 && (
                                        <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Carry over</span>
                                            <span className="font-medium">+{balance.carryOver}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Used</span>
                                        <span className="font-medium">{balance.used}</span>
                                    </div>
                                    {balance.pending > 0 && (
                                        <div className="flex justify-between gap-4">
                                            <span className="text-warning">Pending</span>
                                            <span className="font-medium text-warning">
                                                {balance.pending}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Upcoming Leave */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-semibold">Your Requests</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/requests">
                            View all
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <motion.div
                    className="space-y-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {mockRequests.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-2 text-muted-foreground">No upcoming leave</p>
                            <Button className="mt-4" asChild>
                                <Link to="/request">Request Leave</Link>
                            </Button>
                        </Card>
                    ) : (
                        mockRequests.map((request) => (
                            <motion.div key={request.id} variants={item}>
                                <LeaveRequestCard
                                    request={request}
                                    onCancel={(id) => console.log('Cancel', id)}
                                />
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </div>
        </div>
    );
}
