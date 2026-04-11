import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import UserLiveView from "./user_receive_location/UserLiveView";
import DriverLive from "./driver_send_location/DriverLive";

function App() {
  return (
    <Router>
      <div>
        {/* 🔥 NAVBAR */}
        <div style={{ padding: "10px", background: "#eee" }}>
          <Link to="/driver" style={{ marginRight: "10px" }}>
            🧑‍✈️ Driver Panel
          </Link>

          <Link to="/user">
            👥 User Panel
          </Link>
        </div>

        {/* 🔥 ROUTES */}
        <Routes>
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
          <Route
            path="/driver2"
            element={
              <DriverLive
                slotId="69c251ae5f49f06a587a8159"
                driverId="D2"
                lat={30.7333}
                lng={76.7794}
              />
            }
          />

          <Route
            path="/driver3"
            element={
              <DriverLive
                slotId="69c2a51c882694c902fe169e"
                driverId="D3"
                lat={29.9657}
                lng={76.8370}
              />
            }
          />

          <Route path="/user" element={<UserLiveView />} />

          {/* ✅ default */}
          <Route path="*" element={<UserLiveView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;