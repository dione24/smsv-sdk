import { describe, expect, it, vi } from "vitest";
import { pollBatchStatusUntilTerminal } from "./batchPoll";
import type { BatchStatusResult } from "./types";

describe("pollBatchStatusUntilTerminal", () => {
  it("polls until queued hits zero", async () => {
    let n = 0;
    const fetchStatus = vi.fn(async (): Promise<BatchStatusResult> => {
      n += 1;
      if (n < 3) {
        return {
          batchId: "batch_x",
          stats: { total: 2, queued: 2, sent: 0, delivered: 0, failed: 0 },
          messages: [],
        };
      }
      return {
        batchId: "batch_x",
        stats: { total: 2, queued: 0, sent: 0, delivered: 2, failed: 0 },
        messages: [],
      };
    });

    const onProgress = vi.fn();
    const result = await pollBatchStatusUntilTerminal(fetchStatus, {
      intervalMs: 1,
      timeoutMs: 5000,
      onProgress,
    });

    expect(result.stats.queued).toBe(0);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalled();
  });

  it("throws on timeout", async () => {
    const fetchStatus = vi.fn(async (): Promise<BatchStatusResult> => ({
      batchId: "batch_y",
      stats: { total: 1, queued: 1, sent: 0, delivered: 0, failed: 0 },
      messages: [],
    }));

    await expect(
      pollBatchStatusUntilTerminal(fetchStatus, { intervalMs: 1, timeoutMs: 50 }),
    ).rejects.toThrow(/timeout/);
  });
});
