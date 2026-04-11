// features/station/components/StationSearchBox.js

import React from "react";

export default function StationSearchBox({ query, setQuery }) {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Search station..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <button className="go-btn" type="button">Go</button>
      <button className="mic-btn">🎤</button>
    </div>
  );
}
