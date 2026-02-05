import { ThemeProvider } from "@/providers/theme-provider"
import { SonnerProvider } from "@/providers/sonner-provider"
import { QueryProvider } from "./providers/query-provider"
import { RouterProvider } from "react-router-dom"
import { router } from "@/router"

import { useEffect, useState } from "react"
import { useUserStore } from "@/stores/userStore"
import { dataverseAdapter } from "@/services/adapters"
import { Loader2 } from "lucide-react"

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
    <ThemeProvider>
      <SonnerProvider>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </SonnerProvider>
    </ThemeProvider>
  )
}