import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Project root (repo root when running from dist/ingest/). */
function projectRoot(): string {
  return join(import.meta.dirname, "..", "..");
}

/**
 * Load key=value pairs from a .env file into process.env.
 * Existing environment variables are not overwritten.
 */
export function loadDotEnv(): void {
  const envPath = join(projectRoot(), ".env");
  if (!existsSync(envPath)) return;

  const text = readFileSync(envPath, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
