import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// Move map to new location
function MapUpdater({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([latlng.lat,latlng.lng], 13);
    }
  }, [location, map]);
  return null;
}

// Click map to set location
function ClickToSelect({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Search location box
function LocationSearchBox({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 3) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${val}`
      );
      const data = await res.json();
      setResults(data);
    } else {
      setResults([]);
    }
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <input
        type="text"
        placeholder="Search for a location..."
        value={query}
        onChange={handleSearch}
        style={{ width: "100%", padding: "10px" }}
      />
      {results.map((place) => (
        <div
          key={place.place_id}
          onClick={() => {
            onSelect({
              lat: parseFloat(place.lat),
              lng: parseFloat(place.lon),
              name: place.display_name,
            });
            setQuery(place.display_name);
            setResults([]);
          }}
          style={{
            padding: "8px",
            background: "#f8f8f8",
            borderBottom: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          {place.display_name}
        </div>
      ))}
    </div>
  );
}

function CustomerMap() {
  const [location, setLocation] = useState(null);
  const [addressName, setAddressName] = useState("");
  const [vendors, setVendors] = useState([]);

  // Fetch vendors in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vendors"), (snapshot) => {
      const vendorList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVendors(vendorList);
    });

    return () => unsubscribe();
  }, []);

  // Share live customer location
  const shareLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setAddressName("My Live Location");
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Failed to get your location.");
      }
    );
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Find Nearby Vendors</h2>

      <LocationSearchBox
        onSelect={(coords) => {
          setLocation({ lat: coords.lat, lng: coords.lng });
          setAddressName(coords.name);
        }}
      />

      <MapContainer
        center={location || [28.6139, 77.209]} // Default to Delhi
        zoom={13}
        style={{ height: "500px", width: "100%", marginBottom: "10px" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer marker */}
        {location && (
          <>
            <MapUpdater location={location} />
            <Marker position={[location.lat, location.lng]}>
              <Popup>{addressName || "Your Location"}</Popup>
            </Marker>
          </>
        )}

        {/* Vendors */}
        {vendors.map((vendor) => (
          vendor.location && (
            <Marker
              key={vendor.id}
              position={[vendor.location.lat, vendor.location.lng]}
            >
              <Popup>
                <strong>{vendor.name}</strong>
                <br />
                <strong>Category:</strong> {vendor.category}
                <br />
                <strong>Status:</strong>{" "}
                <span style={{ color: vendor.status === "online" ? "green" : "red" }}>
                  {vendor.status || "offline"}
                </span>
                <br />
                <strong>Last Updated:</strong>{" "}
                {vendor.lastUpdated
                  ? new Date(vendor.lastUpdated.seconds * 1000).toLocaleString()
                  : "N/A"}
                <br />
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${vendor.location.lat},${vendor.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📍 Get Directions
                </a>
              </Popup>
            </Marker>
          )
        ))}

        <ClickToSelect
          onMapClick={(coords) => {
            setLocation(coords);
            setAddressName("Selected from map");
          }}
        />
      </MapContainer>

      <button
        onClick={shareLiveLocation}
        style={{
          padding: "10px 20px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Share My Live Location
      </button>
    </div>
  );
}

export default CustomerMap;
