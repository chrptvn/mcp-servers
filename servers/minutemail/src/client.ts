import type { ApiError } from "./types.js";

const BASE_URL = "https://api.minutemail.co/v1";

export class MinuteMailError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "MinuteMailError";
  }
}

async function parseError(res: Response): Promise<MinuteMailError> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await res.json()) as ApiError;
    return new MinuteMailError(res.status, body.code, body.message);
  }
  const text = await res.text();
  return new MinuteMailError(res.status, "unknown_error", text || res.statusText);
}

export class MinuteMailClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = BASE_URL) {
    const key = apiKey ?? process.env["MINUTEMAIL_API_KEY"];
    if (!key) {
      throw new Error(
        "MinuteMail API key is required. Set the MINUTEMAIL_API_KEY environment variable."
      );
    }
    this.apiKey = key;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw await parseError(res);
    }

    // 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  delete<T = void>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, body);
  }
}
