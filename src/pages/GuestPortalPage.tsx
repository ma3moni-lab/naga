import { useEffect } from "react";
import { useNavigate } from "react-router";
import GuestPortal from "../portals/GuestPortal";

export default function GuestPortalPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!sessionStorage.getItem("naga_guest")) navigate("/admin");
  }, [navigate]);
  return <GuestPortal onLogout={() => { sessionStorage.removeItem("naga_guest"); navigate("/admin"); }} />;
}
