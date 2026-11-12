/** Pure helpers for presenting threads and linking to them. */
import { Thread } from "./types";

export function getThreadTitle(thread: Pick<Thread, "name" | "generated_title">): string {
  return thread.name.trim() || thread.generated_title?.trim() || "Untitled Thread";
}

/** Opens the thread in the Delta desktop app. */
export function getThreadDeeplink(thread: Pick<Thread, "id">): string {
  return `delta://thread/${thread.id}`;
}

/** Opens the thread on delta.dev; only threads with a join ID have one. */
export function getThreadWebUrl(thread: Pick<Thread, "join_id">): string | undefined {
  return thread.join_id ? `https://delta.dev/join/${thread.join_id}` : undefined;
}

/** Newest first; `index` is Delta's creation order. */
export function sortThreadsNewestFirst(threads: Thread[]): Thread[] {
  return [...threads].sort((a, b) => b.index - a.index);
}

export type ThreadFilter = "active" | "archived" | "all";

export function filterThreads(threads: Thread[], filter: ThreadFilter): Thread[] {
  return filter === "all" ? threads : threads.filter((thread) => thread.archived === (filter === "archived"));
}

/** Markdown for the thread detail pane: title, generated title, summary and goals. */
export function buildThreadMarkdown(thread: Thread): string {
  const title = getThreadTitle(thread);
  const sections = [`## ${title}`];
  if (thread.generated_title && thread.generated_title !== title) {
    sections.push(`_${thread.generated_title}_`);
  }
  sections.push(thread.summary ?? "Delta hasn't summarized this thread yet.");
  if (thread.intents.length > 0) {
    sections.push(`### Goals\n\n${thread.intents.map((intent) => `- ${intent}`).join("\n")}`);
  }
  return sections.join("\n\n");
}
