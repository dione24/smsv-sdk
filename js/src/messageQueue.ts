/**
 * Client-side queue + retry helpers for SMSv sends (rate limits, transient 5xx).
 */

export type BackoffOptions = {
  maxRetries?: number;
  baseMs?: number;
  maxMs?: number;
  /** Return false to fail immediately without retry */
  isRetryable?: (error: unknown) => boolean;
};

export type LocalSendQueueOptions = {
  /** Max parallel sends (default 1) */
  maxConcurrency?: number;
  /** Delay between dequeue attempts when idle (ms) */
  pollIntervalMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff (full jitter optional — simple doubling here).
 */
export async function withExponentialBackoff<T>(operation: () => Promise<T>, options?: BackoffOptions): Promise<T> {
  const maxRetries = options?.maxRetries ?? 5;
  let delay = Math.max(1, options?.baseMs ?? 400);
  const maxMs = options?.maxMs ?? 30_000;
  const isRetryable = options?.isRetryable ?? (() => true);

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries || !isRetryable(e)) {
        throw e;
      }
      await sleep(delay);
      delay = Math.min(maxMs, delay * 2);
    }
  }
  throw lastError;
}

type QueueJob<T> = {
  item: T;
  run: (item: T) => Promise<void>;
  resolve: () => void;
  reject: (e: unknown) => void;
};

/**
 * FIFO queue with bounded concurrency. Use with `client.sendText` / `sendBatch` etc.
 *
 * @example
 * ```ts
 * const q = new LocalSendQueue({ maxConcurrency: 1 });
 * await q.add({ to: "+223...", message: "a" }, (p) => client.sendText(p));
 * await q.add({ to: "+223...", message: "b" }, (p) => client.sendText(p));
 * await q.onIdle();
 * ```
 */
export class LocalSendQueue<T = unknown> {
  private readonly jobs: QueueJob<T>[] = [];
  private active = 0;
  private readonly maxConcurrency: number;
  private readonly pollIntervalMs: number;
  private idleResolvers: Array<() => void> = [];

  constructor(options?: LocalSendQueueOptions) {
    this.maxConcurrency = Math.max(1, options?.maxConcurrency ?? 1);
    this.pollIntervalMs = Math.max(0, options?.pollIntervalMs ?? 0);
  }

  add(item: T, run: (item: T) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.jobs.push({ item, run, resolve, reject });
      void this.pump();
    });
  }

  /** Resolves when all queued jobs have finished (success or failure). */
  onIdle(): Promise<void> {
    if (this.jobs.length === 0 && this.active === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.idleResolvers.push(resolve);
    });
  }

  private flushIdle() {
    if (this.jobs.length === 0 && this.active === 0) {
      const rs = this.idleResolvers;
      this.idleResolvers = [];
      rs.forEach((r) => r());
    }
  }

  private async pump(): Promise<void> {
    while (this.active < this.maxConcurrency && this.jobs.length > 0) {
      const job = this.jobs.shift();
      if (!job) break;
      this.active++;
      void this.runJob(job);
    }
  }

  private async runJob(job: QueueJob<T>): Promise<void> {
    try {
      if (this.pollIntervalMs > 0) {
        await sleep(this.pollIntervalMs);
      }
      await job.run(job.item);
      job.resolve();
    } catch (e) {
      job.reject(e);
    } finally {
      this.active--;
      void this.pump();
      this.flushIdle();
    }
  }
}
