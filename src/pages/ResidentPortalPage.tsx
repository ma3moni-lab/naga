import { useEffect } from "react";
import { useNavigate } from "react-router";
import ResidentPortal from "../portals/ResidentPortal";

export default function ResidentPortalPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!sessionStorage.getItem("naga_resident")) navigate("/admin");
  }, [navigate]);
  return <ResidentPortal onLogout={() => { sessionStorage.removeItem("naga_resident"); navigate("/admin"); }} />;
}
