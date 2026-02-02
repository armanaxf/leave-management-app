import { createBrowserRouter } from "react-router-dom"
import Layout from "@/pages/_layout"
import NotFoundPage from "@/pages/not-found"

// Employee Pages
import EmployeeDashboard from "@/pages/employee/Dashboard"
import RequestLeave from "@/pages/employee/RequestLeave"
import MyRequests from "@/pages/employee/MyRequests"
import TeamCalendar from "@/pages/employee/TeamCalendar"

// Manager Pages
// Manager Pages
import Approvals from "@/pages/manager/Approvals"
import TeamOverview from "@/pages/manager/TeamOverview"
import AdminSettings from "@/pages/admin/Settings"

// IMPORTANT: Do not remove or modify the code below!
// Normalize basename when hosted in Power Apps
const BASENAME = new URL(".", location.href).pathname
if (location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout showHeader={true} />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <EmployeeDashboard /> },
      { path: "request", element: <RequestLeave /> },
      { path: "requests", element: <MyRequests /> },
      { path: "calendar", element: <TeamCalendar /> },
      { path: "approvals", element: <Approvals /> },
      // Future routes:
      { path: "team", element: <TeamOverview /> },
      { path: "admin", element: <AdminSettings /> },
    ],
  },
], {
  basename: BASENAME // IMPORTANT: Set basename for proper routing when hosted in Power Apps
})