/** Pure helpers for the answer screen: what it says while asking, on success and on each failure. */
import { DeltaErrorKind, isDeltaError } from "./cli";
import { getThreadDeeplink } from "./threads";
import { QueryResult, QuerySource } from "./types";

const DEFAULT_MODEL_NAME = "Delta's default";

export function getModelName(model: string | undefined): string {
  return model ?? DEFAULT_MODEL_NAME;
}

/** Markdown link text can't contain unescaped brackets. */
function escapeLinkText(text: string): string {
  return text.replace(/[[\]\\]/g, "\\$&");
}

function listKeywords(keywords: string[]): string {
  return keywords.map((keyword) => `\`${keyword}\``).join(", ");
}

/**
 * The threads an answer came from. A thread-scoped answer always comes from that thread, even if
 * Delta doesn't list it.
 */
export function getAnswerSources(result: QueryResult | undefined, thread?: QuerySource): QuerySource[] {
  if (result?.sources.length) {
    return result.sources;
  }
  return thread ? [thread] : [];
}

function describeError(error: Error, context: { model?: string; keywords: string[]; isThreadScoped: boolean }): string {
  const kind: DeltaErrorKind = isDeltaError(error) ? error.kind : "other";
  switch (kind) {
    case "no-matching-threads":
      return context.isThreadScoped
        ? "Delta couldn't find this thread. Refresh the thread list and try again."
        : `No thread mentions ${listKeywords(context.keywords)}. Delta looks for these words in thread titles, summaries, keywords and messages, so try the words the threads themselves use.`;
    case "unreadable-thread":
      return context.isThreadScoped
        ? "Delta can't load this thread's history, so it can't answer from it. This happens with some imported and recorded threads."
        : "Delta can't load the history of one of the matching threads. Ask about a specific thread with **Ask About Thread** instead.";
    case "other":
      // An unknown failure with a hand-picked model is most often a model Delta doesn't offer.
      return context.model
        ? `${error.message}\n>\n> If “${context.model}” isn't a model Delta offers, change the answer model (⌘⇧M) or switch back to Delta's default.`
        : error.message;
    default:
      return `${error.message}.`;
  }
}

export interface AnswerView {
  question: string;
  model?: string;
  /** Title of the thread the question is about; omitted when asking across all threads. */
  threadTitle?: string;
  /** Keywords Delta picks threads by; only used when asking across all threads. */
  keywords: string[];
  result?: QueryResult;
  error?: Error;
}

/** True when a question across all threads has no word Delta could pick threads by. */
export function isTooVague(view: Pick<AnswerView, "threadTitle" | "keywords">): boolean {
  return view.threadTitle === undefined && view.keywords.length === 0;
}

/** Markdown for the answer screen in every state: too vague, asking, answered, failed. */
export function buildAnswerMarkdown(view: AnswerView): string {
  const { question, model, threadTitle, keywords, result, error } = view;
  const isThreadScoped = threadTitle !== undefined;

  if (isTooVague(view)) {
    return [
      `## ${question || "Ask Delta"}`,
      "### Add Something Specific",
      "Delta picks the threads to read by the specific words in a question, and this one has none. Add a project, feature, error or file name, for example _“What did we decide about the GitLab push?”_",
    ].join("\n\n");
  }

  const scope = isThreadScoped ? `Thread: ${threadTitle}` : `Threads mentioning ${listKeywords(keywords)}`;
  const sections = [`## ${question}`, `_${scope} · Model: ${getModelName(model)}_`];

  if (result) {
    sections.push(result.answer || "_Delta didn't find an answer in these threads._");
    if (!isThreadScoped && result.sources.length > 0) {
      const links = result.sources.map((source) => `- [${escapeLinkText(source.name)}](${getThreadDeeplink(source)})`);
      sections.push(`---\n\n**Sources**\n\n${links.join("\n")}`);
    }
  } else if (error) {
    sections.push(`> ${describeError(error, { model, keywords, isThreadScoped })}`);
  } else {
    sections.push(isThreadScoped ? `_Delta is reading “${threadTitle}”…_` : "_Delta is reading your threads…_");
  }
  return sections.join("\n\n");
}
