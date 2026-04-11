// features/route/pages/RoutePage.js

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getRoutesByStation } from "../services/stationAPI";

function getStopCount(route) {
    return route.total_stops || route.stop_ids?.length || route.stops?.length || 0;
}

function getRouteTitle(route) {
    return route.name || `${route.start_station_id || "Start"} -> ${route.end_station_id || "End"}`;
}

export default function Stationroute() {
    const location = useLocation();
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);

    const params = new URLSearchParams(location.search);
    const stationId = params.get("stationId");
    const from = params.get("from");
    const to = params.get("to");

    useEffect(() => {
        if (!stationId) return;

        const fetchRoutes = async () => {
            setLoading(true);

            try {
                const data = await getRoutesByStation(stationId);
                setRoutes(data);
            } catch (err) {
                console.error("Error fetching routes", err);
            }

            setLoading(false);
        };

        fetchRoutes();
    }, [stationId]);

    const demoRoutes = [
        { route_id: "demo-1", name: `${from || "Sector 17 Bus Stand"} -> ${to || "Sector 22 Bus Stand"}`, total_stops: 3 },
        { route_id: "demo-2", name: "Karnal Bus Stand -> Sector 17 Bus Stand", total_stops: 2 },
    ];

    const visibleRoutes = stationId ? routes : demoRoutes;

    return (
        <div className="flow-panel routes-screen">
            <header className="subpage-header">
                <button type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
                <h1>Available Routes</h1>
            </header>

            {(from || to) && (
                <div className="route-query-strip">
                    {from || "From station"} <span>→</span> {to || "To station"}
                </div>
            )}

            {stationId && (
                <div className="route-serving-strip">
                    <span>Routes serving:</span>
                    <strong>{from || "Selected station"}</strong>
                </div>
            )}

            {loading && <p className="muted-text route-state">Loading routes...</p>}

            {!loading && stationId && visibleRoutes.length === 0 && (
                <div className="empty-state">
                    <h2>Bus not found</h2>
                    <button type="button" onClick={() => navigate("/")}>Return to home</button>
                </div>
            )}

            {!loading && visibleRoutes.length > 0 && (
                <div className="route-list">
                    {visibleRoutes.map((route) => (
                        <button
                            key={route.route_id}
                            type="button"
                            className="route-row"
                            onClick={() => stationId ? navigate(`/slot/${route.route_id}`) : navigate("/")}
                        >
                            <span className="route-pin" aria-hidden="true">⌖</span>
                            <span>
                                <strong>{getRouteTitle(route)}</strong>
                                <small>{getStopCount(route)} stops</small>
                            </span>
                            <span className="row-chevron" aria-hidden="true">›</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/*
function LegacyRoutePage() {
    const location = useLocation();
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🔹 Extract stationId
    const params = new URLSearchParams(location.search);
    const stationId = params.get("stationId");

    useEffect(() => {
        if (!stationId) return;

        const fetchRoutes = async () => {
            setLoading(true);

            try {
                const data = await getRoutesByStation(stationId);
                console.log("Routes:", data);
                setRoutes(data);
            } catch (err) {
                console.error("Error fetching routes", err);
            }

            setLoading(false);
        };

        fetchRoutes();
    }, [stationId]);


const navigate = useNavigate();

const handleRouteClick = (route) => {
  navigate(`/slot/${route.route_id}`);
};



    return (
        <div>
            <h2>Routes</h2>

            {routes.map((route) => (
                <div
                    key={route.route_id}
                    onClick={() => handleRouteClick(route)}
                    style={{
                        border: "1px solid #ccc",
                        margin: "10px",
                        padding: "10px",
                        cursor: "pointer"
                    }}
                >
                    <h3>{route.name}</h3>
                    <p>Route ID: {route.route_id}</p>
                    <p>Start: {route.start_station_id}</p>
                    <p>End: {route.end_station_id}</p>
                </div>
            ))}
        </div>
    );
}
*/
