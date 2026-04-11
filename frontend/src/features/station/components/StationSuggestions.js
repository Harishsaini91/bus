// features/station/components/StationSuggestions.js

import React from "react";
import StationCard from "./StationCard";

export default function StationSuggestions({ suggestions, onSelect }) {
  if (!suggestions.length) return null;

  return (
    <>
      <p className="result-label">Matched stations:</p>
      <div className="suggestions">
      {suggestions.map((station) => (
        <StationCard key={station.id} station={station} onClick={onSelect} />
      ))}
      </div>
    </>
  );
}
