import React from "react";

export default function SlotCard({ slot, onClick }) {
  const status = (slot.status || "available").toLowerCase();

  return (
    <button
      onClick={() => onClick(slot)}
      className="slot-row"
      type="button"
    >
      <span className="slot-clock" aria-hidden="true">◷</span>
      <span className="slot-copy">
        <span>
          <strong>{slot.start_time}</strong>
          <em className={`status-pill ${status}`}>{status}</em>
        </span>
        <small>{slot.slot_name || "Bus service"}</small>
      </span>
      <span className="row-chevron" aria-hidden="true">›</span>
    </button>
  );
}
