// Simple fetch + localStorage caching wrapper
// TTL in ms (default: 10 minutes)
const DEFAULT_TTL = 10 * 60 * 1000;

function cacheKey(country) {
  return `chart_cache_${country}`;
}

export async function fetchCountryData(countryKey, url, ttl = DEFAULT_TTL) {
  const key = cacheKey(countryKey);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const age = Date.now() - parsed.fetchedAt;
      if (age < ttl && parsed.data) {
        // return cached
        return parsed.data;
      }
    }
  } catch (e) {
    // ignore cache read errors
    console.warn("Cache read failed", e);
  }

  // Fetch from "API" (local JSON)
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        fetchedAt: Date.now(),
        data,
      })
    );
  } catch (e) {
    console.warn("Cache write failed", e);
  }

  return data;
}
