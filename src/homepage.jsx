// src/homepage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./homepage.css";
import VendorCard from "./VendorCard";

// ---- Helpers ----
function toRad(v) { return (v * Math.PI) / 180; }
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBoundsFromCenterAndRadius(center, radiusKm) {
  const latRadius = radiusKm / 111.32;
  const lngRadius = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  return [
    [center.lat - latRadius, center.lng - lngRadius],
    [center.lat + latRadius, center.lng + lngRadius],
  ];
}

// Keeps map fitted to the chosen radius around the user
function MapBoundsController({ userLocation, radiusKm }) {
  const map = useMap();
  useEffect(() => {
    if (!userLocation) return;
    const b = getBoundsFromCenterAndRadius(userLocation, radiusKm);
    map.fitBounds(b, { padding: [20, 20] });
  }, [userLocation, radiusKm, map]);
  return null;
}

const userIcon = new L.Icon.Default();

function isOnline(v) {
  // Backward-compat: treat status==='online' as online too
  return v?.online === true || v?.status === "online";
}

function tsToMillis(ts) {
  if (!ts) return 0;
  // Firestore Timestamp object: { seconds, nanoseconds }
  if (typeof ts.seconds === "number") return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
  // Raw Date
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [radiusKm, setRadiusKm] = useState(5); // default 5km view
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 28.6139, lng: 77.209 }); // fallback Delhi
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 28.6139, lng: 77.209 }) // fallback: New Delhi
    );
  }, []);

  // Live vendor list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vendors"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setVendors(list);
    });
    return () => unsub();
  }, []);

  // Filter vendors by category + radius (but not by online yet)
  const visibleVendors = useMemo(() => {
    if (!userLocation) return [];
    return vendors.filter((v) => {
      if (!v.location?.lat || !v.location?.lng) return false;
      if (selectedCategory !== "all" && v.category !== selectedCategory) return false;
      const d = getDistanceKm(
        userLocation.lat,
        userLocation.lng,
        v.location.lat,
        v.location.lng
      );
      return d <= radiusKm;
    });
  }, [vendors, userLocation, selectedCategory, radiusKm]);

  // ONLINE vendors within radius
  const onlineInRadius = useMemo(
    () => visibleVendors.filter(isOnline),
    [visibleVendors]
  );

  // "Most recently online" banner — by lastOnlineAt (fallback to updatedAt/lastUpdated)
  const mostRecentLine = useMemo(() => {
    const sorted = [...vendors]
      .filter(isOnline)
      .sort((a, b) => {
        const ta = tsToMillis(a.lastOnlineAt || a.updatedAt || a.lastUpdated);
        const tb = tsToMillis(b.lastOnlineAt || b.updatedAt || b.lastUpdated);
        return tb - ta;
      })
      .slice(0, 8);
    const names = sorted.map((v) => v.name || v.serviceName || "Vendor").join(" , ");
    return names || "No one online yet";
  }, [vendors]);

  return (
    <div className="home-root">
      {/* Header */}
      <header className="home-header">
        <div className="brand">LocalPin</div>
        <button className="account-chip" onClick={() => navigate("/account")}>
          Acc.
        </button>
      </header>

      {/* Map */}
      <section className="map-wrap">
        {userLocation ? (
          <MapContainer
            key={`${userLocation.lat.toFixed(3)}-${radiusKm}`}
            center={[userLocation.lat, userLocation.lng]}
            zoom={13}
            className="map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBoundsController userLocation={userLocation} radiusKm={radiusKm} />

            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>

            {/* Radius circle */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#3388ff", weight: 2, fillOpacity: 0.08 }}
            />

            {/* Vendor pins within radius/category */}
            {visibleVendors.map((v) => {
              const gmaps =
                `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}` +
                `&destination=${v.location.lat},${v.location.lng}`;
              return (
                <Marker
                  key={v.id}
                  position={[v.location.lat, v.location.lng]}
                  icon={userIcon}
                >
                  <Popup>
                    <strong>{v.name || v.serviceName || "Vendor"}</strong>
                    <br />
                    {v.category ? <>Category: {v.category}<br /></> : null}
                    {v.serviceDescription ? <>{v.serviceDescription}<br /></> : null}
                    Status: {isOnline(v) ? "🟢 Online" : "⚪ Offline"}
                    <br />
                    <a href={gmaps} target="_blank" rel="noreferrer">📍 Get Directions</a>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <div className="map placeholder">Loading map…</div>
        )}

        {/* Filters row under map */}
        <div className="filters-row">
          <div className="filter">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All</option>
              <option value="food">Food</option>
              <option value="tailoring">Tailoring</option>
              <option value="repairs">Repairs</option>
              <option value="services">Services</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>

          <div className="filter">
            <label>Distance</label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
            >
              {[1, 3, 5, 10, 20].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Most recently online banner */}
      <div className="top-banner">
        <span className="top-title">Most recently online -&nbsp;</span>
        <span className="top-line">{mostRecentLine}</span>
      </div>

      {/* Service online now (within radius) */}
      <section className="online-section">
        <h3 className="online-title">service online now</h3>
        <div className="card-scroller">
          {onlineInRadius.length === 0 ? (
            <div className="empty">No vendors online in this area.</div>
          ) : (
            onlineInRadius.map((v) => {
              const distance = getDistanceKm(
                userLocation?.lat || 0,
                userLocation?.lng || 0,
                v.location.lat,
                v.location.lng
              );
              return (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  distanceKm={distance}
                  origin={userLocation} // <-- pass origin so card can build directions
                />
              );
            })
          )}
        </div>
      </section>

      {/* Contact footer */}
      <footer className="contact-footer">
        <div className="contact-grid">
          <div>
            <div className="contact-label">Office</div>
            <div>LocalPin HQ</div>
            <div>221B Ghaziabad, Uttarpradesh</div>
          </div>
          <div>
            <div className="contact-label">Phone</div>
            <div>+91 98765 43210</div>
            <div>Landline: 011-23456789</div>
          </div>
          <div>
            <div className="contact-label">Email</div>
            <div>support@localpin.example</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
