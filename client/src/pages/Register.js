import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import "../styles/register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", {
        username,
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (error) {
      setErr(error.response?.data?.message || "Register failed");
    }
  }

  return (
    <div className="register-container">
      <h2>Create Account</h2>

      <form onSubmit={submit}>
        <input
          className="reg-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="reg-input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="reg-input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="reg-btn" type="submit">
          Register
        </button>
      </form>

      {err && <p className="reg-error">{err}</p>}

      <p className="reg-footer">
        Have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
