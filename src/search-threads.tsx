import { Action, ActionPanel, Icon, launchCommand, LaunchType, List } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { useMemo, useState } from "react";
import { ThreadActions } from "./components/thread-actions";
import { ThreadListItem } from "./components/thread-list-item";
import { withDelta } from "./components/with-delta";
import { useThreads } from "./hooks/use-threads";
import { filterThreads, sortThreadsNewestFirst, ThreadFilter } from "./lib/threads";

const FILTER_EMPTY_TITLES: Record<ThreadFilter, string> = {
  active: "No Active Threads",
  archived: "No Archived Threads",
  all: "No Threads Yet",
};

function SearchThreads() {
  const [filter, setFilter] = useCachedState<ThreadFilter>("thread-filter", "active");
  const [isShowingDetail, setIsShowingDetail] = useCachedState("show-thread-details", true);
  const [searchText, setSearchText] = useState("");
  const threadsState = useThreads();
  const { data: threads, isLoading, error, revalidate } = threadsState;

  const visibleThreads = useMemo(() => sortThreadsNewestFirst(filterThreads(threads ?? [], filter)), [threads, filter]);
  const detail = { isShowing: isShowingDetail, onToggle: () => setIsShowingDetail(!isShowingDetail) };

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={isShowingDetail && visibleThreads.length > 0}
      searchBarPlaceholder="Search threads by title, summary or keyword"
      filtering
      onSearchTextChange={setSearchText}
      searchBarAccessory={
        <List.Dropdown tooltip="Filter Threads" value={filter} onChange={(value) => setFilter(value as ThreadFilter)}>
          <List.Dropdown.Item title="Active" value="active" icon={Icon.SpeechBubble} />
          <List.Dropdown.Item title="Archived" value="archived" icon={Icon.Box} />
          <List.Dropdown.Item title="All Threads" value="all" icon={Icon.List} />
        </List.Dropdown>
      }
    >
      {error && !threads ? (
        <List.EmptyView
          icon={Icon.Warning}
          title="Couldn't Load Threads"
          description={error.message}
          actions={
            <ActionPanel>
              <Action title="Try Again" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView
          icon={Icon.SpeechBubble}
          title={searchText ? "No Matching Threads" : FILTER_EMPTY_TITLES[filter]}
          description={searchText ? "Try another search or filter." : "Threads you start in Delta appear here."}
          actions={
            <ActionPanel>
              <Action
                title="Create Thread"
                icon={Icon.Plus}
                onAction={() => launchCommand({ name: "create-thread", type: LaunchType.UserInitiated })}
              />
            </ActionPanel>
          }
        />
      )}
      {visibleThreads.map((thread) => (
        <ThreadListItem
          key={thread.id}
          thread={thread}
          isShowingDetail={isShowingDetail}
          actions={<ThreadActions thread={thread} threads={threadsState} detail={detail} />}
        />
      ))}
    </List>
  );
}

export default withDelta(SearchThreads, <List isLoading />);
