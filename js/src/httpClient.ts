import fetchDefault from "cross-fetch";
import type { ClientConfig, RateLimitInfo, SmsvError } from "./types";

export class HttpClient {
  private baseUrl: string;
  private apiKey?: string;
  private bearerToken?: string;
  private timeoutMs: number;
  private retries: number;
  private retryBaseMs: number;
  private fetcher: typeof fetch;
  private onRequest?: ClientConfig["onRequest"];
  private onResponse?: ClientConfig["onResponse"];
  private onError?: ClientConfig["onError"];

  constructor(config: ClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? "http://localhost:3001/api").replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.bearerToken = config.bearerToken;
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.retries = config.retries ?? 3;
    this.retryBaseMs = config.retryBaseMs ?? 200;
    this.fetcher = config.fetcher ?? fetchDefault;
    this.onRequest = config.onRequest;
    this.onResponse = config.onResponse;
    this.onError = config.onError;
  }

  async request(method: string, path: string, options: RequestInit & { query?: Record<string, any> } = {}) {
    const url = new URL(this.baseUrl + "/" + path.replace(/^\/+/, ""));
    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined && v !== null) {
          url.searchParams.append(k, String(v));
        }
      }
    }

    let logicalPath = "/" + path.replace(/^\/+/, "");
    const q = url.searchParams.toString();
    if (q) logicalPath += `?${q}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.apiKey) headers["X-API-Key"] = this.apiKey;
    if (this.bearerToken) headers["Authorization"] = `Bearer ${this.bearerToken}`;

    let attempts = 0;
    while (true) {
      try {
        this.onRequest?.({ method, path: logicalPath });
        const t0 = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const res = await this.fetcher(url.toString(), {
          method,
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const rateLimit = this.parseRateLimit(res);
        const text = await res.text();
        const data = text ? JSON.parse(text) : undefined;
        const ms = Date.now() - t0;

        if (res.ok) {
          this.onResponse?.({ method, path: logicalPath, status: res.status, ms });
          return data;
        }

        if (this.shouldRetry(res.status, attempts)) {
          await this.backoff(attempts, rateLimit.retryAfter);
          attempts++;
          continue;
        }

        this.onResponse?.({ method, path: logicalPath, status: res.status, ms });
        const err: SmsvError = new Error(data?.message || data?.error || "SMSV API error");
        err.status = res.status;
        err.payload = data;
        err.rateLimit = rateLimit;
        throw err;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          err = new Error("Request timed out");
        }
        if (this.shouldRetry(0, attempts)) {
          await this.backoff(attempts);
          attempts++;
          continue;
        }
        this.onError?.({ method, path: logicalPath, error: err });
        throw err;
      }
    }
  }

  private shouldRetry(status: number, attempts: number): boolean {
    if (attempts >= this.retries) return false;
    return status === 0 || status >= 500 || status === 429;
  }

  private async backoff(attempt: number, retryAfter?: number) {
    if (retryAfter && retryAfter > 0) {
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return;
    }
    const delay = this.retryBaseMs * (attempt + 1);
    await new Promise((r) => setTimeout(r, delay));
  }

  private parseRateLimit(res: Response): RateLimitInfo {
    return {
      limit: this.toNumber(res.headers.get("x-ratelimit-limit")),
      remaining: this.toNumber(res.headers.get("x-ratelimit-remaining")),
      reset: this.toNumber(res.headers.get("x-ratelimit-reset")),
      retryAfter: this.toNumber(res.headers.get("retry-after")),
    };
  }

  private toNumber(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
