// import { useEffect, useRef } from "react";
// import { io } from "socket.io-client";

// // ✅ Single socket instance
// const socket = io("http://localhost:5000", {
//   transports: ["websocket"],
// });

// const DriverLive = ({ slotId }) => {
//   const watchIdRef = useRef(null);

//   useEffect(() => {
//     if (!slotId) {
//       console.log("⚠️ No slotId provided");
//       return;
//     }

//     console.log("🧑‍✈️ Driver started for slot:", slotId);

//     // ✅ Start GPS tracking
//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (pos) => {
//         const lat = pos.coords.latitude;
//         const lng = pos.coords.longitude;

//         console.log("📤 Sending location:", lat, lng);

//         socket.emit("sendLocation", {
//           slotId: String(slotId),
//           lat,
//           lng,
//         });
//       },
//       (err) => {
//         console.error("❌ GPS error:", err);
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 0,
//         timeout: 10000,
//       }
//     );

//     // ✅ Cleanup
//     return () => {
//       console.log("🛑 Stop tracking");

//       if (watchIdRef.current) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//     };
//   }, [slotId]);

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>🧑‍✈️ Driver Live Tracking</h2>
//       <p>Slot ID: {slotId}</p>
//       <p>Status: Sending location...</p>
//     </div>
//   );
// };

// export default DriverLive;





import { useEffect } from "react";
import { io } from "socket.io-client";

// ✅ Single socket instance
const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

const DriverLive = ({ slotId ,lat ,lng ,driverId}) => {

    
    useEffect(() => {
        if (!slotId) {
            console.log("⚠️ No slotId provided");
            return;
        }

        console.log("🧑‍✈️ Driver started for slot:", slotId);

        // 📍 Narnaul fixed coordinates
        // let lat = 28.0443;
        // let lng = 76.1089;

        // 🔥 send every 1 sec
        console.log("📤 Sending location",slotId, lat, lng);
        const interval = setInterval(() => {
            lat += 0.003;
            lng += 0.003;
            socket.emit("sendLocation", {
                slotId: String(slotId),
                lat,
                lng,
            });
        }, 5000);

        // ✅ cleanup
        return () => {
            console.log("🛑 Stop tracking");
            clearInterval(interval);
        };
    }, [slotId]);

    return (
        <div style={{ padding: "20px" }}>
            <h2>🧑‍✈️ Driver Live Tracking (`${driverId}`)</h2>
            <p>Slot ID: {slotId}</p>
            <p>Lat: {lat}</p>
            <p>Lng: {lng}</p>
            <p>📍 Sending Narnaul location every 1 sec</p>
        </div>
    );
};

export default DriverLive;