import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// ✅ Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ✅ Socket
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

// ✅ Auto focus map
const AutoFocus = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 15, { animate: true });
    }
  }, [position]);

  return null;
};

const BusLiveView = () => {
  const [slots, setSlots] = useState([]);
  const [locations, setLocations] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  // const routeId = "69c02de7770c70f9624da35c"; // 🔥 your route
  const routeId = "69c02dd5770c70f9624da35a"; // 🔥 your route

  // =========================
  // ✅ FETCH SLOTS
  // =========================
  const fetchSlots = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/slotRouter/by-route/${routeId}`
      );
      const data = await res.json();

      const running = data.filter((s) => s.status === "running");

      setSlots(running);

      // 🔥 auto select first slot
      if (running.length && !selectedSlot) {
        setSelectedSlot(running[0]._id);
      }

      // 🔥 remove selection if slot ended
      if (
        selectedSlot &&
        !running.find((s) => s._id === selectedSlot)
      ) {
        setSelectedSlot(null);
      }
    } catch (err) {
      console.error("❌ Slot fetch error:", err);
    }
  };

  useEffect(() => {
    fetchSlots();

    // 🔥 realtime update
    socket.on("slots_updated", () => {
      console.log("🔄 Slots updated → refetch");
      fetchSlots();
    });

    return () => {
      socket.off("slots_updated");
    };
  }, [selectedSlot]);

  // =========================
  // ✅ RECEIVE LOCATION
  // =========================
  useEffect(() => {
    const handler = (data) => {
      console.log("📍 Location:", data);

      setLocations((prev) => ({
        ...prev,
        [data.slotId]: data,
      }));
    };

    socket.on("receiveLocation", handler);

    return () => socket.off("receiveLocation", handler);
  }, []);

  // =========================
  // 🔥 JOIN / LEAVE ROOM
  // =========================
  useEffect(() => {
    if (!selectedSlot) return;

    console.log("🔗 Joining slot:", selectedSlot);

    socket.emit("joinSlot", { slotId: selectedSlot });

    return () => {
      console.log("🚪 Leaving slot:", selectedSlot);
      socket.emit("leaveSlot", { slotId: selectedSlot });
    };
  }, [selectedSlot]);

  // =========================
  // 📍 CURRENT BUS
  // =========================
  const currentBus = selectedSlot
    ? locations[selectedSlot]
    : null;

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      
      {/* 🔥 SLOT SELECTOR */}
      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          margin: "10px",
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        <h4>🚌 Running Slots</h4>

        {slots.length === 0 && <p>No running buses</p>}

        {slots.map((slot) => (
          <button
            key={slot._id}
            onClick={() => setSelectedSlot(slot._id)}
            style={{
              display: "block",
              margin: "5px 0",
              padding: "6px",
              width: "100%",
              background:
                selectedSlot === slot._id ? "#4CAF50" : "#eee",
              border: "none",
              cursor: "pointer",
            }}
          >
            {slot.slot_name} ({slot.start_time})
          </button>
        ))}
      </div>

      {/* 🗺️ MAP */}
      <MapContainer
        center={[29.9695, 76.8783]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🔥 AUTO FOCUS */}
        {currentBus && (
          <AutoFocus position={[currentBus.lat, currentBus.lng]} />
        )}

        {/* 🚌 SELECTED BUS */}
        {currentBus && (
          <Marker position={[currentBus.lat, currentBus.lng]}>
            <Popup>
              🚌 Slot: {currentBus.slotId}
              <br />
              Lat: {currentBus.lat.toFixed(4)}
              <br />
              Lng: {currentBus.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}

        {/* 🔥 OPTIONAL: SHOW ALL BUSES */}
        {Object.values(locations).map((bus) => (
          <Marker
            key={bus.slotId}
            position={[bus.lat, bus.lng]}
          >
            <Popup>🚌 {bus.slotId}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BusLiveView;