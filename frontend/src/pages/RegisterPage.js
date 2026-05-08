import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FormField } from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";
import { useVitalPulse } from "../context/VitalPulseContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, loading, signUp } = useVitalPulse();
  const [form, setForm] = useState({ username: "", password: "", role: "NURSE" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && currentUser) {
    return <Navigate to="/overview" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await signUp(form);
      setMessage("Account created. You can now sign in.");
      navigate("/login", { replace: true });
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
        <h1>Create an operator account for the monitoring console.</h1>
        <p>
          Keep access simple for rural care teams: register a nurse or doctor account and continue into device-based monitoring.
        </p>
      </section>

      <section className="vp-auth-card">
        <div className="vp-auth-card-header">
          <p className="vp-eyebrow">Account Setup</p>
          <h2>Register</h2>
          <p>Create a console account with the role used in the field.</p>
        </div>
        <form className="vp-auth-form" onSubmit={handleSubmit}>
          <FormField
            label="Username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="Choose username"
            autoComplete="username"
            required
          />
          <FormField
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Create password"
            autoComplete="new-password"
            hint="Minimum 6 characters."
            required
          />
          <FormField label="Role">
            <select
              className="vp-input"
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="NURSE">Nurse</option>
              <option value="DOCTOR">Doctor</option>
            </select>
          </FormField>
          {error ? <p className="vp-form-message vp-form-message-error">{error}</p> : null}
          {message ? <p className="vp-form-message vp-form-message-success">{message}</p> : null}
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Registering..." : "Create account"}
          </PrimaryButton>
        </form>
        <p className="vp-auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
