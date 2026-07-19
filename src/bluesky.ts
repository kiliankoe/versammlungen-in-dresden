import { Assembly } from "./assembly";
import { Publisher } from "./publisher";

export class BlueskyPublisher implements Publisher {
  private identifier: string;
  private password: string;

  constructor(identifier: string, password: string) {
    if (!identifier || !password) {
      console.error("Bluesky identifier or password missing from environment variables.");
      // In a real app, you might throw an error or have a more robust config system
      throw new Error("Bluesky credentials not provided.");
    }
    this.identifier = identifier;
    this.password = password;
    console.log("BlueskyPublisher initialized with identifier:", identifier ? "provided" : "missing");
    // Password logging should be avoided, even its presence.
  }

  async publish(assembly: Assembly): Promise<void> {
    console.log(`[BlueskyPublisher] Attempting to publish: ${assembly.Thema} on ${assembly.Datum}`);
    console.log("[BlueskyPublisher] Payload:", JSON.stringify(assembly, null, 2));
    // TODO: Implement Bluesky API call to create a post
    // Example:
    // const bskyClient = new AtpAgent({ service: 'https://bsky.social' });
    // await bskyClient.login({ identifier: this.identifier, password: this.password });
    // await bskyClient.post({
    //   text: `New Assembly: ${assembly.Thema}...`, // Format your post content here
    //   createdAt: new Date().toISOString(),
    // });
    console.log("[BlueskyPublisher] Skipping actual post for now.");
    return Promise.resolve();
  }

  async remind(assembly: Assembly): Promise<void> {
    console.log(`[BlueskyPublisher] Attempting to send reminder for: ${assembly.Thema} on ${assembly.Datum}`);
    console.log("[BlueskyPublisher] Assembly data:", JSON.stringify(assembly, null, 2));
    // TODO: Implement Bluesky API call to find original post and re-post or quote-post
    // Example:
    // const bskyClient = new AtpAgent({ service: 'https://bsky.social' });
    // await bskyClient.login({ identifier: this.identifier, password: this.password });
    // First, you'd need a way to find the original post, perhaps by searching or using stored IDs.
    // Then, you could quote post it:
    // await bskyClient.post({
    //   text: `Reminder: ${assembly.Thema} is happening soon!`, // Format reminder
    //   embed: {
    //     $type: 'app.bsky.embed.record',
    //     record: {
    //       uri: 'AT_URI_OF_ORIGINAL_POST', // The AT URI of the post to quote
    //       cid: 'CID_OF_ORIGINAL_POST'    // The CID of the post to quote
    //     }
    //   },
    //   createdAt: new Date().toISOString(),
    // });
    console.log("[BlueskyPublisher] Skipping actual reminder post for now.");
    return Promise.resolve();
  }
}
