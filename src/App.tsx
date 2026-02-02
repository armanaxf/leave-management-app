import { ThemeProvider } from "@/providers/theme-provider"
import { SonnerProvider } from "@/providers/sonner-provider"
import { QueryProvider } from "./providers/query-provider"
import { RouterProvider } from "react-router-dom"
import { router } from "@/router"

import { useEffect } from "react"
import { useUserStore } from "@/stores/userStore"
import { mockTeamMembers } from "@/lib/mockData"

export default function App() {
  const { setCurrentUser } = useUserStore()

  useEffect(() => {
    // TEMPORARY: Set current user to an admin for development/demo
    const adminUser = mockTeamMembers[0];

    setCurrentUser({
      ...adminUser,
      roles: ['admin', 'manager', 'employee'], // Ensure admin role is present
      directReports: [],
      teamMembers: []
    })
  }, [setCurrentUser])

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