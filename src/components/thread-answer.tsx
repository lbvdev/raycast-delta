import { Action, ActionPanel, Detail, Icon, Keyboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useAnswerModel } from "../hooks/use-answer-model";
import { buildAnswerMarkdown, getAnswerSources, isTooVague } from "../lib/answers";
import { extractKeywords, isDeltaError } from "../lib/cli";
import { askDelta } from "../lib/delta";
import { openThreadInDelta, showDeltaFailure } from "../lib/feedback";
import { getThreadTitle } from "../lib/threads";
import { Thread } from "../lib/types";
import { AnswerModelPicker } from "./answer-model-picker";
import { ChangeModelAction } from "./change-model-action";

interface ThreadAnswerProps {
  question: string;
  /** Answer from this thread only; otherwise Delta searches all threads. */
  thread?: Thread;
  /** Only for pushed screens; a command's root keeps its own title. */
  navigationTitle?: string;
  /** Set where the model was already visible and chosen, so the first question doesn't ask again. */
  skipModelChoice?: boolean;
}

function ask(question: string, threadId: string | undefined, model: string | undefined) {
  return askDelta(question, { threadId, model });
}

/**
 * Asks Delta once per mount. Answers aren't cached on purpose: every question costs a model call,
 * so asking again is always an explicit action.
 */
export function ThreadAnswer({ question, thread, navigationTitle, skipModelChoice = false }: ThreadAnswerProps) {
  const { model, hasChosen, isLoading: isLoadingModel } = useAnswerModel();
  const threadTitle = thread && getThreadTitle(thread);
  const keywords = thread ? [] : extractKeywords(question);
  // Delta refuses a question it can't pick threads for, so don't spend a call or a model choice on it.
  const cannotAsk = isTooVague({ threadTitle, keywords });
  const needsModelChoice = !cannotAsk && !isLoadingModel && !hasChosen && !skipModelChoice;

  const {
    data: result,
    isLoading: isAsking,
    error,
    revalidate: askAgain,
  } = usePromise(ask, [question, thread?.id, model], {
    // Wait for the stored model so the question isn't asked twice, or with the wrong model.
    execute: !cannotAsk && !isLoadingModel && !needsModelChoice,
    onError: (e) => {
      // "No thread matches" is an answer of sorts; the screen explains it without an error toast.
      if (!isDeltaError(e, "no-matching-threads")) {
        showDeltaFailure(e, "Delta couldn't answer");
      }
    },
  });

  // Before the first answer, pick a model once; choosing it renders the answer in this same place.
  if (needsModelChoice) {
    return <AnswerModelPicker isFirstChoice />;
  }

  const sources = getAnswerSources(result, thread && { id: thread.id, name: getThreadTitle(thread) });

  return (
    <Detail
      isLoading={isAsking || isLoadingModel}
      navigationTitle={navigationTitle}
      markdown={buildAnswerMarkdown({ question, model, threadTitle, keywords, result, error })}
      actions={
        <ActionPanel>
          {result?.answer && (
            <Action.CopyToClipboard
              title="Copy Answer"
              content={result.answer}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
          )}
          {sources.length === 1 && (
            <Action
              title={thread ? "Open Thread in Delta" : "Open Source Thread in Delta"}
              icon={Icon.AppWindow}
              shortcut={Keyboard.Shortcut.Common.Open}
              onAction={() => openThreadInDelta(sources[0])}
            />
          )}
          {sources.length > 1 && (
            <ActionPanel.Submenu
              title="Open Source Thread in Delta"
              icon={Icon.AppWindow}
              shortcut={Keyboard.Shortcut.Common.Open}
            >
              {sources.map((source) => (
                <Action
                  key={source.id}
                  title={source.name}
                  icon={Icon.SpeechBubble}
                  onAction={() => openThreadInDelta(source)}
                />
              ))}
            </ActionPanel.Submenu>
          )}
          {!cannotAsk && !isAsking && (
            <Action
              title="Ask Again"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={askAgain}
            />
          )}
          {!cannotAsk && <ChangeModelAction />}
        </ActionPanel>
      }
    />
  );
}
