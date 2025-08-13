// src/AccountPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

function AccountPage() {
  const navigate = useNavigate();
  const [isVendor, setIsVendor] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      getDoc(doc(db, "users", user.uid)).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsVendor(data.isVendor || false);
          setUserData(data);
        }
      });
    }
  }, []);

  const handleLogout = () => {
  const auth = getAuth();
  signOut(auth)
    .then(() => {
      navigate("/", { replace: true }); // redirect to login/signup
      window.location.reload();
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
};


  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>Account Details</h2>

      <div
        style={{
          border: "1px solid black",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "500px",
          margin: "0 auto",
          background: "white",
        }}
      >
        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center" }}>
          <strong style={{ width: "150px" }}>Name -</strong>
          <span>{userData?.name || "N/A"}</span>
        </div>

        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center" }}>
          <strong style={{ width: "150px" }}>Phone no. -</strong>
          <span>{userData?.phone || "N/A"}</span>
        </div>

        <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center" }}>
          <strong style={{ width: "150px" }}>Gmail -</strong>
          <span>{userData?.email || "N/A"}</span>
        </div>

        {isVendor && (
          <div style={{ marginBottom: "1.5rem" }}>
            <button
              style={{
                backgroundColor: "#666",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => navigate("/vendor")}
            >
              Vendor Dashboard
            </button>
          </div>
        )}

        <button
          style={{
            backgroundColor: "#666",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default AccountPage;
