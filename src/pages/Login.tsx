import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <div className="page">
      <h2 className="title center">Login</h2>

      <div className="card">
        <label>Email ID</label>
        <input
          type="email"
          placeholder="Enter your email…"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="cta-btn" onClick={() => navigate("/onboarding")}>
          Continue
        </button>
      </div>
    </div>
  );
}
