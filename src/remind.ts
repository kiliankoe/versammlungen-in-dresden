import { Assembly } from "./assembly";
// formatDate, formatTitle, and getAllStatuses are now used within MastodonPublisher
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

const assembliesToday = newAssemblies.Versammlungen.filter(
  (a: Assembly) => a.Datum === new Date().toISOString().slice(0, 10)
);

// Initialize Publishers
const publishers: Publisher[] = [];

// Mastodon Publisher
const mastoServerUrl = process.env.MASTO_SERVER_URL;
const accessToken = process.env.ACCESS_TOKEN;
const mastoAccountId = process.env.ACCOUNT_ID; // Renamed for clarity

if (mastoServerUrl && accessToken && mastoAccountId) {
  publishers.push(new MastodonPublisher(mastoServerUrl, accessToken, mastoAccountId));
  console.log("MastodonPublisher initialized for reminders.");
} else {
  console.warn(
    "MastodonPublisher not initialized for reminders due to missing environment variables (MASTO_SERVER_URL, ACCESS_TOKEN, ACCOUNT_ID)."
  );
}

// Bluesky Publisher
const blueskyIdentifier = process.env.BLUESKY_IDENTIFIER;
const blueskyPassword = process.env.BLUESKY_PASSWORD;

if (blueskyIdentifier && blueskyPassword) {
  try {
    publishers.push(new BlueskyPublisher(blueskyIdentifier, blueskyPassword));
    console.log("BlueskyPublisher initialized for reminders.");
  } catch (error) {
    console.warn(`BlueskyPublisher not initialized for reminders: ${error.message}`);
  }
} else {
  console.warn(
    "BlueskyPublisher not initialized for reminders due to missing environment variables (BLUESKY_IDENTIFIER, BLUESKY_PASSWORD)."
  );
}

// ICS Publisher
const icsOutputDir = process.env.ICS_OUTPUT_DIR; // Though remind is a no-op, we might still init
if (icsOutputDir) {
  try {
    publishers.push(new IcsPublisher(icsOutputDir));
    console.log("IcsPublisher initialized for reminders.");
  } catch (error) {
    console.warn(`IcsPublisher not initialized for reminders: ${error.message}`);
  }
} else {
  console.warn(
    "IcsPublisher not initialized for reminders due to missing environment variable (ICS_OUTPUT_DIR)."
  );
}

if (publishers.length === 0) {
  console.log("No publishers initialized for reminders. Exiting.");
  process.exit(0);
}

console.log(`Found ${assembliesToday.length} assemblies for today to remind.`);
// Send reminders using all configured platforms
for (const assembly of assembliesToday) {
  console.log(`\nProcessing assembly: ${assembly.Thema} for reminding...`);
  for (const pub of publishers) {
    const publisherName = pub.constructor.name;
    console.log(`Attempting to remind via ${publisherName}...`);
    try {
      await pub.remind(assembly);
      console.log(`Successfully sent reminder for assembly "${assembly.Thema}" via ${publisherName}.`);
      // Add a small delay if necessary
      await new Promise((r) => setTimeout(r, 1000)); // 1 second delay
    } catch (error) {
      console.error(`Error sending reminder for assembly "${assembly.Thema}" via ${publisherName}:`, error);
      // Continue to next publisher
    }
  }
}
