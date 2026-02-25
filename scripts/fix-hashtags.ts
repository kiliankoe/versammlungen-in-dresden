import { createRestAPIClient } from "masto";
import { getAllStatuses } from "../src/util.js";

const DRY_RUN = !process.argv.includes("--execute");

// Check required environment variables
const requiredEnvVars = ["MASTO_SERVER_URL", "ACCESS_TOKEN", "ACCOUNT_ID"];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
    process.exit(1);
  }
}

// Ensure URL has https:// prefix
let serverUrl = process.env.MASTO_SERVER_URL!;
if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
  serverUrl = `https://${serverUrl}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")  // Paragraph breaks
    .replace(/<br\s*\/?>/gi, "\n")      // Line breaks
    .replace(/<[^>]*>/g, "")            // Remove remaining tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (DRY_RUN) {
    console.log("Dry-run mode - no changes will be made. Use --execute to apply fixes.\n");
  } else {
    console.log("EXECUTE mode - changes will be applied!\n");
  }

  const masto = createRestAPIClient({
    url: serverUrl,
    accessToken: process.env.ACCESS_TOKEN,
  });

  // Resolve account ID from username if needed
  let accountId = process.env.ACCOUNT_ID!;
  if (!/^\d+$/.test(accountId)) {
    console.log(`Looking up account ID for @${accountId}...`);
    const account = await masto.v1.accounts.lookup({ acct: accountId });
    accountId = account.id;
    console.log(`Found account ID: ${accountId}\n`);
  }
  console.log("Fetching posts...");
  const statuses = await getAllStatuses(masto, accountId, { max: 500 });
  console.log(`Scanning ${statuses.length} posts...\n`);

  let needsFixing = 0;
  let fixed = 0;

  for (const status of statuses) {
    const plainText = stripHtml(status.content);

    // Extract date from "am DD.MM." pattern
    const dateMatch = plainText.match(/am (\d{2})\.(\d{2})\./);
    if (!dateMatch) continue;

    const [, day, month] = dateMatch;
    const expectedHashtag = `#dd${day}${month}`;

    // Find existing hashtag
    const existingMatch = plainText.match(/#dd\d{4}/);
    if (!existingMatch) continue;
    const existingHashtag = existingMatch[0];

    if (existingHashtag !== expectedHashtag) {
      needsFixing++;

      // Extract title (first line of the post)
      const titleMatch = plainText.match(/^(\[Abmeldung\] )?(Ganztägige )?Versammlung am [^\n]+/);
      const title = titleMatch?.[0]?.trim() ?? "(title not found)";

      const newContent = plainText.replace(existingHashtag, expectedHashtag);

      console.log(`POST: ${status.url}`);
      console.log(`  Title:    ${title}`);
      console.log(`  Current:  ${existingHashtag}`);
      console.log(`  Expected: ${expectedHashtag}`);

      if (!DRY_RUN) {
        await masto.v1.statuses.$select(status.id).update({ status: newContent });
        console.log(`  ✓ Fixed!`);
        fixed++;
        await sleep(1000);
      } else if (needsFixing === 1) {
        // Show preview of first post to verify formatting
        console.log(`  Preview of new content:`);
        console.log("  ---");
        for (const line of newContent.split("\n")) {
          console.log(`  ${line}`);
        }
        console.log("  ---");
      }
      console.log("");
    }
  }

  console.log("---");
  if (DRY_RUN) {
    console.log(`Summary: ${needsFixing} posts need fixing`);
  } else {
    console.log(`Summary: ${fixed}/${needsFixing} posts fixed`);
  }
}

main().catch(console.error);
