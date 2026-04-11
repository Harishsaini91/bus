import { useEffect, useState } from "react";
import { getSlotsByRoute } from "../services/slotAPI";

export default function useSlotData(routeId) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!routeId) return;

    const fetchSlots = async () => {
      setLoading(true);

      try {
        const data = await getSlotsByRoute(routeId);
        console.log("Slots:", data);
        setSlots(data);
      } catch (err) {
        console.error("Slot fetch error", err);
      }

      setLoading(false);
    };

    fetchSlots();
  }, [routeId]);

  return { slots, loading };
}