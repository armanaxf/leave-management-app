
import { useEffect, useState } from "react"
import { Outlet, NavLink } from "react-router-dom"
import { ModeToggle } from "@/components/mode-toggle"
import { Palmtree } from "lucide-react"
import { useUserStore } from "@/stores/userStore"
import { useSettings } from "@/hooks"
import { UserAvatar } from "@/components/layout/UserAvatar"
import { getContext, type IContext } from "@microsoft/power-apps/app"

type LayoutProps = { showHeader?: boolean }

export default function Layout({ showHeader = true }: LayoutProps) {
  const { isAdmin, currentUser } = useUserStore()
  const { data: settings } = useSettings()
  // Use indexed access type for user property
  const [contextUser, setContextUser] = useState<IContext['user'] | null>(null)

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const context = await getContext()
        if (context?.user) {
          console.log("Power Apps Context User:", context.user)
          setContextUser(context.user)
        }
      } catch (e) {
        console.warn("Failed to get Power Apps context (likely local dev):", e)
      }
    }
    fetchContext()
  }, [])

  const appName = settings?.find(s => s.key === 'appName')?.value || "Leave Manager"
  const displayName = contextUser?.fullName || currentUser?.displayName || "User"
  const userStatus = contextUser ? "online" : "offline" // Simple indicator

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header - Always visible */}
      <header className="sticky top-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl h-full px-6 flex items-center justify-between">
          {/* Logo & Nav */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 font-display font-semibold text-foreground">
              <Palmtree className="h-5 w-5 text-primary" />
              <span>{appName}</span>
            </NavLink>

            {showHeader && (
              <nav className="hidden md:flex items-center gap-4">
                <NavLink to="/" end
                  className={({ isActive }) =>
                    `text-sm transition-colors hover:text-foreground ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink to="/requests"
                  className={({ isActive }) =>
                    `text-sm transition-colors hover:text-foreground ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`
                  }
                >
                  My Requests
                </NavLink>
                <NavLink to="/calendar"
                  className={({ isActive }) =>
                    `text-sm transition-colors hover:text-foreground ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`
                  }
                >
                  Team Calendar
                </NavLink>
                <NavLink to="/approvals"
                  className={({ isActive }) =>
                    `text-sm transition-colors hover:text-foreground ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`
                  }
                >
                  Approvals
                </NavLink>
                <NavLink to="/team"
                  className={({ isActive }) =>
                    `text-sm transition-colors hover:text-foreground ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`
                  }
                >
                  Team Overview
                </NavLink>
                {isAdmin() && (
                  <NavLink to="/admin"
                    className={({ isActive }) =>
                      `text-sm transition-colors hover:text-foreground ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`
                    }
                  >
                    Settings
                  </NavLink>
                )}
              </nav>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserAvatar
              name={displayName}
              className="ml-2"
              showStatus={true}
              status={userStatus}
            />
          </div>
        </div>
      </header >

      <main className="flex-1 flex">
        <div className="flex-1 mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div >
  )
}