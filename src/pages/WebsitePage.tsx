import { useNavigate } from "react-router";
import Website from "../website/Website";

export default function WebsitePage() {
  const navigate = useNavigate();
  return <Website onEnterPlatform={() => navigate("/admin")} />;
}
