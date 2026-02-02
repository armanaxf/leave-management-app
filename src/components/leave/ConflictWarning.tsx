// Leave Management App - Conflict Warning Component
// AI-powered warning banner showing team conflicts

import { motion } from 'framer-motion';
import { AlertTriangle, Users, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConflictAnalysis, ConflictSeverity } from '@/types';

interface ConflictWarningProps {
    /** Conflict analysis from AI service */
    analysis: ConflictAnalysis;
    /** Callback when dismissed */
    onDismiss?: () => void;
    /** Additional class names */
    className?: string;
}

const severityConfig: Record<
    ConflictSeverity,
    { bg: string; border: string; icon: string; text: string }
> = {
    low: {
        bg: 'bg-muted/50',
        border: 'border-muted',
        icon: 'text-muted-foreground',
        text: 'text-muted-foreground',
    },
    medium: {
        bg: 'bg-warning/10',
        border: 'border-warning/30',
        icon: 'text-warning',
        text: 'text-foreground',
    },
    high: {
        bg: 'bg-destructive/10',
        border: 'border-destructive/30',
        icon: 'text-destructive',
        text: 'text-foreground',
    },
};

export function ConflictWarning({
    analysis,
    onDismiss,
    className,
}: ConflictWarningProps) {
    if (!analysis.hasConflict) return null;

    const config = severityConfig[analysis.severity];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'rounded-lg border p-4',
                config.bg,
                config.border,
                className
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn('mt-0.5 shrink-0', config.icon)}>
                    <AlertTriangle className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Message */}
                    <p className={cn('text-sm font-medium', config.text)}>
                        {analysis.message}
                    </p>

                    {/* Team coverage */}
                    {analysis.teamCoveragePercent > 0 && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {analysis.overlappingRequests.length} team member
                                {analysis.overlappingRequests.length !== 1 ? 's' : ''} off
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {Math.round(analysis.teamCoveragePercent)}% team unavailable
                            </span>
                        </div>
                    )}

                    {/* Overlapping members */}
                    {analysis.overlappingRequests.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {analysis.overlappingRequests.slice(0, 5).map((request) => (
                                <span
                                    key={request.id}
                                    className="inline-flex items-center rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border"
                                >
                                    {request.employeeName || request.employeeEmail}
                                </span>
                            ))}
                            {analysis.overlappingRequests.length > 5 && (
                                <span className="inline-flex items-center rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border">
                                    +{analysis.overlappingRequests.length - 5} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Suggestions */}
                    {analysis.suggestions && analysis.suggestions.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                            {analysis.suggestions.map((suggestion, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-muted-foreground/60">→</span>
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Dismiss button */}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={cn(
                            'shrink-0 rounded-md p-1 hover:bg-background/50 transition-colors',
                            config.icon
                        )}
                        aria-label="Dismiss warning"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

/**
 * Compact inline variant for approval lists
 */
export function ConflictBadge({
    severity,
    message,
}: {
    severity: ConflictSeverity;
    message?: string;
}) {
    if (severity === 'low') return null;

    const config = severityConfig[severity];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                config.bg,
                config.text
            )}
            title={message}
        >
            <AlertTriangle className="h-3 w-3" />
            {severity === 'high' ? 'Critical' : 'Warning'}
        </span>
    );
}
