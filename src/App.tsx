import { ThemeProvider } from "@/providers/theme-provider"
import { SonnerProvider } from "@/providers/sonner-provider"
import { QueryProvider } from "./providers/query-provider"
import { RouterProvider } from "react-router-dom"
import { router } from "@/router"

import { Component, useEffect, useState } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { useUserStore } from "@/stores/userStore"
import { dataverseAdapter } from "@/services/adapters"
import { Loader2, RefreshCw } from "lucide-react"

/**
 * Error boundary to prevent unhandled render errors from crashing the
 * entire Power Apps custom page (which shows "This app stopped working").
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application error caught by ErrorBoundary:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <RefreshCw className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  const { setCurrentUser } = useUserStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initUser = async () => {
      try {
        console.log("Initializing user from Dataverse...");
        const user = await dataverseAdapter.getCurrentUser();
        if (user) {
          console.log("User found:", user.displayName);
          setCurrentUser(user);
        } else {
          console.warn("No user found.");
        }
      } catch (error) {
        console.error("Failed to initialize user:", error);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, [setCurrentUser])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SonnerProvider>
          <QueryProvider>
            <RouterProvider router={router} />
          </QueryProvider>
        </SonnerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
