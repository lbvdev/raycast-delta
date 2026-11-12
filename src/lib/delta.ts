/** Everything that talks to the Delta app or runs its CLI. Pure parsing lives in `cli.ts`. */
import { Application, getApplications } from "@raycast/api";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildCreateThreadArgs, buildQueryArgs, findThreadId, parseCliError } from "./cli";
import { Organization, Thread, Visibility } from "./types";

export const DELTA_BUNDLE_ID = "com.zed-industries.delta";
export const DELTA_DOWNLOAD_URL = "https://delta.dev/download";

export class DeltaNotInstalledError extends Error {
  constructor() {
    super("Delta is not installed");
    this.name = "DeltaNotInstalledError";
  }
}

// Looking up installed apps is slow, so do it once per command launch.
let deltaAppPromise: Promise<Application | undefined> | undefined;

export function getDeltaApp(): Promise<Application | undefined> {
  deltaAppPromise ??= getApplications()
    .then((applications) => applications.find((app) => app.bundleId === DELTA_BUNDLE_ID))
    .catch((error) => {
      deltaAppPromise = undefined;
      throw error;
    });
  return deltaAppPromise;
}

/** The CLI ships inside the app bundle, so we never depend on the user's PATH. */
export async function getDeltaCliPath(): Promise<string> {
  const app = await getDeltaApp();
  const cliPath = app ? join(app.path, "Contents", "MacOS", "delta") : undefined;
  if (!cliPath || !existsSync(cliPath)) {
    throw new DeltaNotInstalledError();
  }
  return cliPath;
}

export async function runDelta(args: string[], options: { timeout?: number } = {}): Promise<string> {
  const cliPath = await getDeltaCliPath();
  return new Promise((resolve, reject) => {
    execFile(
      cliPath,
      args,
      { timeout: options.timeout ?? 30_000, maxBuffer: 32 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (!error) {
          resolve(stdout);
        } else if (error.killed) {
          reject(new Error("Delta took too long to respond"));
        } else {
          reject(new Error(parseCliError(stderr, error.message)));
        }
      },
    );
  });
}

export async function runDeltaJson<T>(args: string[], options?: { timeout?: number }): Promise<T> {
  const stdout = await runDelta([...args, "--json"], options);
  return JSON.parse(stdout) as T;
}

export function listThreads(): Promise<Thread[]> {
  return runDeltaJson<Thread[]>(["thread", "list"]);
}

export async function listOrganizations(): Promise<Organization[]> {
  const result = await runDeltaJson<{ organizations: Organization[] }>(["org", "list"]);
  return result.organizations;
}

export async function setThreadArchived(thread: Pick<Thread, "id">, archived: boolean): Promise<void> {
  await runDelta(["thread", archived ? "archive" : "unarchive", thread.id]);
}

export async function shareThreadWithOrganization(thread: Pick<Thread, "id">): Promise<void> {
  await runDelta(["thread", "share", thread.id, "--visibility", "organization"], { timeout: 60_000 });
}

/** Creates a thread with an unsent prompt and returns its ID. */
export async function createThread(options: {
  prompt: string;
  organizationId?: string;
  visibility: Visibility;
}): Promise<string> {
  const result = await runDeltaJson<unknown>(buildCreateThreadArgs(options), { timeout: 60_000 });
  const threadId = findThreadId(result);
  if (!threadId) {
    throw new Error("Delta created the thread but didn't return its ID");
  }
  return threadId;
}

/** Opens a path or Delta link in the app, or just activates it. */
export async function openInDelta(target?: string): Promise<void> {
  await runDelta(target ? ["open", target] : ["open"]);
}

export function askPastThreads(question: string): Promise<string> {
  return runDelta(buildQueryArgs(question), { timeout: 180_000 });
}
