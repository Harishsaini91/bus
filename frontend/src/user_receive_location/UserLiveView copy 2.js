import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// ✅ Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ✅ socket (keep single instance)
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

// ✅ auto focus
const AutoFocus = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.2 });
    }
  }, [position, map]);

  return null;
};

export default function TrackingPage() {
  const { slotId } = useParams();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [locations, setLocations] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // =========================
  // ✅ Set slot from URL
  // =========================
  useEffect(() => {
    if (slotId) {
      console.log("🎯 URL slot:", slotId);
      setSelectedSlot(String(slotId));
    }
  }, [slotId]);

  // =========================
  // ✅ Join room
  // =========================
  useEffect(() => {
    if (!selectedSlot) return;

    console.log("🔗 Joining slot:", selectedSlot);

    socket.emit("joinSlot", { slotId: selectedSlot });
    setIsConnected(true);

    return () => {
      console.log("🚪 Leaving slot:", selectedSlot);
      socket.emit("leaveSlot", { slotId: selectedSlot });
    };
  }, [selectedSlot]);

  // =========================
  // ✅ Receive location (FIXED)
  // =========================
  useEffect(() => {
    const handler = (data) => {
      console.log("📍 Received:", data);

      if (!data?.slotId) return;

      const lat = Number(data.lat);
      const lng = Number(data.lng);

      if (isNaN(lat) || isNaN(lng)) {
        console.log("❌ Invalid coordinates");
        return;
      }

      setLocations((prev) => ({
        ...prev,
        [String(data.slotId)]: { ...data, lat, lng },
      }));
    };

    socket.on("receiveLocation", handler);

    return () => socket.off("receiveLocation", handler);
  }, []);

  const currentBus = selectedSlot ? locations[selectedSlot] : null;

  console.log("🧠 currentBus:", currentBus);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      
      {/* 🔥 STATUS UI */}
      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          background: "white",
          padding: "8px",
          margin: "10px",
          borderRadius: "6px",
        }}
      >
        {!isConnected && <p>🔄 Connecting...</p>}
        {isConnected && !currentBus && <p>📡 Waiting for bus...</p>}
        {currentBus && <p>🟢 Live tracking</p>}
      </div>

      {/* 🔥 MAP LOADING UI */}
      {!mapLoaded && (
        <div
          style={{
            position: "absolute",
            zIndex: 999,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          Loading map...
        </div>
      )}

      {/* ================= MAP ================= */}
      <MapContainer
        center={[29.9695, 76.8783]}
        zoom={11} // lower zoom = faster load
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap & CARTO"
          eventHandlers={{
            load: () => setMapLoaded(true),
            tileerror: (e) => {
              console.log("❌ Tile failed:", e.tile.src);
            },
          }}
        />

        {/* ✅ Test marker (REMOVE after debug) */}
        {/* <Marker position={[29.9695, 76.8783]}>
          <Popup>Test Marker</Popup>
        </Marker> */}

        {/* ✅ Live Marker */}
        {currentBus && (
          <>
            <AutoFocus position={[currentBus.lat, currentBus.lng]} />

            <Marker position={[currentBus.lat, currentBus.lng]}>
              <Popup>
                🚌 Slot: {currentBus.slotId}
                <br />
                Lat: {currentBus.lat.toFixed(5)}
                <br />
                Lng: {currentBus.lng.toFixed(5)}
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}