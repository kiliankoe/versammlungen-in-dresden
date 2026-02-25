import csvParser from "csv-parser";
import { createReadStream } from "fs";

interface Location {
  lat: number;
  lng: number;
}

type LocationCache = Record<string, Location>;

const PHOTON_API = "https://photon.komoot.io/api/";
const RATE_LIMIT_MS = 1100; // slightly over 1s to be respectful
const DRESDEN_CENTER = { lat: 51.0504, lng: 13.7373 };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract the first meaningful location name from a potentially compound location string.
 * Examples:
 *   "Wiener Platz, Bayrische Straße und Strehlener Straße" -> "Wiener Platz"
 *   "Schlesischer Platz und Hansastraße" -> "Schlesischer Platz"
 *   "Könneritzstraße und Weißeritzstraße" -> "Könneritzstraße"
 *   "Altmarkt" -> "Altmarkt"
 */
function extractPrimaryLocation(location: string): string {
  // Split on " und " or ", " and take the first part
  return location.split(/\s+und\s+|,\s+/)[0].trim();
}

async function geocode(
  locationName: string
): Promise<Location | null> {
  const query = `${locationName}, Dresden`;
  const url = `${PHOTON_API}?q=${encodeURIComponent(query)}&lat=${DRESDEN_CENTER.lat}&lon=${DRESDEN_CENTER.lng}&limit=1&lang=de`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(
        `  HTTP ${response.status} for "${locationName}", skipping`
      );
      return null;
    }
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      // Sanity check: result should be roughly within Dresden area
      if (
        lat > 50.9 &&
        lat < 51.2 &&
        lng > 13.5 &&
        lng < 14.0
      ) {
        return { lat, lng };
      }
      console.warn(
        `  Result for "${locationName}" is outside Dresden (${lat}, ${lng}), skipping`
      );
      return null;
    }
    console.warn(`  No results for "${locationName}"`);
    return null;
  } catch (error) {
    console.warn(`  Error geocoding "${locationName}": ${error}`);
    return null;
  }
}

async function readAllLocations(): Promise<Set<string>> {
  const locations = new Set<string>();
  const stream = createReadStream("assemblies.csv").pipe(csvParser());

  for await (const row of stream) {
    const loc = (row.location || "").trim();
    const start = (row.start || "").trim();
    if (loc) locations.add(loc);
    if (start) locations.add(start);
  }

  // Also read current assemblies.json for locations not yet in CSV
  const assembliesFile = Bun.file("assemblies.json");
  if (await assembliesFile.exists()) {
    const data = await assembliesFile.json();
    for (const assembly of data.Versammlungen || []) {
      const loc = (assembly.Ort || "").trim();
      const start = (assembly.Startpunkt || "").trim();
      if (loc) locations.add(loc);
      if (start) locations.add(start);
    }
  }

  return locations;
}

async function loadCache(): Promise<LocationCache> {
  const file = Bun.file("locations.json");
  if (await file.exists()) {
    return await file.json();
  }
  return {};
}

async function main() {
  const allLocations = await readAllLocations();
  const cache = await loadCache();

  console.log(`Found ${allLocations.size} unique locations in data`);
  console.log(`Cache has ${Object.keys(cache).length} entries`);

  // Find locations we need to geocode
  // We cache both the original compound name and the primary extracted name
  const toGeocode: Array<{ original: string; query: string }> = [];

  for (const location of allLocations) {
    if (cache[location]) continue;

    const primary = extractPrimaryLocation(location);

    // If the primary part is already cached (from another compound name), reuse it
    if (primary !== location && cache[primary]) {
      cache[location] = cache[primary];
      console.log(`  Reusing "${primary}" coords for "${location}"`);
      continue;
    }

    toGeocode.push({ original: location, query: primary });
  }

  if (toGeocode.length === 0) {
    console.log("All locations already geocoded, nothing to do.");
    await Bun.write("locations.json", JSON.stringify(cache, null, 2) + "\n");
    return;
  }

  console.log(`Need to geocode ${toGeocode.length} new locations`);

  let success = 0;
  let failed = 0;

  for (const { original, query } of toGeocode) {
    console.log(`Geocoding: "${query}"${query !== original ? ` (from "${original}")` : ""}`);

    const result = await geocode(query);
    if (result) {
      cache[original] = result;
      // Also cache the primary name if different
      if (query !== original && !cache[query]) {
        cache[query] = result;
      }
      console.log(`  -> ${result.lat}, ${result.lng}`);
      success++;
    } else {
      failed++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nDone: ${success} geocoded, ${failed} failed`);

  // Sort keys for stable output
  const sorted: LocationCache = {};
  for (const key of Object.keys(cache).sort()) {
    sorted[key] = cache[key];
  }

  await Bun.write("locations.json", JSON.stringify(sorted, null, 2) + "\n");
  console.log(
    `Wrote ${Object.keys(sorted).length} entries to locations.json`
  );
}

await main();
