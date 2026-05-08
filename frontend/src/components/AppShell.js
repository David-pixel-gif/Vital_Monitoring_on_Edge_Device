import { useEffect, useState } from "react";
import Icon from "./Icon";
import SidebarNav from "./SidebarNav";
import Topbar from "./Topbar";

export default function AppShell({ topbarAction, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileNavOpen]);

  return (
    <div className="vp-app-shell">
      <SidebarNav />
      <div className="vp-main-shell">
        <Topbar titleAction={topbarAction} onOpenNav={() => setMobileNavOpen(true)} />
        <main className="vp-main-content">{children}</main>
      </div>
      <div className={`vp-mobile-drawer ${mobileNavOpen ? "is-open" : ""}`} aria-hidden={!mobileNavOpen}>
        <button type="button" className="vp-mobile-drawer-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />
        <div className="vp-mobile-drawer-panel">
          <div className="vp-mobile-drawer-header">
            <strong>Navigation</strong>
            <button type="button" className="vp-icon-button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <SidebarNav mobile onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>
    </div>
  );
}
