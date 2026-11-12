import { Action, ActionPanel, Detail, Icon, Keyboard, launchCommand, LaunchProps, LaunchType } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { withDelta } from "./components/with-delta";
import { askPastThreads } from "./lib/delta";

/** Delta's model access is tied to the account's plan, so payment errors deserve a clearer explanation. */
function describeError(error: Error): string {
  if (/402|payment required/i.test(error.message)) {
    return "Delta couldn't reach a model to answer. Check your Delta plan or model settings, then try again.";
  }
  return error.message;
}

function AskPastThreads(props: LaunchProps<{ arguments: Arguments.AskPastThreads }>) {
  const question = props.arguments.question.trim();
  const {
    data: answer,
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(askPastThreads, [question], {
    failureToastOptions: { title: "Couldn't answer from past threads" },
  });

  let body: string;
  if (answer) {
    body = answer.trim();
  } else if (error) {
    body = `> ${describeError(error)}`;
  } else {
    body = "_Searching your Delta threads…_";
  }

  return (
    <Detail
      isLoading={isLoading}
      markdown={`## ${question}\n\n${body}`}
      actions={
        <ActionPanel>
          {answer && (
            <Action.CopyToClipboard
              title="Copy Answer"
              content={answer.trim()}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
          )}
          <Action
            title="Ask Again"
            icon={Icon.ArrowClockwise}
            shortcut={Keyboard.Shortcut.Common.Refresh}
            onAction={revalidate}
          />
          <Action
            title="Search Threads"
            icon={Icon.MagnifyingGlass}
            shortcut={{ modifiers: ["cmd"], key: "f" }}
            onAction={() => launchCommand({ name: "search-threads", type: LaunchType.UserInitiated })}
          />
        </ActionPanel>
      }
    />
  );
}

export default withDelta(AskPastThreads, <Detail isLoading />);
