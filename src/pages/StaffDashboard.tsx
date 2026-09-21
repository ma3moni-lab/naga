import { useEffect } from "react";
import { useNavigate } from "react-router";
import Platform from "../platform/Platform";
import { StaffRole } from "../portals/PlatformGate";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem("naga_staff");
  const role: StaffRole = (raw ? JSON.parse(raw).role : null) ?? "ceo";

  useEffect(() => {
    if (!raw) navigate("/admin/staff");
  }, [navigate, raw]);

  return (
    <Platform
      staffRole={role}
      onExitPlatform={() => { sessionStorage.removeItem("naga_staff"); navigate("/admin/staff"); }}
    />
  );
}
