import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
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

// ✅ socket
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

// ✅ auto focus map
const AutoFocus = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);

  return null;
};

const UserLiveView = () => {
  const [slots, setSlots] = useState([]);
  const [locations, setLocations] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

//   const routeId = "69c02de7770c70f9624da35c";
  const routeId = "69c02dd5770c70f9624da35a";

  // =========================
  // ✅ FETCH SLOTS
  // =========================
  // const fetchSlots = async () => {
  //   try {
  //     const res = await fetch(
  //       `http://localhost:5000/api/slotRouter/by-route/${routeId}`
  //     );
  //     const data = await res.json();

  //     console.log("🧪 RAW SLOTS:", data);

  //     const running = data.filter(
  //       (s) => s.status === "running" && s?.slot_id
  //     );

  //     console.log(running)

  //     setSlots(running);

  //     // ✅ auto select first valid slot
  //     if (running.length && !selectedSlot) {
  //       setSelectedSlot(String(running[0].slot_id));
  //     }

  //     // ✅ remove invalid selection
  //     if (
  //       selectedSlot &&
  //       !running.find((s) => String(s.slot_id) === selectedSlot)
  //     ) {
  //       setSelectedSlot(null);
  //     }
  //   } catch (err) {
  //     console.error("❌ Slot fetch error:", err);
  //   }
  // };

  // useEffect(() => {
  //   fetchSlots();

  //   socket.on("slots_updated", fetchSlots);

  //   return () => {
  //     socket.off("slots_updated", fetchSlots);
  //   };
  // }, [selectedSlot]);

  // =========================
  // ✅ RECEIVE LOCATION
  // =========================
  
  
  
  useEffect(() => {
    const handler = (data) => {
      console.log("📍 Received:", data);

      if (!data?.slotId || data.lat == null || data.lng == null) {
        console.log("⚠️ Invalid location skipped");
        return;
      }

      setLocations((prev) => ({
        ...prev,
        [String(data.slotId)]: data,
      }));
    };

    socket.on("receiveLocation", handler);

    return () => socket.off("receiveLocation", handler);
  }, []);

  // =========================
  // 🔗 JOIN SLOT
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

  const currentBus = selectedSlot
    ? locations[selectedSlot]
    : null;

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {/* ================= SLOT LIST ================= */}
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

        {slots.map((slot) => {
          const slotId = String(slot.slot_id);

          return (
            <button
              key={slotId}
              onClick={() => setSelectedSlot(slotId)}
              style={{
                display: "block",
                margin: "5px 0",
                padding: "6px",
                width: "100%",
                background:
                  selectedSlot === slotId ? "#4CAF50" : "#eee",
                border: "none",
                cursor: "pointer",
              }}
            >
              {slot.slot_name} ({slot.start_time})
            </button>
          );
        })}
      </div>

      {/* ================= MAP ================= */}
      <MapContainer
        center={[29.9695, 76.8783]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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

        {/* ✅ all buses */}
        {Object.values(locations).map((bus) => (
          <Marker key={bus.slotId} position={[bus.lat, bus.lng]}>
            <Popup>🚌 {bus.slotId}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default UserLiveView;