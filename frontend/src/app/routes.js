import React from "react";
import { Routes, Router, Route ,Link} from "react-router-dom";

// 🔹 User Pages
import StationPage from "../features/station/pages/StationPage";
import Stationroute from "../features/station/pages/Stationroute";


import RoutePage from "../features/route/pages/RoutePage";
import SlotPage from "../features/slot/pages/SlotPage";
import TrackingPage from "../user_receive_location/UserLiveView";
// import TrackingPage from "../features/tracking/pages/TrackingPage";

// 🔹 Staff Pages
import StaffLoginPage from "../features/staff/pages/StaffLoginPage";
import StaffDashboard from "../features/staff/pages/StaffDashboard";
import DriverLive from "../driver_send_location/DriverLive";

export default function AppRoutes() {
    return (
        <Routes>
            {/* <Router> */}
                {/* <div style={{ padding: "10px", background: "#eee" }}>
                    <Link to="/driver" style={{ marginRight: "10px" }}>
                        🧑‍✈️ Driver Panel
                    </Link>

                    <Link to="/user">
                        👥 User Panel
                    </Link>
                </div> */}
                <Route

                    path="/driver"
                    element={
                        <DriverLive
                            slotId="69c251e55f49f06a587a815c"
                            lat={28.0443}
                            lng={76.1089}
                            driverId="D1"
                        />
                    }
                />
            {/* </Router> */}








            {/* ================= USER FLOW ================= */}

            {/* Station Search */}
            <Route path="/" element={<StationPage />} />

            {/* Route Search */}
            <Route path="/station_route" element={<Stationroute />} />

            <Route path="/route" element={<RoutePage />} />

            {/* Slot List */}
            <Route path="/slot/:routeId" element={<SlotPage />} />

            {/* Live Tracking */}
            <Route path="/tracking/:slotId" element={<TrackingPage />} />

            {/* ================= STAFF FLOW ================= */}

            {/* Staff Login */}
            <Route path="/staff/login" element={<StaffLoginPage />} />

            {/* Staff Dashboard */}
            <Route path="/staff/dashboard" element={<StaffDashboard />} />

            {/* ================= FALLBACK ================= */}

            <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
    );
}