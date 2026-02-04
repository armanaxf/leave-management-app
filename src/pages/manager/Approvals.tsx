// Leave Management App - Manager Approvals Page

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Users, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LeaveRequestCard } from '@/components/leave/LeaveRequestCard';
import { useLeaveRequests, useLeaveTypes, useApproveLeaveRequest, useRejectLeaveRequest } from '@/hooks';
import { useUserStore } from '@/stores';
import type { LeaveRequest } from '@/types';

// Container animation
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export default function Approvals() {
    const { currentUser } = useUserStore();

    // Fetch data using hooks
    const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();
    const { data: allRequests, isLoading: requestsLoading } = useLeaveRequests();
    const approveMutation = useApproveLeaveRequest();
    const rejectMutation = useRejectLeaveRequest();

    const [activeTab, setActiveTab] = useState('pending');
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    const isLoading = typesLoading || requestsLoading;

    // Separate pending and processed requests
    const pendingRequests = useMemo(() =>
        allRequests?.filter(r => r.status === 'pending') || [],
        [allRequests]
    );

    const processedRequests = useMemo(() =>
        allRequests?.filter(r => r.status === 'approved' || r.status === 'rejected') || [],
        [allRequests]
    );

    // Filter pending requests
    const filteredPending = useMemo(() => {
        if (filterType === 'all') return pendingRequests;
        // Note: conflict filtering will be added when AI service is integrated
        if (filterType === 'conflicts') return pendingRequests;
        return pendingRequests.filter(r => r.leaveTypeId === filterType);
    }, [filterType, pendingRequests]);

    // Handle approve
    const handleApprove = async (id: string) => {
        if (!currentUser) return;
        setProcessing(id);
        try {
            await approveMutation.mutateAsync({
                id,
                approverId: currentUser.id,
                approverName: currentUser.displayName,
            });
        } catch (error) {
            console.error('Failed to approve request:', error);
        }
        setProcessing(null);
    };

    // Handle reject
    const handleRejectClick = (request: LeaveRequest) => {
        setSelectedRequest(request);
        setRejectComment('');
        setRejectDialogOpen(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedRequest || !currentUser) return;
        setProcessing(selectedRequest.id);
        try {
            await rejectMutation.mutateAsync({
                id: selectedRequest.id,
                approverId: currentUser.id,
                approverName: currentUser.displayName,
                comments: rejectComment || undefined,
            });
            setRejectDialogOpen(false);
        } catch (error) {
            console.error('Failed to reject request:', error);
        }
        setProcessing(null);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                        Approvals
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review and manage leave requests from your team
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {pendingRequests.length} pending
                    </span>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="pending" className="gap-2">
                            Pending
                            {pendingRequests.length > 0 && (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="processed">Processed</TabsTrigger>
                    </TabsList>

                    {activeTab === 'pending' && (
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Requests</SelectItem>
                                <SelectItem value="conflicts">
                                    <span className="flex items-center gap-2">
                                        With Conflicts
                                    </span>
                                </SelectItem>
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
                    )}
                </div>

                <TabsContent value="pending" className="mt-4">
                    {filteredPending.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Check className="mx-auto h-12 w-12 text-success/50" />
                            <p className="mt-2 text-muted-foreground">No pending requests</p>
                        </Card>
                    ) : (
                        <motion.div
                            className="space-y-3"
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {filteredPending.map((request) => (
                                <motion.div key={request.id} variants={item}>
                                    <LeaveRequestCard
                                        request={request}
                                        showEmployee
                                        showActions
                                        onApprove={handleApprove}
                                        onReject={() => handleRejectClick(request)}
                                        className={processing === request.id ? 'opacity-50 pointer-events-none' : ''}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="processed" className="mt-4">
                    {processedRequests.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">No processed requests yet</p>
                        </Card>
                    ) : (
                        <motion.div
                            className="space-y-3"
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {processedRequests.map((request) => (
                                <motion.div key={request.id} variants={item}>
                                    <LeaveRequestCard request={request} showEmployee />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject {selectedRequest?.employeeName}'s leave request?
                            You can provide a reason to help them understand.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="rejectComment">Reason (optional)</Label>
                        <Textarea
                            id="rejectComment"
                            placeholder="Add a comment explaining why this request was rejected..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={processing !== null}
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <X className="mr-2 h-4 w-4" />
                            )}
                            Reject Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
