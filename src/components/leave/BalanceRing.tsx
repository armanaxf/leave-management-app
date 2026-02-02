// Leave Management App - Balance Ring Component
// The "memorable feature" - an animated circular progress ring

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BalanceRingProps {
    /** Total entitlement (e.g., 28 days) */
    total: number;
    /** Days used */
    used: number;
    /** Days pending approval */
    pending?: number;
    /** Size in pixels */
    size?: number;
    /** Stroke width */
    strokeWidth?: number;
    /** Color for used portion (default: primary) */
    usedColor?: string;
    /** Color for pending portion (default: warning) */
    pendingColor?: string;
    /** Animation delay in seconds */
    delay?: number;
    /** Show inner label */
    showLabel?: boolean;
    /** Custom label text (overrides default) */
    label?: string;
    /** Additional class names */
    className?: string;
}

export function BalanceRing({
    total,
    used,
    pending = 0,
    size = 120,
    strokeWidth = 8,
    usedColor = 'var(--primary)',
    pendingColor = 'var(--warning)',
    delay = 0,
    showLabel = true,
    label,
    className,
}: BalanceRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Calculate percentages
    const usedPercent = Math.min((used / total) * 100, 100);
    const pendingPercent = Math.min((pending / total) * 100, 100 - usedPercent);

    // Calculate stroke dash offsets
    const usedOffset = circumference - (usedPercent / 100) * circumference;
    const pendingOffset = circumference - (pendingPercent / 100) * circumference;

    // Available days
    const available = Math.max(0, total - used - pending);

    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center',
                className
            )}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Pending arc (behind used) */}
                {pending > 0 && (
                    <motion.circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={pendingColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{
                            strokeDashoffset: pendingOffset,
                            rotate: (usedPercent / 100) * 360,
                        }}
                        transition={{
                            duration: 1,
                            delay: delay + 0.3,
                            ease: [0.34, 1.56, 0.64, 1], // Spring-like
                        }}
                        style={{
                            transformOrigin: 'center',
                        }}
                    />
                )}

                {/* Used arc (on top) */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={usedColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: usedOffset }}
                    transition={{
                        duration: 1.2,
                        delay,
                        ease: [0.34, 1.56, 0.64, 1], // Spring-like overshoot
                    }}
                />
            </svg>

            {/* Center label */}
            {showLabel && (
                <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: delay + 0.5 }}
                >
                    {label ? (
                        <span className="text-sm font-medium text-muted-foreground">
                            {label}
                        </span>
                    ) : (
                        <>
                            <span className="text-2xl font-display font-bold text-foreground">
                                {available}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                days left
                            </span>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
}

// Compact variant for list items
export function BalanceRingCompact({
    total,
    used,
    pending = 0,
    className,
}: Pick<BalanceRingProps, 'total' | 'used' | 'pending' | 'className'>) {
    return (
        <BalanceRing
            total={total}
            used={used}
            pending={pending}
            size={40}
            strokeWidth={4}
            showLabel={false}
            className={className}
        />
    );
}
