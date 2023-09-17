import { createRestAPIClient } from "masto";
import { Assembly } from "./assembly";
import { formatPost } from "./formatting";

const assembliesURL = "https://www.dresden.de/data_ext/versammlungsuebersicht/Versammlungen.json";
let newAssemblies;
try {
  const assembliesData = await fetch(assembliesURL);
  newAssemblies = await assembliesData.json();
} catch (error) {
  console.error(`Error fetching ${assembliesURL}: ${error}`);
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
const difference = newAssemblies.Versammlungen
  .filter((a: Assembly) => !savedAssemblies.has(assemblyId(a)))
  .filter((a: Assembly) => a.Datum >= new Date().toISOString().slice(0, 10));

const posts = difference.map(formatPost);

const masto = createRestAPIClient({
  url: process.env.MASTO_SERVER_URL!,
  accessToken: process.env.ACCESS_TOKEN,
});

// Save current data for next execution
await Bun.write("./assemblies.json", JSON.stringify(newAssemblies, null, 2));

// Post updates to Mastodon
for (const post of posts) {
  console.log(`${post}\n---\n`);
  const status = await masto.v1.statuses.create({
    status: post,
    visibility: "unlisted",
  });
  console.log(`Posted ${status.url}`);
  await new Promise(r => setTimeout(r, 1000));
}
