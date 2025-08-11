import { MastoClient, createRestAPIClient } from "masto";
import { Assembly } from "./assembly";
import { formatPost, formatDate, formatTitle } from "./formatting";
import { contentWarning } from "./data";
import { getAllStatuses } from "./util";
import { Publisher } from "./publisher"; // Corrected path

export class MastodonPublisher implements Publisher {
  private masto: MastoClient;
  private accountId: string;

  constructor(serverUrl: string, accessToken: string, accountId: string) {
    this.masto = createRestAPIClient({
      url: serverUrl,
      accessToken: accessToken,
    });
    this.accountId = accountId;
  }

  async publish(assembly: Assembly): Promise<void> {
    const post = {
      status: formatPost(assembly),
      visibility: "public",
      spoilerText: contentWarning(assembly),
    };

    console.log("Publishing:", post);
    try {
      const status = await this.masto.v1.statuses.create(post);
      console.log(`Posted ${status.url}\n---`);
    } catch (error) {
      console.error(`Error publishing status for assembly ${assembly.Thema}:`, error);
      // Potentially re-throw or handle more gracefully
      throw error;
    }
  }

  async remind(assembly: Assembly): Promise<void> {
    // I'm hoping that 250 posts is enough to definitely include all assemblies for the current day.
    // Consider if this limit is appropriate or needs to be configurable.
    console.log(`Attempting to remind for assembly: ${assembly.Thema} on ${assembly.Datum}`);
    try {
      const statuses = await getAllStatuses(this.masto, this.accountId, { max: 250 });

      const statusToReblog = statuses.find((s) => {
        return s.content &&
               !s.content.includes("[Abmeldung]") &&
               s.content.includes(formatTitle(assembly.Thema)) &&
               s.content.includes(formatDate(assembly.Datum));
      });

      if (statusToReblog) {
        console.log(`Reblogging ${statusToReblog.url}: ${statusToReblog.content}`);
        await this.masto.v1.statuses.$select(statusToReblog.id).reblog();
        console.log(`Reblogged ${statusToReblog.url}\n---`);
      } else {
        console.log(`No status found to reblog for assembly: ${assembly.Thema} on ${assembly.Datum}`);
      }
    } catch (error) {
      console.error(`Error reminding for assembly ${assembly.Thema}:`, error);
      // Potentially re-throw or handle more gracefully
      throw error;
    }
  }
}
