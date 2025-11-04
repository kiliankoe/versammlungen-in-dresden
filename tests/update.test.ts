import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";

// --- Mocking Modules with Bun ---
const mockMastodonInstance = {
  publish: mock.fn(async () => {}),
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

// Mock Bun.file for saved assemblies
const mockBunFileJson = mock.fn(async () => ({ Versammlungen: [] }));
const mockBunFile = mock.fn(() => ({ json: mockBunFileJson }));
(global as any).Bun = { file: mockBunFile };


describe("src/update.ts Script", () => {
  const originalEnv = { ...process.env }; // Shallow copy

  beforeEach(async () => {
    process.env = { ...originalEnv }; // Restore original environment variables

    // Reset mocks
    MastodonPublisherMock.mockClear();
    mockMastodonInstance.publish.mockClear();
    BlueskyPublisherMock.mockClear();
    mockBlueskyInstance.publish.mockClear();
    IcsPublisherMock.mockClear();
    mockIcsInstance.publish.mockClear();
    fetchAssembliesMock.mockClear().mockResolvedValue({ Versammlungen: [] }); // Default mock
    mockBunFileJson.mockClear().mockResolvedValue({ Versammlungen: [] }); // Default mock
    mockBunFile.mockClear().mockReturnValue({ json: mockBunFileJson });


    // Dynamically import the script to re-run its top-level code.
    // Bun caches imports, so this needs careful handling or a different approach
    // if we need full script re-execution for each test.
    // For now, we rely on resetting process.env and mocks.
    // If the script's top-level code (publisher instantiations) doesn't re-run,
    // these tests might not behave as expected across multiple runs without test file isolation.
    // Bun's default behavior is to run each test file in a separate process, which helps.
  });

  afterAll(() => {
    process.env = originalEnv; // Restore original env
  });

  const runUpdateScript = async () => {
    // This is a way to force re-evaluation of the script under test if Bun caches it.
    // By appending a unique query string, we can sometimes bypass the cache for dynamic imports.
    // However, the most reliable way is usually Bun's per-file test process isolation.
    // If the script has already been imported, its top-level code (like publisher checks) might not re-run.
    // For these tests, we'll assume that setting env vars BEFORE the dynamic import works for a single execution.
    return await import(`../src/update.ts?${Date.now()}`);
  }

  it("should attempt to initialize MastodonPublisher if env vars are set", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";
    fetchAssembliesMock.mockResolvedValueOnce({ Versammlungen: [{ Thema: "Test" }] });

    await runUpdateScript();

    expect(MastodonPublisherMock).toHaveBeenCalledTimes(1);
  });

  it("should call publish on configured publishers if new assemblies are found", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";
    process.env.BLUESKY_IDENTIFIER = "bsky-id";
    process.env.BLUESKY_PASSWORD = "bsky-pass";

    const sampleAssembly = { Datum: "2025-01-01", Zeit: "12:00", Thema: "Future Event", Ort: "Here", Startpunkt: "There", Status: "New" };
    fetchAssembliesMock.mockResolvedValueOnce({ Versammlungen: [sampleAssembly] });
    // mockBunFileJson is already set to return empty Versammlungen by default in beforeEach

    await runUpdateScript();

    expect(MastodonPublisherMock).toHaveBeenCalledTimes(1);
    expect(BlueskyPublisherMock).toHaveBeenCalledTimes(1);
    expect(mockMastodonInstance.publish).toHaveBeenCalledWith(sampleAssembly);
    expect(mockBlueskyInstance.publish).toHaveBeenCalledWith(sampleAssembly);
  });

  it("should skip BlueskyPublisher if its env vars are missing", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";

    const consoleWarnSpy = mock.spyOn(console, 'warn').mockImplementation(() => {});

    await runUpdateScript();

    expect(BlueskyPublisherMock).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("BlueskyPublisher not initialized"));

    consoleWarnSpy.mockRestore();
  });

  it("should skip IcsPublisher if its env var is missing", async () => {
    process.env.MASTO_SERVER_URL = "url";
    process.env.ACCESS_TOKEN = "token";
    process.env.ACCOUNT_ID = "id";

    const consoleWarnSpy = mock.spyOn(console, 'warn').mockImplementation(() => {});

    await runUpdateScript();

    expect(IcsPublisherMock).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("IcsPublisher not initialized"));

    consoleWarnSpy.mockRestore();
  });
});
