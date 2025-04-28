import { AtpAgent, type AtpSessionData, type AtpSessionEvent } from "@atproto/api";

export async function bskyClient() {
  const agent = new AtpAgent({
    service: "https://bsky.social",
    persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
      // store the session-data for reuse
    },
  });

  await agent.login({
    identifier: "alice@mail.com",
    password: "hunter2",
  });

  return agent;
}
