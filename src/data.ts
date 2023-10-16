import { Assembly } from "./assembly";

export const rightWingOrganizers = [
  "AfD Dresden",
  "Freie Sachsen",
  "Partei FREIE Sachsen",
  "Initiative Dresden gegen Moschee-(Neu)Bau",
];

export function contentWarning(assembly: Assembly) {
  return rightWingOrganizers.includes(assembly.Veranstalter) ? "Rechte Versammlung" : undefined;
}
