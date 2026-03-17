import { describe, expect, it } from "vitest";
import { SmsvClient } from "../src";

describe("SmsvClient", () => {
  it("creates client with defaults", () => {
    const client = new SmsvClient();
    expect(client).toBeInstanceOf(SmsvClient);
  });

  it("allows custom config", () => {
    const client = new SmsvClient({ baseUrl: "https://api.example.com", apiKey: "test" });
    expect(client).toBeInstanceOf(SmsvClient);
  });
});
