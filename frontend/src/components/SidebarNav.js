import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import StatusBadge from "./StatusBadge";

const NAV_ITEMS = [
  { to: "/overview", label: "Dashboard", icon: "dashboard" },
  { to: "/monitoring", label: "Live Monitoring", icon: "monitor" },
  { to: "/patients", label: "Patients", icon: "patients" },
  { to: "/alerts", label: "Alerts", icon: "alerts" },
  { to: "/history", label: "History / Logs", icon: "history" },
  { to: "/devices", label: "Devices", icon: "devices" },
  { to: "/reports", label: "Reports / Export", icon: "reports" },
  { to: "/settings", label: "Settings / Maintenance", icon: "settings" },
];

export default function SidebarNav({ onNavigate, mobile = false }) {
  return (
    <aside className={`vp-sidebar ${mobile ? "is-mobile" : ""}`.trim()}>
      <div className="vp-brand">
        <div className="vp-brand-mark">VP</div>
        <div>
          <strong>VitalPulse</strong>
          <span>Zimbabwe Rural Care</span>
        </div>
      </div>
      <div className="vp-nav-section-label">Navigation</div>
      <nav className="vp-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `vp-nav-item ${isActive ? "is-active" : ""}`}
          >
            <span className="vp-nav-item-icon">
              <Icon name={item.icon} size={18} />
            </span>
            <span className="vp-nav-item-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="vp-sidebar-panel">
        <div className="vp-ai-chip">
          <Icon name="device" size={14} />
          <span>Monitoring Workflow</span>
        </div>
        <h4>Rural vital monitoring</h4>
        <p>Register a device, link a patient, monitor readings, review alerts, and export logs.</p>
        <StatusBadge value="Ready" />
      </div>
      <p className="vp-sidebar-meta">VitalPulse Console | Device-linked monitoring</p>
    </aside>
  );
}
