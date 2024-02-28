import { $ } from "bun";
import { stringify } from "csv-stringify/sync";
import { createHash } from "crypto";
import { Assembly } from "../src/assembly";
import { cleanOrganizer } from "./util";

async function getCommitHashes() {
  const hashes = await $`git log --pretty=format:%H -- assemblies.json`.text();
  return hashes.split("\n");
}

async function getCommitTimestamp(hash: string) {
  const timestamp = await $`git show -s --format=%ci ${hash}`.text();
  return timestamp.trim();
}

async function getAssembliesAtCommit(hash: string) {
  const assemblies = await $`git show ${hash}:assemblies.json`.text();
  return JSON.parse(assemblies).Versammlungen as Assembly[];
}

function id(assembly: Assembly) {
  const id = `${assembly.Datum};${assembly.Thema}`;
  const hash = createHash("sha256").update(id);
  return hash.digest("hex");
}

function hash(assembly: Assembly) {
  const id = `${assembly.Datum};${assembly.Zeit};${assembly.Thema};${assembly.Ort};${assembly.Startpunkt};${assembly.Teilnehmer};${assembly.Veranstalter};${assembly.Status}`;
  const hash = createHash("sha256").update(id);
  return hash.digest("hex");
}

let hashes = await getCommitHashes();
hashes = hashes.reverse();
hashes.splice(0, 3); // remove bogus testing data

let data: Array<Array<string | undefined>> = [
  [
    "timestamp",
    "commit_hash",
    "id",
    "assembly_hash",
    "date",
    "time",
    "topic",
    "location",
    "start",
    "attendees",
    "organizer",
    "status",
  ],
];

for (const commitHash of hashes) {
  const timestamp = await getCommitTimestamp(commitHash);
  const assemblies = await getAssembliesAtCommit(commitHash);

  for (const assembly of assemblies) {
    const assemblyHash = hash(assembly);
    if (data.some((row) => row[3] === assemblyHash)) {
      continue;
    }
    data.push([
      timestamp,
      commitHash,
      id(assembly),
      assemblyHash,
      assembly.Datum,
      assembly.Zeit,
      assembly.Thema,
      assembly.Ort,
      assembly.Startpunkt,
      assembly.Teilnehmer,
      cleanOrganizer(assembly.Veranstalter),
      assembly.Status,
    ]);
  }
}

// no need to keep the assembly_hash column, it was only used for deduplication
data.forEach((row) => {
  row.splice(3, 1);
});

const csv = stringify(data);
await Bun.write("./assemblies.csv", csv);
