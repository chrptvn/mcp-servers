import { execFileSync } from "node:child_process";

const GOG_BINARY = process.env["GOG_BINARY"] ?? "gog";
const GOG_ACCOUNT = process.env["GOG_ACCOUNT"];

export class GogError extends Error {
  constructor(
    public readonly exitCode: number | null,
    message: string
  ) {
    super(message);
    this.name = "GogError";
  }
}

/**
 * Spawns the `gog` binary with the given arguments plus `--json`,
 * optionally prepending `--account <GOG_ACCOUNT>` when the env var is set.
 * Returns the parsed JSON output.
 */
export function spawnGog<T>(args: string[]): T {
  const accountArgs: string[] = GOG_ACCOUNT ? ["--account", GOG_ACCOUNT] : [];
  const fullArgs = [...accountArgs, ...args, "--json"];

  let stdout: string;
  try {
    stdout = execFileSync(GOG_BINARY, fullArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err: unknown) {
    const execErr = err as { status?: number; stderr?: string; message?: string };
    const stderr = execErr.stderr?.trim() ?? "";
    const detail = stderr || execErr.message || "unknown error";
    throw new GogError(execErr.status ?? null, detail);
  }

  try {
    return JSON.parse(stdout) as T;
  } catch {
    throw new GogError(null, `gog returned non-JSON output: ${stdout.slice(0, 200)}`);
  }
}
