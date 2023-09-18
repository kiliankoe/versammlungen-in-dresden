import { createRestAPIClient } from "masto";
import { Assembly } from "./assembly";
import { formatDate } from "./formatting";
import { getAllStatuses } from "./util";

const assembliesURL = "https://www.dresden.de/data_ext/versammlungsuebersicht/Versammlungen.json";
let newAssemblies;
try {
  const assembliesData = await fetch(assembliesURL);
  newAssemblies = await assembliesData.json();
} catch (error) {
  console.error(`Error fetching ${assembliesURL}: ${error}`);
  process.exit(1);
}

const assembliesToday = newAssemblies.Versammlungen.filter((a: Assembly) => a.Datum === new Date().toISOString().slice(0, 10));

const masto = createRestAPIClient({
  url: process.env.MASTO_SERVER_URL!,
  accessToken: process.env.ACCESS_TOKEN,
});

// TODO: This shouldn't need to fetch all statuses, but I'm unsure what a sensible default is.
// Or maybe there's a better way to get the relevant statuses?
const statuses = await getAllStatuses(masto, process.env.ACCOUNT_ID);

const statusesToday = statuses
  .filter((s) => assembliesToday.some((a: Assembly) => s.content.includes(a.Thema) && s.content.includes(formatDate(a.Datum))));

// Reblog today's statuses
for (const status of statusesToday) {
  console.log(`Reblogging ${status.url}: ${status.content}`);
  await masto.v1.statuses.$select(status.id).reblog();
  await new Promise(r => setTimeout(r, 1000));
}
