import { Assembly } from "./assembly";

function formatDate(d: string) {
  return d.split("-").reverse().join(".");
}

function formatTitle(t: string) {
  return t.length > 250 ? t.slice(0, 250) + "…" : t;
}

export function formatPost(a: Assembly) {
  let lines = [];
  if (a.Zeit) {
    if (a.Zeit === "ganztägig") {
      lines.push(`Ganztägige Versammlung am ${formatDate(a.Datum)} ${a.Status}.`);
    } else if (a.Zeit.startsWith("bis")) {
      lines.push(`Versammlung am ${formatDate(a.Datum)} ${a.Zeit} ${a.Status}.`);
    } else if (a.Zeit.includes("-")) {
      lines.push(`Versammlung am ${formatDate(a.Datum)} von ${a.Zeit} ${a.Status}.`);
    } else {
      lines.push(`Versammlung am ${formatDate(a.Datum)} um ${a.Zeit} ${a.Status}.`);
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

  lines.push(`Geplant sind ${a.Teilnehmer} Teilnehmer:innen.`);
  if (a.Veranstalter !== "natürliche Person") {
    lines.push(`Veranstaltet durch ${a.Veranstalter}`);
  }
  return lines.join("\n");
}
