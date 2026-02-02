import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
    name: string
    image?: string
    size?: "xs" | "sm" | "default" | "lg" | "xl"
    className?: string
    showStatus?: boolean
    status?: "online" | "offline" | "away" | "busy"
}

export function UserAvatar({
    name,
    image,
    size = "default",
    className,
    showStatus = false,
    status = "online",
}: UserAvatarProps) {
    // Generate initials
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    // Size classes
    const sizeClasses = {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-xl",
    }

    // Status color classes
    const statusColors = {
        online: "bg-success",
        offline: "bg-muted-foreground",
        away: "bg-warning",
        busy: "bg-destructive",
    }

    const sizeClass = sizeClasses[size] || sizeClasses.default

    return (
        <div className="relative inline-block">
            <Avatar className={cn(sizeClass, className)}>
                <AvatarImage src={image} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {initials}
                </AvatarFallback>
            </Avatar>

            {showStatus && (
                <span
                    className={cn(
                        "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
                        statusColors[status],
                        size === "xs" ? "h-1.5 w-1.5" :
                            size === "sm" ? "h-2 w-2" :
                                size === "default" ? "h-3 w-3" :
                                    "h-3.5 w-3.5"
                    )}
                />
            )}
        </div>
    )
}
