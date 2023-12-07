import { Assembly } from "./assembly";

const rightWingOrganizers = [
  "AfD Dresden",
  "AfD Kreisverband Dresden",
  "PEGIDA Förderverein e. V.",
  "Freie Sachsen",
  "Partei FREIE Sachsen",
  "Initiative Dresden gegen Moschee-(Neu)Bau",
];

export function contentWarning(assembly: Assembly) {
  return rightWingOrganizers.includes(assembly.Veranstalter) ? "Rechte Versammlung" : undefined;
}

const organizerReplacements: Record<string, string> = {
  "Fridays For Future": "#FridaysForFuture",
  "Fridays For Futhure": "#FridaysForFuture", // sic!
  "Piratenpartei Sachsen": "@piratensachsen@dresden.network",
}

export function formatOrganizer(organizer: string) {
  return organizerReplacements[organizer] || organizer;
}
