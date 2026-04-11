// features/station/services/stationAPI.js

const API_URL = "http://127.0.0.1:5000/api/stationRouter/all";
const CACHE_KEY = "allStations";
const CACHE_TIME_KEY = "allStations_time";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// 🔹 Fetch from API
const fetchAllStations = async () => {
    console.log("lllllllllllllllllllllllll");
    
  const res = await fetch(API_URL);
  const json = await res.json();

  const stationsObj = json.data || {};

  // Convert object → array
  const stations = Object.entries(stationsObj).map(([id, name]) => ({
    id,
    name,
  }));

  // Save to localStorage
  localStorage.setItem(CACHE_KEY, JSON.stringify(stations));
  localStorage.setItem(CACHE_TIME_KEY, Date.now());

  return stations;
};

// 🔹 Get from cache or API
const getAllStations = async () => {
  const cached = localStorage.getItem(CACHE_KEY);
  const time = localStorage.getItem(CACHE_TIME_KEY);

  // Check cache valid
  if (cached && time && Date.now() - time < CACHE_TTL) {
    return JSON.parse(cached);
  }

  // Otherwise fetch fresh
  return await fetchAllStations();
};

// 🔹 MAIN SEARCH FUNCTION
export const searchStationsAPI = async (query) => {
  if (!query) return [];

  const allStations = await getAllStations();

  const lowerQuery = query.toLowerCase();

  // 🔍 Filter locally
  const filtered = allStations.filter((station) =>
    station.name.toLowerCase().includes(lowerQuery)
  );

  // Limit results (optional)
  return filtered.slice(0, 10);
};






export const getRoutesByStation = async (stationId) => {
  const res = await fetch(
    "http://127.0.0.1:5000/api/stationRouter/by-station",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stationId }),
    }
  );

  const data = await res.json();

  return data.data || [];
};