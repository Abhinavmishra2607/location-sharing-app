// src/VendorCard.jsx
import React from "react";
import "./vendorcard.css"; // <— ensure lowercase to match your file

const VendorCard = ({ vendor, distanceKm, origin }) => {
  if (!vendor) return null;

  const hasLoc = vendor.location?.lat && vendor.location?.lng;
  const dirUrl = hasLoc
    ? `https://www.google.com/maps/dir/?api=1${
        origin ? `&origin=${origin.lat},${origin.lng}` : ""
      }&destination=${vendor.location.lat},${vendor.location.lng}`
    : null;

  return (
    <div className="vc-card">
      <h4>{vendor.serviceName || vendor.name || "Unnamed Service"}</h4>

      {vendor.serviceDescription && (
        <p className="vc-description">{vendor.serviceDescription}</p>
      )}

      <p>
        <strong>Category:</strong> {vendor.category || "N/A"}
        {typeof distanceKm === "number" ? (
          <> • {distanceKm.toFixed(1)} km</>
        ) : null}
      </p>

      {hasLoc && (
        <p>
          <strong>Location:</strong>{" "}
          {vendor.location.lat.toFixed(4)}, {vendor.location.lng.toFixed(4)}
        </p>
      )}

      {dirUrl && (
        <a
          className="directions-btn"
          href={dirUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            padding: "8px 12px",
            background: "#007bff",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            marginTop: "8px",
          }}
        >
          Get Directions
        </a>
      )}
    </div>
  );
};

export default VendorCard;
