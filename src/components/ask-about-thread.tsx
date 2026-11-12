import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import { useAnswerModel } from "../hooks/use-answer-model";
import { getThreadTitle, isAskableQuestion } from "../lib/threads";
import { Thread } from "../lib/types";
import { AnswerModelDropdown } from "./answer-model-dropdown";
import { ChangeModelAction } from "./change-model-action";
import { ThreadAnswer } from "./thread-answer";

/** One-keystroke questions, so most of the time there's nothing to type. */
const QUICK_QUESTIONS: { question: string; icon: Icon }[] = [
  { question: "Summarize this thread", icon: Icon.Text },
  { question: "What was decided?", icon: Icon.CheckCircle },
  { question: "What's left to do?", icon: Icon.BulletPoints },
  { question: "Which files changed and why?", icon: Icon.Document },
];

/** Pushed from a thread's actions; answers come from that thread only. */
export function AskAboutThread({ thread }: { thread: Thread }) {
  const [searchText, setSearchText] = useState("");
  const typed = searchText.trim();
  const title = getThreadTitle(thread);
  const { model, hasChosen, setModel, isLoading: isLoadingModel } = useAnswerModel();

  const askAction = (question: string) => (
    <ActionPanel>
      <Action.Push
        title="Ask Delta"
        icon={Icon.Stars}
        // The model is visible in the dropdown here, so asking confirms it.
        target={<ThreadAnswer question={question} thread={thread} navigationTitle={title} skipModelChoice />}
        onPush={() => {
          // Remember the model shown in the dropdown, so later questions elsewhere don't ask for one.
          if (!isLoadingModel && !hasChosen) {
            setModel(model);
          }
        }}
      />
      <ChangeModelAction />
    </ActionPanel>
  );

  return (
    <List
      navigationTitle={`Ask About ${title}`}
      searchBarPlaceholder="Type a question or pick one below"
      filtering={false}
      onSearchTextChange={setSearchText}
      searchBarAccessory={<AnswerModelDropdown />}
    >
      {isAskableQuestion(typed) && (
        <List.Section title="Your Question">
          <List.Item title={typed} icon={Icon.Stars} actions={askAction(typed)} />
        </List.Section>
      )}
      <List.Section title="Quick Questions">
        {QUICK_QUESTIONS.map(({ question, icon }) => (
          <List.Item key={question} title={question} icon={icon} actions={askAction(question)} />
        ))}
      </List.Section>
    </List>
  );
}
