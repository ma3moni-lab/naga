import { createBrowserRouter, Outlet, useLocation } from "react-router";
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { PageSkeleton, WebSkeleton } from "@/components/PageSkeleton";
import DemoBanner from "@/components/DemoBanner";

const WebsitePage = lazy(() => import("./pages/WebsitePage"));
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const ResidentPortalPage = lazy(() => import("./pages/ResidentPortalPage"));
const GuestPortalPage = lazy(() => import("./pages/GuestPortalPage"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const PresentationPage = lazy(() => import("./pages/PresentationPage"));
const HopePage = lazy(() => import("./pages/HopePage"));

function Wrap({ children, isAdmin }: { children: ReactNode; isAdmin?: boolean }) {
  const location = useLocation();
  return (
    <Suspense fallback={isAdmin ? <PageSkeleton /> : <WebSkeleton />}>
      <div
        key={location.pathname}
        style={{ animation: "pageFadeIn 0.22s ease-out", height: "100%" }}
      >
        {children}
      </div>
    </Suspense>
  );
}

function RootLayout() {
  return (
    <>
      <DemoBanner />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Wrap><WebsitePage /></Wrap> },
      { path: "/admin", element: <Wrap><PortalLogin /></Wrap> },
      { path: "/admin/resident", element: <Wrap isAdmin><ResidentPortalPage /></Wrap> },
      { path: "/admin/guest", element: <Wrap isAdmin><GuestPortalPage /></Wrap> },
      { path: "/admin/staff", element: <Wrap><StaffLogin /></Wrap> },
      { path: "/admin/staff/dashboard", element: <Wrap isAdmin><StaffDashboard /></Wrap> },
      { path: "/presentation", element: <Wrap><PresentationPage /></Wrap> },
      { path: "/hope", element: <Wrap><HopePage /></Wrap> },
    ],
  },
]);
