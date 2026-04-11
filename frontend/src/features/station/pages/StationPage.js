// features/station/pages/StationPage.js

import React, { useState, useEffect } from "react";
import StationSearchBox from "../components/StationSearchBox";
import StationSuggestions from "../components/StationSuggestions";
import StationHistory from "../components/StationHistory";
import useStationSearch from "../hooks/useStationSearch";
import { useNavigate } from "react-router-dom";

export default function StationPage() {
  const navigate = useNavigate();

  const { query, setQuery, suggestions, loading } = useStationSearch();
  const [activeTab, setActiveTab] = useState("station");
  const [fromStation, setFromStation] = useState("Sector 17 Bus Stand");
  const [toStation, setToStation] = useState("Sector 22 Bus Stand");
  const [history, setHistory] = useState([]);

  // Load history
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("stationHistory")) || [];
    setHistory(stored);
  }, []);

  
  // Save history
  const saveToHistory = (station) => {
    let updated = [station, ...history.filter((h) => h.id !== station.id)];
    updated = updated.slice(0, 5);

    setHistory(updated);
    localStorage.setItem("stationHistory", JSON.stringify(updated));
  };

  // Select station
  const handleSelect = (station) => {
    saveToHistory(station);
    navigate(`/station_route?stationId=${station.id}`);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("stationHistory");
  };

  const handleRouteSearch = (event) => {
    event.preventDefault();
    navigate(`/station_route?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}`);
  };

  const swapStations = () => {
    setFromStation(toStation);
    setToStation(fromStation);
  };

  return (
    <div className="flow-panel">

      {/* Tabs */}
      <div className="tabs">
        <div
          className={activeTab === "station" ? "tab active" : "tab"}
          onClick={() => setActiveTab("station")}
        >
          Station
        </div>
        <div
          className={activeTab === "route" ? "tab active" : "tab"}
          onClick={() => setActiveTab("route")}
        >
          Route
        </div>
      </div>

      {activeTab === "station" ? (
        <section className="search-section">

        <div className="station-header">
          <h2>Search Station</h2>
          <span className="view-all">View all stations</span>
        </div>

        <StationSearchBox query={query} setQuery={setQuery} />

        {loading && <p>Loading...</p>}

        {!query && (
          <StationHistory
            history={history}
            onSelect={handleSelect}
            clearHistory={clearHistory}
          />
        )}

        {query && (
          <StationSuggestions
            suggestions={suggestions}
            onSelect={handleSelect}
          />
        )}

        </section>
      ) : (
        <section className="search-section">
          <h2>Search Route</h2>

          <form className="route-search-form" onSubmit={handleRouteSearch}>
            <label>
              <span>From Station</span>
              <input
                value={fromStation}
                onChange={(event) => setFromStation(event.target.value)}
              />
            </label>

            <button className="swap-button" type="button" onClick={swapStations} aria-label="Swap stations">
              <span aria-hidden="true">↔</span>
            </button>

            <label>
              <span>To Station</span>
              <input
                value={toStation}
                onChange={(event) => setToStation(event.target.value)}
              />
            </label>

            <button className="route-search-button" type="submit">
              Search Route
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
