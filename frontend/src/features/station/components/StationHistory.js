// features/station/components/StationHistory.js

import React from "react";

export default function StationHistory({ history, onSelect, clearHistory }) {
  if (!history.length) return null;

  return (
    <div className="history">
      <div className="history-header">
        <span>Recent searches:</span>
        <button type="button" onClick={clearHistory}>Clear all</button>
      </div>

      {history.map((item) => (
        <div
          key={item.id}
          className="history-item"
          data-name={item.name}
          onClick={() => onSelect(item)}
        >
          📍 {item.name}
        </div>
      ))}
    </div>
  );
}
