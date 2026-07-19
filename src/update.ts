import { Assembly } from "./assembly";
// contentWarning and formatPost are now used within MastodonPublisher
import { fetchAssemblies } from "./util";
import { MastodonPublisher } from "./mastodon";
import { BlueskyPublisher } from "./bluesky";
import { IcsPublisher } from "./ics";
import { Publisher } from "./publisher";

let newAssemblies;
try {
  newAssemblies = await fetchAssemblies();
} catch (error) {
  console.error(`Error fetching assemblies: ${error}`);
  process.exit(1);
}

// Used to compare assemblies, updates will only be posted if they differ in these fields
function assemblyId(a: Assembly) {
  return a.Datum + a.Zeit + a.Thema + a.Ort + a.Startpunkt + a.Status;
}

const savedAssembliesFile = Bun.file("./assemblies.json");
const savedAssembliesJSON = await savedAssembliesFile.json();
const savedAssemblies = new Set(savedAssembliesJSON.Versammlungen.map(assemblyId));

// Get a list of assemblies that are new or have been updated, filtering those that are in the past
const difference = newAssemblies.Versammlungen.filter((a: Assembly) => a.Thema)
  .filter((a: Assembly) => !savedAssemblies.has(assemblyId(a)))
  .filter((a: Assembly) => a.Datum >= new Date().toISOString().slice(0, 10))
  .sort((lhs: Assembly, rhs: Assembly) => lhs.Datum > rhs.Datum);

// Save current data for next execution
await Bun.write("./assemblies.json", JSON.stringify(newAssemblies, null, 2));

// Initialize Publishers
const publishers: Publisher[] = [];

// Mastodon Publisher
const mastoServerUrl = process.env.MASTO_SERVER_URL;
const accessToken = process.env.ACCESS_TOKEN;
const mastoAccountId = process.env.ACCOUNT_ID; // Renamed to avoid conflict if other account IDs are used

if (mastoServerUrl && accessToken && mastoAccountId) {
  publishers.push(new MastodonPublisher(mastoServerUrl, accessToken, mastoAccountId));
  console.log("MastodonPublisher initialized.");
} else {
  console.warn(
    "MastodonPublisher not initialized due to missing environment variables (MASTO_SERVER_URL, ACCESS_TOKEN, ACCOUNT_ID)."
  );
}

// Bluesky Publisher
const blueskyIdentifier = process.env.BLUESKY_IDENTIFIER;
const blueskyPassword = process.env.BLUESKY_PASSWORD;

if (blueskyIdentifier && blueskyPassword) {
  try {
    publishers.push(new BlueskyPublisher(blueskyIdentifier, blueskyPassword));
    console.log("BlueskyPublisher initialized.");
  } catch (error) {
    console.warn(`BlueskyPublisher not initialized: ${error.message}`);
  }
} else {
  console.warn(
    "BlueskyPublisher not initialized due to missing environment variables (BLUESKY_IDENTIFIER, BLUESKY_PASSWORD)."
  );
}

// ICS Publisher
const icsOutputDir = process.env.ICS_OUTPUT_DIR;
if (icsOutputDir) {
  try {
    publishers.push(new IcsPublisher(icsOutputDir));
    console.log("IcsPublisher initialized.");
  } catch (error) {
    console.warn(`IcsPublisher not initialized: ${error.message}`);
  }
} else {
  console.warn(
    "IcsPublisher not initialized due to missing environment variable (ICS_OUTPUT_DIR)."
  );
}

if (publishers.length === 0) {
  console.log("No publishers initialized. Exiting.");
  process.exit(0); // Or handle as appropriate if no publishers are configured
}

console.log(`Found ${difference.length} new or updated assemblies to publish.`);
// Publish to all configured platforms
for (const assembly of difference) {
  console.log(`\nProcessing assembly: ${assembly.Thema} for publishing...`);
  for (const pub of publishers) {
    const publisherName = pub.constructor.name;
    console.log(`Attempting to publish via ${publisherName}...`);
    try {
      await pub.publish(assembly);
      console.log(`Successfully published assembly "${assembly.Thema}" via ${publisherName}.`);
      // Add a small delay if necessary, e.g. for rate limiting
      await new Promise((r) => setTimeout(r, 1000)); // 1 second delay between each publish call per assembly
    } catch (error) {
      console.error(`Error publishing assembly "${assembly.Thema}" via ${publisherName}:`, error);
      // Continue to next publisher even if one fails
    }
  }
}
