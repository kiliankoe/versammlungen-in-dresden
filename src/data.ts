import { Assembly } from "./assembly";

const rightWingOrganizers = [
  "afd dresden",
  "afd kreisverband dresden",
  "alternative für deutschland (afd) , bundesverband",
  "pegida förderverein e. v.",
  "freie sachsen",
  "partei freie sachsen",
  "initiative dresden gegen moschee-(neu)bau",
  "wellenlänge",
  "bürgerbewegung pax europa e.v.",
];

const rightWingTopics = ["bühlau geht spazieren"];

export function contentWarning(assembly: Assembly): string | undefined {
  if (rightWingTopics.includes(assembly.Thema.toLowerCase())) {
    return "Rechte Versammlung";
  }
  if (rightWingOrganizers.includes(assembly.Veranstalter.toLowerCase())) {
    return "Rechte Versammlung";
  }
  return undefined;
}

const organizerReplacements: Record<string, string> = {
  "Fridays For Future": "#FridaysForFuture",
  "Fridays For Future Dresden": "#FridaysForFuture",
  "Fridays For Futhure": "#FridaysForFuture", // sic!
  "Fridays For Futhure Dresden": "#FridaysForFuture", // sic!
  "Piratenpartei Sachsen": "@piratensachsen@dresden.network",
  "Piraten Dresden": "@piratendresden@pirati.ca",
  "JUSOS Dresden": "@jusos@dresden.network",
  "ADFC Dresden e.V.": "@ADFC_Dresden@dresden.network",
  "Queer Pride Dresden": "@pridedd@eldritch.cafe",
};

export function formatOrganizer(organizer: string) {
  return organizerReplacements[organizer] || organizer;
}
