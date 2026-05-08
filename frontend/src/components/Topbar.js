import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

export default function Topbar({ titleAction }) {
  return (
    <header className="vp-topbar">
      <label className="vp-topbar-search">
        <Icon name="search" size={16} />
        <input placeholder="Search patients, devices, reports, or alerts" />
      </label>
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
            <strong>VitalPulse Console</strong>
            <span>Operations Admin</span>
          </div>
        </div>
        <PrimaryButton variant="ghost" icon="logout" disabled>
          Logout endpoint required
        </PrimaryButton>
      </div>
    </header>
  );
}
