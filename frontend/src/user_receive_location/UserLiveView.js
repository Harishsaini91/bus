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

// ✅ socket (important: connect manually)
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  autoConnect: false, // 🔥 important
});

// ✅ auto focus
const AutoFocus = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 9, { duration: 1.5 });
    }
  }, [position, map]);

  return null;
};

export default function TrackingPage() {
  const { slotId } = useParams();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [locations, setLocations] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);

  // =========================
  // ✅ Init socket connection
  // =========================
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // =========================
  // ✅ Set slot
  // =========================
  useEffect(() => {
    if (slotId) {
      setSelectedSlot(String(slotId));
    }
  }, [slotId]);

  // =========================
  // ✅ Join room AFTER connect
  // =========================
  useEffect(() => {
    if (!selectedSlot) return;

    console.log("🔗 Joining slot:", selectedSlot);

    socket.emit("joinSlot", { slotId: selectedSlot });

    return () => {
      socket.emit("leaveSlot", { slotId: selectedSlot });
    };
  }, [selectedSlot]);

  // =========================
  // ✅ Receive location
  // =========================
  useEffect(() => {
    const handler = (data) => {
      console.log("📍 Received:", data);

      if (!data?.slotId) return;

      const lat = Number(data.lat);
      const lng = Number(data.lng);

      if (isNaN(lat) || isNaN(lng)) return;

      setLocations((prev) => ({
        ...prev,
        [String(data.slotId)]: { lat, lng, slotId: data.slotId },
      }));
    };

    socket.on("receiveLocation", handler);

    return () => socket.off("receiveLocation", handler);
  }, []);

  const currentBus = selectedSlot ? locations[selectedSlot] : null;

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      
      {/* 🔥 STATUS */}
      <div style={{
        position: "absolute",
        zIndex: 1000,
        background: "white",
        padding: "8px",
        margin: "10px",
        borderRadius: "6px"
      }}>
        {!currentBus && <p>📡 Waiting for bus...</p>}
        {currentBus && <p>🟢 Live</p>}
      </div>

      {/* ================= MAP ================= */}
      <MapContainer
        center={[29.9695, 76.8783]}
        zoom={9} // 🔥 reduced (less tiles)
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          eventHandlers={{
            load: () => setMapLoaded(true),
          }}
        />

        {/* 🔥 ALWAYS SHOW TEST MARKER */}
        <Marker position={[29.9695, 76.8783]}>
          <Popup>Default Marker</Popup>
        </Marker>

        {/* 🔥 Live marker */}
        {currentBus && (
          <>
            <AutoFocus position={[currentBus.lat, currentBus.lng]} />

            <Marker position={[currentBus.lat, currentBus.lng]}>
              <Popup>🚌 {currentBus.slotId}</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}