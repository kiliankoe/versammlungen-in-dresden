import { describe, it, expect, mock, beforeEach } from "bun:test";
import { MastodonPublisher } from "../src/mastodon";
import { Assembly } from "../src/assembly";

// --- Mocking external dependencies ---

// Mock for getAllStatuses from ../src/util
const getAllStatusesMock = mock.fn();
mock.module("../src/util", () => ({
  getAllStatuses: getAllStatusesMock,
}));

// Mock for the 'masto' client and its methods
const mockMastoClientInstance = {
  v1: {
    statuses: {
      create: mock.fn(),
      $select: mock.fn(function(this: any, statusId: string) { // Use function for 'this' context if needed, or ensure chain
        // This mock needs to return an object that has a 'reblog' method
        return {
          reblog: mock.fn() // This is the reblog mock specific to this $select call
        };
      })
    }
  }
};
// Store the reblog mock separately if we need to assert it directly for a specific $select call.
// This becomes tricky if $select is called multiple times. A simpler way for these tests
// might be to have a single, clearable reblog mock that $select always returns.
const generalReblogMock = mock.fn();
mockMastoClientInstance.v1.statuses.$select = mock.fn(() => ({ reblog: generalReblogMock }));


const createRestAPIClientMock = mock.fn(() => mockMastoClientInstance);
mock.module("masto", () => ({
  createRestAPIClient: createRestAPIClientMock,
}));


describe("MastodonPublisher", () => {
  const mockServerUrl = "https://mastodon.example.com";
  const mockAccessToken = "test_access_token";
  const mockAccountId = "test_account_id";

  const sampleAssembly: Assembly = {
    Versammlungsart: "Demo",
    Datum: "2023-10-27",
    Zeit: "14:00",
    Thema: "Test Assembly for Publishing",
    Ort: "Sample Location",
    Startpunkt: "Start Here",
    Status: "Geplant",
    Antragdetails: "Some details about the assembly.",
    Veranstalter: "Test Org",
    Teilnehmer: "100",
    Auflagen: "None",
    Besonderheiten: "Peaceful",
    Tweet: "Test tweet text",
    Zeitstempel: "2023-10-26T10:00:00Z",
  };

  beforeEach(() => {
    createRestAPIClientMock.mockClear();
    mockMastoClientInstance.v1.statuses.create.mockClear().mockResolvedValue({ url: "http://status.url" }); // Default success
    // Clear specific reblog mock and the $select mock
    generalReblogMock.mockClear().mockResolvedValue({url: "http://reblog.url" });
    mockMastoClientInstance.v1.statuses.$select.mockClear().mockReturnValue({ reblog: generalReblogMock });
    getAllStatusesMock.mockClear();
  });

  describe("constructor", () => {
    it("should initialize correctly and call createRestAPIClient with credentials", () => {
      const publisher = new MastodonPublisher(mockServerUrl, mockAccessToken, mockAccountId);
      expect(publisher).toBeInstanceOf(MastodonPublisher);
      expect(createRestAPIClientMock).toHaveBeenCalledTimes(1);
      expect(createRestAPIClientMock).toHaveBeenCalledWith({
        url: mockServerUrl,
        accessToken: mockAccessToken,
      });
    });

    it("should throw an error if server URL is missing (as per MastodonPublisher's own check)", () => {
      // The MastodonPublisher class itself should throw this error before createRestAPIClient is called.
      expect(() => new MastodonPublisher("", mockAccessToken, mockAccountId)).toThrow("Mastodon server URL, access token, or account ID cannot be empty.");
    });

    it("should throw an error if access token is missing", () => {
      expect(() => new MastodonPublisher(mockServerUrl, "", mockAccountId)).toThrow("Mastodon server URL, access token, or account ID cannot be empty.");
    });

    it("should throw an error if account ID is missing", () => {
      expect(() => new MastodonPublisher(mockServerUrl, mockAccessToken, "")).toThrow("Mastodon server URL, access token, or account ID cannot be empty.");
    });
  });

  describe("publish method", () => {
    it("should call masto.v1.statuses.create with correctly formatted status", async () => {
      const publisher = new MastodonPublisher(mockServerUrl, mockAccessToken, mockAccountId);
      await publisher.publish(sampleAssembly);

      expect(mockMastoClientInstance.v1.statuses.create).toHaveBeenCalledTimes(1);
      // Exact string matching can be brittle; consider expect.stringContaining for key parts
      expect(mockMastoClientInstance.v1.statuses.create).toHaveBeenCalledWith({
        status: expect.stringContaining("Test Assembly for Publishing"),
        visibility: "public",
        spoilerText: expect.stringContaining("Test Assembly for Publishing"),
      });
    });

    it("should throw error if status creation fails", async () => {
        mockMastoClientInstance.v1.statuses.create.mockRejectedValueOnce(new Error("API Error"));
        const publisher = new MastodonPublisher(mockServerUrl, mockAccessToken, mockAccountId);
        await expect(publisher.publish(sampleAssembly)).rejects.toThrow("API Error");
    });
  });

  describe("remind method", () => {
    it("should call getAllStatuses and reblog if a matching status is found", async () => {
      const publisher = new MastodonPublisher(mockServerUrl, mockAccessToken, mockAccountId);
      const mockStatusId = "12345";
      const mockFoundStatus = {
        id: mockStatusId,
        content: `Some content about ${sampleAssembly.Thema} on ${sampleAssembly.Datum}`, // Ensure content matches
        url: "http://original.status.url"
      };

      getAllStatusesMock.mockResolvedValue([mockFoundStatus]);

      await publisher.remind(sampleAssembly);

      expect(getAllStatusesMock).toHaveBeenCalledWith(mockMastoClientInstance, mockAccountId, { max: 250 });
      expect(mockMastoClientInstance.v1.statuses.$select).toHaveBeenCalledWith(mockStatusId);
      expect(generalReblogMock).toHaveBeenCalledTimes(1);
    });

    it("should not reblog if no matching status is found", async () => {
      const publisher = new MastodonPublisher(mockServerUrl, mockAccessToken, mockAccountId);
      getAllStatusesMock.mockResolvedValue([]); // No statuses found

      await publisher.remind(sampleAssembly);

      expect(getAllStatusesMock).toHaveBeenCalledTimes(1);
      expect(mockMastoClientInstance.v1.statuses.$select).not.toHaveBeenCalled();
      expect(generalReblogMock).not.toHaveBeenCalled();
    });

     it("should throw error if getAllStatuses fails", async () => {
        getAllStatusesMock.mockRejectedValueOnce(new Error("Network Error"));
        const publisher = new MastodonPublisher(mockServerUrl, mockAccessToken, mockAccountId);
        await expect(publisher.remind(sampleAssembly)).rejects.toThrow("Network Error");
    });

    it("should throw error if reblogging fails", async () => {
        const mockStatusId = "123";
        getAllStatusesMock.mockResolvedValue([{ id: mockStatusId, content: `${sampleAssembly.Thema} ${sampleAssembly.Datum}` }]);
        generalReblogMock.mockRejectedValueOnce(new Error("Reblog Failed"));
        const publisher = new MastodonPublisher(mockServerUrl, mockAccessToken, mockAccountId);
        await expect(publisher.remind(sampleAssembly)).rejects.toThrow("Reblog Failed");
    });
  });
});
