const BASE_URL = "https://dev.to/api";

export class DevToError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "DevToError";
  }
}

async function parseError(res: Response): Promise<DevToError> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    return new DevToError(res.status, body.error ?? body.message ?? res.statusText);
  } catch {
    return new DevToError(res.status, res.statusText);
  }
}

export class DevToClient {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = BASE_URL) {
    this.apiKey = apiKey ?? process.env["DEVTO_API_KEY"];
    this.baseUrl = baseUrl;
  }

  private headers(withAuth = false): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (withAuth && this.apiKey) {
      h["api-key"] = this.apiKey;
    }
    return h;
  }

  private async request<T>(
    method: string,
    path: string,
    options: { auth?: boolean; body?: unknown } = {}
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(options.auth ?? false),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      throw await parseError(res);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }

  get<T>(path: string, auth = false): Promise<T> {
    return this.request<T>("GET", path, { auth });
  }

  post<T>(path: string, body?: unknown, auth = true): Promise<T> {
    return this.request<T>("POST", path, { auth, body });
  }

  put<T>(path: string, body?: unknown, auth = true): Promise<T> {
    return this.request<T>("PUT", path, { auth, body });
  }

  delete<T = void>(path: string, auth = true): Promise<T> {
    return this.request<T>("DELETE", path, { auth });
  }
}
