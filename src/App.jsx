import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Correctly capitalized component imports
import LoginSignup from "./LoginSignup.jsx";
import HomePage from "./homepage.jsx";
import AccountPage from "./accountpage.jsx";
import VendorDashboard from "./vendordashboard.jsx";
import CustomerMap from "./CustomerMap.jsx"; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/map" element={<CustomerMap />} />
        <Route path="/map" element={<CustomerMap />} />
        <Route path="/" element={<LoginSignup />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/vendor" element={<VendorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
