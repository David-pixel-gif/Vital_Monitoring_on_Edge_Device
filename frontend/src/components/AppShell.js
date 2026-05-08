import SidebarNav from "./SidebarNav";
import Topbar from "./Topbar";

export default function AppShell({ topbarAction, children }) {
  return (
    <div className="vp-app-shell">
      <SidebarNav />
      <div className="vp-main-shell">
        <Topbar titleAction={topbarAction} />
        <main className="vp-main-content">{children}</main>
      </div>
    </div>
  );
}
