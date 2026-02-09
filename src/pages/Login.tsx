import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useVibeMode } from "../context/vibeModeContext";

type LocationState = { from?: string };

function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (raw.trim().startsWith("+")) return raw.trim();
  return "";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, setMode } = useVibeMode();
  const { user, firebaseReady, signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, continueLocalSession } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nextPath = useMemo(() => {
    const st = (location.state || {}) as LocationState;
    return st.from || "/onboarding";
  }, [location.state]);

  useEffect(() => {
    if (user) navigate(nextPath, { replace: true });
  }, [user, nextPath, navigate]);

  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async () => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Enter a valid phone number (e.g. +91XXXXXXXXXX).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendPhoneOtp(normalized, "firebase-recaptcha-container");
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Enter OTP.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await verifyPhoneOtp(otp.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h2 className="title center">Student Sign In</h2>
      <div className="card">
        <p className="subtitle">Use Gmail or phone OTP to create your personal dashboard.</p>
        <div style={{ marginTop: 10, marginBottom: 12 }}>
          <label style={{ fontWeight: 700 }}>Energy Level:</label>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="pill-btn"
              style={{ background: mode === "zombie" ? "#1e293b" : undefined, color: mode === "zombie" ? "#fff" : undefined }}
              onClick={() => setMode("zombie")}
            >
              Low
            </button>
            <button
              type="button"
              className="pill-btn"
              style={{ background: mode === "beast" ? "#1e293b" : undefined, color: mode === "beast" ? "#fff" : undefined }}
              onClick={() => setMode("beast")}
            >
              High
            </button>
            <span style={{ fontSize: "0.86rem", opacity: 0.85 }}>
              {mode === "zombie"
                ? "Got it. Let's just do 10 mins of light revision today. No heavy lifting."
                : "Nice. Full-rigor mode is active for harder drills."}
            </span>
          </div>
        </div>

        {firebaseReady ? (
          <>
            <button className="cta-btn" onClick={handleGoogle} disabled={busy}>
              Continue with Google
            </button>

            <div style={{ marginTop: 14 }}>
              <label>Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
              />
              {!otpSent ? (
                <button className="pill-btn" onClick={handleSendOtp} disabled={busy}>
                  Send OTP
                </button>
              ) : (
                <>
                  <label style={{ marginTop: 8 }}>OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                  />
                  <button className="pill-btn" onClick={handleVerifyOtp} disabled={busy}>
                    Verify OTP
                  </button>
                </>
              )}
              <div id="firebase-recaptcha-container" style={{ marginTop: 10 }} />
            </div>
          </>
        ) : (
          <>
            <p className="subtitle" style={{ marginTop: 8 }}>
              Firebase is not configured in this environment. Set `VITE_FIREBASE_*` env keys to enable Gmail/Phone auth.
            </p>
            <button className="pill-btn" onClick={continueLocalSession} disabled={busy}>
              Continue in Local Session
            </button>
          </>
        )}

        {error ? (
          <p style={{ marginTop: 12, color: "#b91c1c" }}>{error}</p>
        ) : null}
      </div>
    </div>
  );
}
