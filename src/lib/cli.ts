/**
 * Pure helpers for building Delta CLI arguments and parsing its output.
 * Nothing here touches Raycast or the file system, so it's covered by unit tests.
 * The CLI is in beta and its output can change between releases; keep parsing tolerant.
 */
import { Visibility } from "./types";

export function buildCreateThreadArgs(options: {
  prompt: string;
  organizationId?: string;
  visibility: Visibility;
}): string[] {
  // `--prompt=` keeps prompts that start with "-" from being parsed as flags.
  const args = ["thread", "create", `--prompt=${options.prompt}`, "--visibility", options.visibility];
  if (options.organizationId) {
    args.push("--organization", options.organizationId);
  }
  return args;
}

export function buildQueryArgs(question: string): string[] {
  // `--` keeps questions that start with "-" from being parsed as flags.
  return ["thread", "query", "--", question];
}

/** Delta prints diagnostics on stderr; the last non-empty line is the actual error. */
export function parseCliError(stderr: string, fallback: string): string {
  const lines = stderr
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return (lines.at(-1) ?? fallback).replace(/^(delta|error):\s*/i, "");
}

/** `thread create --json` isn't a documented contract, so look for the ID defensively. */
export function findThreadId(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value || undefined;
  }
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  for (const key of ["thread_id", "id"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate) {
      return candidate;
    }
  }
  for (const key of ["thread", "result"]) {
    const nested = findThreadId(record[key]);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

/** Delta prints timestamps as `2026-11-09 17:41:52 UTC`. */
export function parseDeltaDate(value: string): Date | undefined {
  const date = new Date(value.replace(" UTC", "Z").replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? undefined : date;
}
