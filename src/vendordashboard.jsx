// src/vendordashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./VendorDashboard.css";

// Marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterOnLocation({ location }) {
  const map = useMap();
  useEffect(() => {
    if (!location) return;
    map.setView(location, Math.max(map.getZoom(), 15), { animate: true });
  }, [location, map]);
  return null;
}

function LocationSelector({ setLocation }) {
  useMapEvents({
    click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      setLocation(coords);
    },
  });
  return null;
}

export default function VendorDashboard() {
  const [location, setLocation] = useState([28.6139, 77.209]);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [category, setCategory] = useState(""); // NEW
  const [isOnline, setIsOnline] = useState(false);
  const [locationText, setLocationText] = useState("");

  const auth = getAuth();
  const userId = auth.currentUser?.uid || "vendor1";

  const mapRef = useRef(null);

  useEffect(() => {
    if (!location) return;
    setLocationText(`Lat: ${location[0].toFixed(5)}, Lng: ${location[1].toFixed(5)}`);
  }, [location]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        if (mapRef.current) {
          mapRef.current.setView(coords, Math.max(mapRef.current.getZoom(), 15), { animate: true });
        }
      },
      (err) => {
        console.error(err);
        alert("Failed to get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleStatus = async () => {
    const newOnline = !isOnline;
    setIsOnline(newOnline);
    try {
      await setDoc(
        doc(db, "vendors", userId),
        {
          location: { lat: location[0], lng: location[1] },
          online: newOnline,
          status: newOnline ? "online" : "offline",
          lastUpdated: new Date(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const submitServiceInfo = async () => {
    if (!serviceName.trim() || !serviceDescription.trim() || !category.trim()) {
      alert("Please fill in all fields including Category.");
      return;
    }

    try {
      await setDoc(
        doc(db, "vendors", userId),
        {
          serviceName: serviceName.trim(),
          serviceDescription: serviceDescription.trim(),
          category: category.trim(),
          lastUpdated: new Date(),
        },
        { merge: true }
      );
      alert("Service details updated!");
    } catch (e) {
      console.error("Error saving service details:", e);
      alert("Failed to save service details.");
    }
  };

  // NEW: Save only the location
  const saveLocation = async () => {
    try {
      await setDoc(
        doc(db, "vendors", userId),
        {
          location: { lat: location[0], lng: location[1] },
          lastUpdated: new Date(),
        },
        { merge: true }
      );
      alert("Location saved!");
    } catch (e) {
      console.error("Error saving location:", e);
      alert("Failed to save location.");
    }
  };

  return (
    <div className="vendor-dashboard">
      <header className="vendor-header">
        <div className="logo">Venlo</div>
        <h1>Vendor Dashboard</h1>
      </header>

      <div className="dashboard-content">
        <div className="map-section">
          <MapContainer
            center={location}
            zoom={15}
            whenCreated={(m) => (mapRef.current = m)}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={location} icon={markerIcon} />
            <RecenterOnLocation location={location} />
            <LocationSelector setLocation={setLocation} />
          </MapContainer>

          <div className="map-buttons">
            <button onClick={handleUseMyLocation}>Use My Current Location</button>
            <button onClick={saveLocation}>Save Location</button> {/* NEW BUTTON */}
            <button
              className={`status-btn ${isOnline ? "online" : "offline"}`}
              onClick={toggleStatus}
            >
              {isOnline ? "Online" : "Offline"}
            </button>
          </div>
        </div>

        <div className="form-section">
          <label>Service Name:</label>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="Enter your service name"
          />

          <label>Service Description:</label>
          <textarea
            rows={6}
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            placeholder="Describe your service..."
          />

          {/* NEW: Category selection */}
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category</option>
            <option value="Plumber">Plumber</option>
            <option value="Electrician">Electrician</option>
            <option value="Carpenter">Carpenter</option>
            <option value="Delivery">Delivery</option>
            <option value="Other">Other</option>
          </select>

          <button className="submit-service" onClick={submitServiceInfo}>
            Submit Service Info
          </button>

          {locationText && <h3 className="location-heading">📍 Location: {locationText}</h3>}
        </div>
      </div>
    </div>
  );
}
