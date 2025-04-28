import { createRestAPIClient } from "masto";

export class MastodonClient {
  private client: RestClient;
}

export async function mastodonClient() {
  const masto = createRestAPIClient({
    url: process.env.MASTO_SERVER_URL!,
    accessToken: process.env.ACCESS_TOKEN,
  });
}
