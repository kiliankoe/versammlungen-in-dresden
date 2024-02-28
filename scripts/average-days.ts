import { countWeekDays, cleanOrganizer, readCSV } from "./util";
const data = await readCSV("./assemblies.csv");

let approvalTimes: Record<string, number[]> = {};
let checkedAssemblies = new Set<string>();

for (const row of data) {
  if (checkedAssemblies.has(row.id)) {
    continue;
  }
  checkedAssemblies.add(row.id);

  const announcement = data.find((r: any) => r.id === row.id && r.status === "angemeldet");
  const approval = data.find((r: any) => r.id === row.id && r.status === "beschieden");

  if (!announcement || !approval) {
    continue;
  }

  const announcementDate = new Date(announcement.timestamp);
  const approvalDate = new Date(approval.timestamp);
  const daysUntilApproval = countWeekDays(announcementDate, approvalDate);
  let organizer = row.topic; // organizer or topic
  organizer = cleanOrganizer(organizer);
  if (!approvalTimes[organizer]) {
    approvalTimes[organizer] = [];
  }
  approvalTimes[organizer].push(daysUntilApproval);
}

let averageApprovalTimes: Record<string, { average: number; count: number }> = {};
for (const id in approvalTimes) {
  const times = approvalTimes[id];
  const sum = times.reduce((acc, cur) => acc + cur, 0);
  if (averageApprovalTimes[id] === undefined) {
    averageApprovalTimes[id] = {
      average: 0,
      count: 0,
    };
  }
  averageApprovalTimes[id].average = sum / times.length;
  averageApprovalTimes[id].count = times.length;
}

let entries = Object.entries(averageApprovalTimes);
entries.sort((a, b) => a[1].average - b[1].average);
for (const entry of entries) {
  const [key, value] = entry;
  if (value.count > 1) {
    console.log(`${key}: ${value.average.toFixed(2)} (${value.count})`);
  }
}
