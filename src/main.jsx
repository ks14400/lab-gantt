import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import GanttChart from "../Lab_Gantt_Chart.jsx";
import { loginWithGoogle, logout, onUserChange, isAllowedEmail } from "./firebase.js";

function App() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not signed in

  useEffect(() => onUserChange(setUser), []);

  // Loading state
  if (user === undefined) {
    return (
      <div style={{ background: "#0F1117", color: "#9CA3AF", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Loading...
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div style={{ background: "#0F1117", color: "#E0E4EC", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5BB55B", boxShadow: "0 0 8px #5BB55B80" }} />
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#F5F7FA" }}>Lab Gantt Chart</h1>
          </div>
          <p style={{ color: "#6B7280", marginBottom: 32, fontSize: 14 }}>Sign in to access the project timeline</p>
          <button onClick={loginWithGoogle}
            style={{ padding: "12px 32px", borderRadius: 8, border: "1px solid #2D3348", background: "#1A1D28", color: "#E0E4EC", cursor: "pointer", fontSize: 15, fontWeight: 500, fontFamily: "inherit", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#252836"}
            onMouseLeave={e => e.currentTarget.style.background = "#1A1D28"}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Signed in but not allowed
  if (!isAllowedEmail(user.email)) {
    return (
      <div style={{ background: "#0F1117", color: "#E0E4EC", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#E05050", marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: "#9CA3AF", marginBottom: 8 }}>Signed in as {user.email}</p>
          <p style={{ color: "#6B7280", marginBottom: 24, fontSize: 13 }}>This account is not authorized to access this app.</p>
          <button onClick={logout}
            style={{ padding: "8px 20px", borderRadius: 6, border: "1px solid #2D3348", background: "#1A1D28", color: "#9CA3AF", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Authorized user
  return <GanttChart user={user} onLogout={logout} />;
}

createRoot(document.getElementById("root")).render(<App />);
