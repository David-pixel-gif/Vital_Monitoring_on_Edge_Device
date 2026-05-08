import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import { useVitalPulse } from "../context/VitalPulseContext";

const SEARCH_COPY = {
  "/overview": "Search by patient, device, or alert reason",
  "/dashboard": "Search by patient, device, or alert reason",
  "/monitoring": "Search patient or device monitoring context",
  "/patients": "Search patients by ID, name, or initials",
  "/alerts": "Search alerts by patient, device, or reason",
  "/history": "Search logs by patient, device, or notes",
  "/devices": "Search devices by ID or location",
  "/reports": "Search export types or report names",
  "/settings": "Search settings and maintenance fields",
};

export default function Topbar({ titleAction, onOpenNav }) {
  const { currentUser, signOut } = useVitalPulse();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setValue(searchParams.get("q") || "");
  }, [searchParams]);

  const placeholder = useMemo(() => {
    return SEARCH_COPY[location.pathname] || "Search patients, devices, reports, or alerts";
  }, [location.pathname]);

  function handleSubmit(event) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) {
      next.set("q", trimmed);
    } else {
      next.delete("q");
    }
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next.toString()}` : "" }, { replace: true });
  }

  return (
    <header className="vp-topbar">
      <button type="button" className="vp-icon-button vp-mobile-nav-trigger" aria-label="Open navigation" onClick={onOpenNav}>
        <Icon name="menu" size={18} />
      </button>
      <form className="vp-topbar-search" onSubmit={handleSubmit}>
        <Icon name="search" size={16} />
        <input
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Global page search"
        />
      </form>
      <div className="vp-topbar-actions">
        {titleAction}
        <button type="button" className="vp-icon-button" aria-label="Notifications">
          <Icon name="notification" size={16} />
        </button>
        <button type="button" className="vp-icon-button" aria-label="Settings">
          <Icon name="settings" size={16} />
        </button>
        <div className="vp-user-chip">
          <div className="vp-user-avatar">VC</div>
          <div>
            <strong>{currentUser?.username || "VitalPulse Console"}</strong>
            <span>{currentUser?.role || "Guest session"}</span>
          </div>
        </div>
        <PrimaryButton variant="ghost" icon="logout" onClick={signOut}>
          Log out
        </PrimaryButton>
      </div>
    </header>
  );
}
