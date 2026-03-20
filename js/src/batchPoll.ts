import type { BatchStatusResult, BatchStatusStats } from "./types";

export type BatchProgressPayload = {
  batchId: string;
  stats: BatchStatusStats;
  /** Share of messages in a terminal state (delivered, read, or failed). */
  percentSettled: number;
};

export type PollBatchOptions = {
  /** Polling interval (default 2000ms). */
  intervalMs?: number;
  /** Max wait before abort (default 5 minutes). */
  timeoutMs?: number;
  /** Called after each successful status fetch. */
  onProgress?: (p: BatchProgressPayload) => void | Promise<void>;
  /**
   * When to stop polling. Default: all messages have left the queue (`queued === 0`).
   * Use custom logic e.g. `(s) => s.delivered + s.failed >= s.total` to wait for final delivery.
   */
  isTerminal?: (stats: BatchStatusStats) => boolean;
};

function percentSettled(stats: BatchStatusStats): number {
  if (stats.total <= 0) return 0;
  const settled = stats.delivered + stats.failed;
  return Math.min(100, Math.round((settled / stats.total) * 100));
}

function defaultIsTerminal(stats: BatchStatusStats): boolean {
  return stats.total > 0 && stats.queued === 0;
}

/**
 * Poll `GET /v1/batch/:batchId` until `isTerminal` returns true or timeout.
 */
export async function pollBatchStatusUntilTerminal(
  fetchStatus: () => Promise<BatchStatusResult>,
  options: PollBatchOptions = {},
): Promise<BatchStatusResult> {
  const intervalMs = options.intervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 300_000;
  const isTerminal = options.isTerminal ?? defaultIsTerminal;
  const start = Date.now();

  let last: BatchStatusResult | undefined;

  while (true) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        last
          ? `Batch poll timeout after ${timeoutMs}ms (batchId=${last.batchId})`
          : `Batch poll timeout after ${timeoutMs}ms`,
      );
    }

    last = await fetchStatus();

    const p: BatchProgressPayload = {
      batchId: last.batchId,
      stats: last.stats,
      percentSettled: percentSettled(last.stats),
    };
    await options.onProgress?.(p);

    if (isTerminal(last.stats)) {
      return last;
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
