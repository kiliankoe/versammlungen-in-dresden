import { Assembly } from "./assembly";
import { formatOrganizer } from "./data";

export function formatDate(d: string) {
  return d.split("-").reverse().join(".");
}

export function formatTitle(t: string) {
  return t.length > 250 ? t.slice(0, 250) + "…" : t;
}

export function formatPost(a: Assembly) {
  let lines = [];
  if (a.Status === "abgemeldet") {
    lines.push("[Abmeldung] ");
  } else {
    lines.push("");
  }
  if (a.Zeit) {
    if (a.Zeit === "ganztägig") {
      lines[0] += `Ganztägige Versammlung am ${formatDate(a.Datum)} ${a.Status}.`;
    } else if (a.Zeit.startsWith("bis")) {
      lines[0] += `Versammlung am ${formatDate(a.Datum)} ${a.Zeit} ${a.Status}.`;
    } else if (a.Zeit.includes("-")) {
      lines[0] += `Versammlung am ${formatDate(a.Datum)} von ${a.Zeit} ${a.Status}.`;
    } else {
      lines[0] += `Versammlung am ${formatDate(a.Datum)} um ${a.Zeit} ${a.Status}.`;
    }
  } else {
    lines.push(`Versammlung am ${formatDate(a.Datum)} ${a.Status}.`);
  }

  lines.push("");
  lines.push(formatTitle(a.Thema));
  lines.push("");

  if (a.Ort) {
    lines.push(`Ort: ${a.Ort}`);
  } else if (a.Startpunkt) {
    lines.push(`Startpunkt: ${a.Startpunkt}`);
  } else {
    lines.push("Ort bisher nicht bekannt.");
  }

  if (a.Teilnehmer) {
    if (a.Status === "abgemeldet") {
      lines.push(`Geplant waren ${a.Teilnehmer} Teilnehmer·innen.`);
    } else {
      lines.push(`Geplant sind ${a.Teilnehmer} Teilnehmer·innen.`);
    }
  }
  if (a.Veranstalter && a.Veranstalter !== "natürliche Person") {
    lines.push(`Veranstaltet durch ${formatOrganizer(a.Veranstalter)}`);
  }
  return lines.join("\n");
}
