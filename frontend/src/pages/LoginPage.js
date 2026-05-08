import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FormField } from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";
import { useVitalPulse } from "../context/VitalPulseContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading, signIn } = useVitalPulse();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && currentUser) {
    return <Navigate to="/overview" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signIn(form);
      const redirectTo = location.state?.from?.pathname || "/overview";
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="vp-auth-layout">
      <section className="vp-auth-hero">
        <div className="vp-auth-brand">VP</div>
        <p className="vp-eyebrow">VitalPulse Console</p>
        <h1>Rural vital-sign monitoring for connected patient devices.</h1>
        <p>
          Sign in to monitor live heart rate, SpO2, body temperature, alerts, and device status from the field.
        </p>
        <div className="vp-auth-points">
          <div>Live device telemetry</div>
          <div>Alert acknowledgement workflow</div>
          <div>Reading and device log exports</div>
        </div>
      </section>

      <section className="vp-auth-card">
        <div className="vp-auth-card-header">
          <p className="vp-eyebrow">Secure Access</p>
          <h2>Sign in</h2>
          <p>Use your nurse or clinician account to open the monitoring console.</p>
        </div>
        <form className="vp-auth-form" onSubmit={handleSubmit}>
          <FormField
            label="Username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="Enter username"
            autoComplete="username"
            required
          />
          <FormField
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
          {error ? <p className="vp-form-message vp-form-message-error">{error}</p> : null}
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </PrimaryButton>
        </form>
        <p className="vp-auth-switch">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </section>
    </div>
  );
}
