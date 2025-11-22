import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    try {
      const res = await API.get("/docs");
      setDocs(res.data);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) {
        localStorage.clear();
        nav("/login");
      }
    }
  }

  async function create() {
    if (!title.trim()) return alert("Enter title");
    const res = await API.post("/docs", { title });
    nav("/editor/" + res.data._id);
  }

  function logout() {
    localStorage.clear();
    nav("/login");
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="dashboard-container">
      <div className="dash-header">
        <h2>Dashboard</h2>

        <div className="dash-user">
          <span className="user-name">Hi, {user.username}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="create-box">
        <input
          className="dash-input"
          placeholder="New document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button className="create-btn" onClick={create}>
          Create
        </button>
      </div>

      <h3 className="doc-title">Your Documents</h3>

      <div className="doc-list">
        {docs.map((d) => (
          <div className="doc-card" key={d._id}>
            <Link to={"/editor/" + d._id} className="doc-link">
              <div className="doc-name">{d.title || "Untitled Document"}</div>
              <div className="doc-meta">
                Last Updated: {new Date(d.lastUpdated).toLocaleString()}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
