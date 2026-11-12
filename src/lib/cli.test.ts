import { describe, expect, it } from "vitest";
import { buildCreateThreadArgs, buildQueryArgs, findThreadId, parseCliError, parseDeltaDate } from "./cli";

describe("buildCreateThreadArgs", () => {
  it("passes the prompt as a single --prompt= argument so leading dashes aren't flags", () => {
    expect(buildCreateThreadArgs({ prompt: "--help me", visibility: "private" })).toEqual([
      "thread",
      "create",
      "--prompt=--help me",
      "--visibility",
      "private",
    ]);
  });

  it("adds the organization only when one is chosen", () => {
    expect(buildCreateThreadArgs({ prompt: "Hi", visibility: "organization", organizationId: "org_1" })).toEqual([
      "thread",
      "create",
      "--prompt=Hi",
      "--visibility",
      "organization",
      "--organization",
      "org_1",
    ]);
  });
});

describe("buildQueryArgs", () => {
  it("separates the question from flags with --", () => {
    expect(buildQueryArgs("-v why?")).toEqual(["thread", "query", "--", "-v why?"]);
  });
});

describe("parseCliError", () => {
  it("returns the last stderr line without the delta: prefix", () => {
    // Real output of `delta thread archive does-not-exist` in Delta 0.25.0.
    expect(parseCliError("delta: expected a thread id, share id, or Delta link\n", "fallback")).toBe(
      "expected a thread id, share id, or Delta link",
    );
  });

  it("strips an error: prefix and skips trailing blank lines", () => {
    expect(parseCliError("warning: something\nerror: not signed in\n\n", "fallback")).toBe("not signed in");
  });

  it("falls back when stderr is empty", () => {
    expect(parseCliError("  \n", "Command failed")).toBe("Command failed");
  });
});

describe("findThreadId", () => {
  it.each([
    ["a bare string", "ksQQabc", "ksQQabc"],
    ["a thread_id field", { thread_id: "ksQQ1", id: "other" }, "ksQQ1"],
    ["an id field", { id: "ksQQ2" }, "ksQQ2"],
    ["a nested thread object", { operation: "created", thread: { id: "ksQQ3" } }, "ksQQ3"],
    ["a nested result object", { result: { thread_id: "ksQQ4" } }, "ksQQ4"],
  ])("reads %s", (_, value, expected) => {
    expect(findThreadId(value)).toBe(expected);
  });

  it.each([
    ["null", null],
    ["an empty string", ""],
    ["an empty id", { id: "" }],
    ["a non-string id", { id: 42 }],
    ["an unrelated object", { operation: "created" }],
  ])("returns undefined for %s", (_, value) => {
    expect(findThreadId(value)).toBeUndefined();
  });
});

describe("parseDeltaDate", () => {
  it("parses Delta's UTC timestamp format", () => {
    expect(parseDeltaDate("2026-11-09 17:41:52 UTC")?.toISOString()).toBe("2026-11-09T17:41:52.000Z");
  });

  it("returns undefined for unparseable values", () => {
    expect(parseDeltaDate("yesterday")).toBeUndefined();
  });
});
