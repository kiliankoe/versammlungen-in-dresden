const csv = require("csv-parser");
const fs = require("fs");

export function countWeekDays(start, end) {
  var totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  var weekEndDays = 0;
  var cursor = new Date(start);

  for (var i = 0; i < totalDays; i++) {
    if (cursor.getDay() === 0 || cursor.getDay() === 6) {
      weekEndDays++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return totalDays - weekEndDays;
}

export async function readCSV(filename) {
  const results = [];
  return new Promise((resolve) => {
    fs.createReadStream(filename)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      });
  });
}

export function dedupOrganizers(organizer) {
  const replacements = {
    "Partei Freie Sachsen": "Freie Sachsen",
    "Partei FREIE SACHSEN": "Freie Sachsen",
    "Partei FREIE Sachsen": "Freie Sachsen",
    "GRÜNE JUGEND Dresden": "Grüne Jugend Dresden",
    "BÜNDNIS 90/DIE GRÜNEN Kreisverband Dresden":
      "BÜNDNIS 90/DIE GRÜNEN Dresden",
  };
  const newOrganizer = replacements[organizer] || organizer;
  return newOrganizer.trim();
}
