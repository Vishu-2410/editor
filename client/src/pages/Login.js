import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });

      // Save user & token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      nav("/dashboard");
    } catch (error) {
      setErr(error.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="login-container">
      <h2>Login</h2>

      <form onSubmit={submit}>
        <input
          className="login-input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="login-input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="login-btn">
          Login
        </button>
      </form>

      {err && <p className="error-text">{err}</p>}

      <p className="login-footer">
        New here? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
