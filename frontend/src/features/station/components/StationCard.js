// features/station/components/StationCard.js

import React from "react";

export default function StationCard({ station, onClick }) {
  return (
    <div className="station-item" onClick={() => onClick(station)}>
      {station.name}
    </div>
  );
}