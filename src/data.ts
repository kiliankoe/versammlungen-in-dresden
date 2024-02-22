import { Assembly } from "./assembly";

const rightWingOrganizers = [
  "afd dresden",
  "afd kreisverband dresden",
  "pegida förderverein e. v.",
  "freie sachsen",
  "initiative dresden gegen moschee-(neu)bau",
  "wellenlänge",
  "bürgerbewegung pax europa e.v.",
];

export function contentWarning(assembly: Assembly) {
  return rightWingOrganizers.includes(assembly.Veranstalter.toLowerCase())
    ? "Rechte Versammlung"
    : undefined;
}

const organizerReplacements: Record<string, string> = {
  "Fridays For Future": "#FridaysForFuture",
  "Fridays For Futhure": "#FridaysForFuture", // sic!
  "Piratenpartei Sachsen": "@piratensachsen@dresden.network",
  "JUSOS Dresden": "@jusos@dresden.network",
};

export function formatOrganizer(organizer: string) {
  return organizerReplacements[organizer] || organizer;
}
