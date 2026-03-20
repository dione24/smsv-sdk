import { describe, expect, it } from "vitest";
import { LocalSendQueue, withExponentialBackoff } from "./messageQueue";

describe("withExponentialBackoff", () => {
  it("succeeds after transient failures", async () => {
    let n = 0;
    const v = await withExponentialBackoff(
      async () => {
        n += 1;
        if (n < 3) throw new Error("nope");
        return 99;
      },
      { maxRetries: 5, baseMs: 1, maxMs: 20 },
    );
    expect(v).toBe(99);
    expect(n).toBe(3);
  });

  it("stops when isRetryable returns false", async () => {
    let n = 0;
    await expect(
      withExponentialBackoff(
        async () => {
          n++;
          throw new Error("fatal");
        },
        {
          maxRetries: 5,
          baseMs: 1,
          isRetryable: () => false,
        },
      ),
    ).rejects.toThrow("fatal");
    expect(n).toBe(1);
  });
});

describe("LocalSendQueue", () => {
  it("runs jobs in order with concurrency 1", async () => {
    const order: string[] = [];
    const q = new LocalSendQueue<string>({ maxConcurrency: 1 });
    await q.add("a", async (x) => {
      order.push(x);
    });
    await q.add("b", async (x) => {
      order.push(x);
    });
    await q.onIdle();
    expect(order).toEqual(["a", "b"]);
  });
});
