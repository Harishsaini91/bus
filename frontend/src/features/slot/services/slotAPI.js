export const getSlotsByRoute = async (routeId) => {
  const res = await fetch(
    `http://127.0.0.1:5000/api/slotRouter/by-route/${routeId}`
  );

  const data = await res.json();
  return data.data || data || [];
};