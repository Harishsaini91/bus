import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSlotData from "../hooks/useSlotData";
import SlotList from "../components/SlotList";

export default function SlotPage() {
  const { routeId } = useParams();
  const navigate = useNavigate();

  const { slots, loading } = useSlotData(routeId);

const handleSlotClick = (slot) => {
  navigate(`/tracking/${slot.slot_id}`);
};

  return (
    <div className="flow-panel slots-screen">
      <header className="subpage-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <div>
          <h1>Time Slots</h1>
          <p>Select a bus schedule</p>
        </div>
      </header>

      {loading && <p className="muted-text route-state">Loading slots...</p>}

      {!loading && slots.length === 0 && (
        <div className="empty-state">
          <h2>Bus not found</h2>
          <button type="button" onClick={() => navigate("/")}>Return to home</button>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <>
          <p className="slot-count">{slots.length} slots available today</p>
          <SlotList slots={slots} onSlotClick={handleSlotClick} />
        </>
      )}
    </div>
  );
}
