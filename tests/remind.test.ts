import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";

// --- Mocking Modules with Bun ---
const mockMastodonInstance = {
  publish: mock.fn(async () => {}), // Though not used by remind.ts
  remind: mock.fn(async () => {}),
};
const MastodonPublisherMock = mock.fn(() => mockMastodonInstance);
mock.module("../src/mastodon", () => ({ MastodonPublisher: MastodonPublisherMock }));

const mockBlueskyInstance = {
  publish: mock.fn(async () => {}),
  remind: mock.fn(async () => {}),
};
const BlueskyPublisherMock = mock.fn(() => mockBlueskyInstance);
mock.module("../src/bluesky", () => ({ BlueskyPublisher: BlueskyPublisherMock }));

const mockIcsInstance = {
  publish: mock.fn(async () => {}),
  remind: mock.fn(async () => {}),
};
const IcsPublisherMock = mock.fn(() => mockIcsInstance);
mock.module("../src/ics", () => ({ IcsPublisher: IcsPublisherMock }));

const fetchAssembliesMock = mock.fn(async () => ({ Versammlungen: [] }));
mock.module("../src/util", () => ({
  fetchAssemblies: fetchAssembliesMock,
}));


describe("src/remind.ts Script", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };

    // Reset mocks
    MastodonPublisherMock.mockClear();
    mockMastodonInstance.remind.mockClear();
    BlueskyPublisherMock.mockClear();
    mockBlueskyInstance.remind.mockClear();
    IcsPublisherMock.mockClear();
    mockIcsInstance.remind.mockClear();
    fetchAssembliesMock.mockClear().mockResolvedValue({ Versammlungen: [] });

    // As in update.test.ts, ensure clean state for script re-evaluation.
    // Dynamic import with cache busting is one strategy.
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const runRemindScript = async () => {
    return await import(`../src/remind.ts?${Date.now()}`);
  }

  it("should attempt to initialize MastodonPublisher for reminders if env vars are set", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";

    const today = new Date().toISOString().slice(0,10);
    fetchAssembliesMock.mockResolvedValueOnce({ Versammlungen: [{ Thema: "Test Reminder", Datum: today }] });

    await runRemindScript();

    expect(MastodonPublisherMock).toHaveBeenCalledTimes(1);
  });

  it("should call remind on configured publishers if assemblies for today are found", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";
    process.env.BLUESKY_IDENTIFIER = "bsky-id";
    process.env.BLUESKY_PASSWORD = "bsky-pass";

    const today = new Date().toISOString().slice(0,10);
    const sampleAssemblyToday = { Datum: today, Thema: "Today Event" };
    fetchAssembliesMock.mockResolvedValueOnce({ Versammlungen: [sampleAssemblyToday] });

    await runRemindScript();

    expect(MastodonPublisherMock).toHaveBeenCalledTimes(1);
    expect(BlueskyPublisherMock).toHaveBeenCalledTimes(1);
    expect(mockMastodonInstance.remind).toHaveBeenCalledWith(sampleAssemblyToday);
    expect(mockBlueskyInstance.remind).toHaveBeenCalledWith(sampleAssemblyToday);
  });

  it("should skip BlueskyPublisher for reminders if its env vars are missing", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";

    const consoleWarnSpy = mock.spyOn(console, 'warn').mockImplementation(() => {});

    await runRemindScript();

    expect(BlueskyPublisherMock).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("BlueskyPublisher not initialized for reminders"));

    consoleWarnSpy.mockRestore();
  });

  it("should skip IcsPublisher for reminders if its env var is missing", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";

    const consoleWarnSpy = mock.spyOn(console, 'warn').mockImplementation(() => {});

    await runRemindScript();

    expect(IcsPublisherMock).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("IcsPublisher not initialized for reminders"));

    consoleWarnSpy.mockRestore();
  });

  it("should not call remind if no assemblies are scheduled for today", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    fetchAssembliesMock.mockResolvedValueOnce({ Versammlungen: [{ Datum: yesterday, Thema: "Yesterday Event" }] });

    await runRemindScript();

    // Publishers might be initialized if their env vars are set
    if (process.env.MASTO_SERVER_URL) {
        expect(MastodonPublisherMock).toHaveBeenCalledTimes(1);
        expect(mockMastodonInstance.remind).not.toHaveBeenCalled();
    } else {
        expect(MastodonPublisherMock).not.toHaveBeenCalled();
    }
  });
});
