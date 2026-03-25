import { Outlet } from "react-router-dom";
import BottomNav from "@/components/social/BottomNav";
import SocialDesktopRail from "@/components/social/SocialDesktopRail";

/**
 * Shell layout for the authenticated social mobile experience.
 * Renders bottom navigation and safe-area padding for content.
 */
const SocialShell = () => (
  <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(178,241,52,0.1),transparent_26%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_24%)]" />
    <div className="relative mx-auto w-full max-w-[1600px] lg:grid lg:min-h-screen lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 lg:px-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:px-8">
      <SocialDesktopRail />

      <main className="min-w-0 lg:py-8">
        <div className="pb-20 lg:min-h-[calc(100vh-4rem)] lg:overflow-hidden lg:rounded-[2rem] lg:border lg:border-border/60 lg:bg-background/60 lg:pb-0 lg:shadow-card">
          <Outlet />
        </div>
      </main>
    </div>
    <BottomNav />
  </div>
);

export default SocialShell;
