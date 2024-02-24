import { createRestAPIClient } from "masto";
import { Assembly } from "./assembly";
import { formatDate, formatTitle } from "./formatting";
import { fetchAssemblies, getAllStatuses } from "./util";

let newAssemblies;
try {
  newAssemblies = await fetchAssemblies();
} catch (error) {
  console.error(`Error fetching assemblies: ${error}`);
  process.exit(1);
}

const assembliesToday = newAssemblies.Versammlungen.filter((a: Assembly) => a.Datum === new Date().toISOString().slice(0, 10));

const masto = createRestAPIClient({
  url: process.env.MASTO_SERVER_URL!,
  accessToken: process.env.ACCESS_TOKEN,
});

// I'm hoping that 250 posts is enough to definitely include all assemblies for the current day.
const statuses = await getAllStatuses(masto, process.env.ACCOUNT_ID, { max: 250 });

// Get first post that contains the relevant date and topic
const statusesToday = [];
for (const assembly of assembliesToday) {
  const status = statuses.find((s) => {
    !s.content.includes("[Abmeldung]") &&
      s.content.includes(formatTitle(assembly.Thema)) &&
      s.content.includes(formatDate(assembly.Datum));
  });
  if (status) {
    statusesToday.push(status);
    continue;
  }
}

// Reblog today's statuses
for (const status of statusesToday) {
  console.log(`Reblogging ${status.url}: ${status.content}`);
  await masto.v1.statuses.$select(status.id).reblog();
  await new Promise(r => setTimeout(r, 1000));
}
