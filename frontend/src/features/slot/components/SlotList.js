import React from "react";
import SlotCard from "./SlotCard";

export default function SlotList({ slots, onSlotClick }) {
  return (
    <div className="slot-list">
      {slots.map((slot) => (
  <SlotCard key={slot.slot_id} slot={slot} onClick={onSlotClick} />
))}
    </div>
  );
}
