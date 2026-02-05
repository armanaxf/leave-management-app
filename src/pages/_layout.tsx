import { Outlet, NavLink } from "react-router-dom"
import { ModeToggle } from "@/components/mode-toggle"
import { Palmtree } from "lucide-react"
import { useUserStore } from "@/stores/userStore"
import { useSettings } from "@/hooks"

type LayoutProps = { showHeader?: boolean }

export default function Layout({ showHeader = true }: LayoutProps) {
  const { isAdmin } = useUserStore()
  const { data: settings } = useSettings()

  const appName = settings?.find(s => s.key === 'appName')?.value || "Leave Manager"
  const headerIcon = settings?.find(s => s.key === 'headerIcon')?.value || ""

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {/* Header - Always visible */}
      <header className="sticky top-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl h-full px-6 flex items-center justify-between">
          {/* Logo & Nav */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 font-display font-semibold text-foreground">
              {headerIcon ? (
                <img
                  src={headerIcon}
                  alt=""
                  className="h-5 w-5 object-contain"
                  aria-hidden="true"
                />
              ) : (
                <Palmtree className="h-5 w-5 text-primary" aria-hidden="true" />
              )}
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
          </div>
        </div>
      </header >

      <main id="main-content" className="flex-1 flex" tabIndex={-1}>
        <div className="flex-1 mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div >
  )
}