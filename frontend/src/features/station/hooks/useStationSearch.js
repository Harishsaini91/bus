import { useState, useEffect, useMemo } from "react";
import { searchStationsAPI } from "../services/stationAPI";
import debounce from "../../../shared/utils/debounce";

export default function useStationSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStations = async (q) => {
    setLoading(true);
    try {
      const data = await searchStationsAPI(q);
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // ✅ Memoized debounce (important)
  const debouncedSearch = useMemo(
    () => debounce(fetchStations, 300),
    []
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setSuggestions([]);
    }
  }, [query, debouncedSearch]); // ✅ fixed

  return {
    query,
    setQuery,
    suggestions,
    loading,
  };
}