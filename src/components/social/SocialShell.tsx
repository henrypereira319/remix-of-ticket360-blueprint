import { Outlet } from "react-router-dom";
import BottomNav from "@/components/social/BottomNav";

/**
 * Shell layout for the authenticated social mobile experience.
 * Renders bottom navigation and safe-area padding for content.
 */
const SocialShell = () => (
  <div className="relative min-h-screen bg-background text-foreground">
    <div className="pb-20">
      <Outlet />
    </div>
    <BottomNav />
  </div>
);

export default SocialShell;
