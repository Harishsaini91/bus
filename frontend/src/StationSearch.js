import { io } from "socket.io-client";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "stations_data";

// const socket = io("http://127.0.0.1:5000");

export default function StationSearch({ onSelect, placeholder = "Search station..." }) {
    const [stations, setStations] = useState([]);
    const [query, setQuery] = useState("");
    const [filtered, setFiltered] = useState([]);
    const [show, setShow] = useState(false);

    const [selectedStation, setSelectedStation] = useState(null);
    const [routes, setRoutes] = useState([]);



 
  
  
 useEffect(() => {
    const socket = io("http://127.0.0.1:5000"); // ✅ moved inside

    const local = localStorage.getItem(STORAGE_KEY);
    const localVersion = localStorage.getItem("stations_version");

    // ⚡ instant load
    if (local) {
        try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
                setStations(parsed);
            }
        } catch (e) {
            console.error("Invalid localStorage data");
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    // 🔥 first sync
    fetch("http://127.0.0.1:5000/api/stationRouter/all")
        .then(res => res.json())
        .then(({ data, version }) => {
            if (Array.isArray(data)) {
                setStations(data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem("stations_version", version);
            } else {
                setStations([]);
            }
        });

    // 🚀 realtime update
    socket.on("stations_updated", async ({ version }) => {
        const currentVersion = localStorage.getItem("stations_version");

        if (version !== currentVersion) {
            console.log("🔄 Auto updating stations...");

            try {
                const res = await fetch("http://127.0.0.1:5000/api/stationRouter/all");
                const { data, version: newVersion } = await res.json();

                setStations(data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem("stations_version", newVersion);
            } catch (err) {
                console.error("❌ Update error:", err);
            }
        }
    });

    // 🧹 cleanup
    return () => {
        socket.off("stations_updated");
        socket.disconnect(); // ✅ VERY IMPORTANT
    };

}, []);
    // 🔍 Search
    useEffect(() => {
        const q = (query || "").toLowerCase().trim();

        if (!q || !Array.isArray(stations)) {
            setFiltered([]);
            return;
        }

        const startsWith = [];
        const includes = [];

        stations.forEach(s => {
            const name = s.search_name || "";

            if (name.startsWith(q)) startsWith.push(s);
            else if (name.includes(q)) includes.push(s);
        });

        setFiltered([...startsWith, ...includes].slice(0, 10));
    }, [query, stations]);

    // 🔥 MANUAL SEARCH (GO BUTTON)
    const handleSearch = async () => {
        if (!selectedStation) {
            alert("Select a station first");
            return;
        }

        console.log(selectedStation._id + "###"); // ✅ FIXED

        try {
            const res = await fetch("http://127.0.0.1:5000/api/stationRouter/by-station", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    stationId: selectedStation._id // ✅ FIXED
                })
            });

            const data = await res.json();

            console.log("🚍 Routes:", data);
            setRoutes(data);

        } catch (err) {
            console.error("❌ Error:", err);
        }
    };

    return (
        <div style={{ width: "300px", position: "relative" }}>

            {/* 🔍 INPUT */}
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onFocus={() => setShow(true)}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: "100%", padding: "8px" }}
            />

            {/* 🔘 GO BUTTON */}
            <button onClick={handleSearch} style={{ marginTop: "8px" }}>
                Go
            </button>

            {/* 🔽 DROPDOWN */}
            {show && filtered.length > 0 && (
                <div style={{
                    position: "absolute",
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ccc",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 10
                }}>
                    {filtered.map(station => (
                        <div
                            key={station._id}
                            onClick={() => {
                                const selected = {
                                    _id: station._id,
                                    name: station.search_name
                                };

                                setQuery(station.search_name);
                                setFiltered([]);
                                setShow(false);

                                setSelectedStation(selected); // ✅ store for button
                                onSelect && onSelect(selected);
                            }}
                            style={{
                                padding: "8px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee"
                            }}
                        >
                            {highlightMatch(station.search_name, query)}
                        </div>
                    ))}
                </div>
            )}

            {/* 🚍 ROUTES */}
            {routes.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                    <h4>🚍 Routes</h4>
                    {routes.map(route => (
                        <div key={route._id}>
                            {route.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 🔥 Highlight
function highlightMatch(text = "", query = "") {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
            ? <b key={i}>{part}</b>
            : part
    );
}