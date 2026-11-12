import {
  Action,
  ActionPanel,
  Alert,
  closeMainWindow,
  confirmAlert,
  Icon,
  Keyboard,
  showToast,
  Toast,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { ThreadsState } from "../hooks/use-threads";
import { openInDelta, setThreadArchived, shareThreadWithOrganization } from "../lib/delta";
import { getThreadDeeplink, getThreadTitle, getThreadWebUrl } from "../lib/threads";
import { Thread } from "../lib/types";

interface ThreadActionsProps {
  thread: Thread;
  /** From `useThreads()`, so actions update the list optimistically. */
  threads: Pick<ThreadsState, "mutate" | "revalidate">;
  /** Pass to show the Show/Hide Details action in lists that support a detail pane. */
  detail?: { isShowing: boolean; onToggle: () => void };
}

/** The standard action panel for a thread; reuse it in any view that lists threads. */
export function ThreadActions({ thread, threads, detail }: ThreadActionsProps) {
  const { mutate, revalidate } = threads;
  const webUrl = getThreadWebUrl(thread);
  const title = getThreadTitle(thread);

  async function open() {
    await closeMainWindow({ clearRootSearch: true });
    try {
      await openInDelta(getThreadDeeplink(thread));
    } catch (e) {
      await showFailureToast(e, { title: "Couldn't open thread in Delta" });
    }
  }

  async function toggleArchived() {
    const archived = !thread.archived;
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: archived ? "Archiving thread" : "Unarchiving thread",
    });
    try {
      await mutate(setThreadArchived(thread, archived), {
        optimisticUpdate: (current) => current?.map((t) => (t.id === thread.id ? { ...t, archived } : t)),
      });
      toast.style = Toast.Style.Success;
      toast.title = archived ? "Thread archived" : "Thread unarchived";
    } catch (e) {
      await showFailureToast(e, { title: archived ? "Couldn't archive thread" : "Couldn't unarchive thread" });
    }
  }

  async function share() {
    const confirmed = await confirmAlert({
      title: "Share with Organization?",
      message: `Everyone in your current Delta organization will be able to open “${title}” and its files.`,
      primaryAction: { title: "Share", style: Alert.ActionStyle.Default },
    });
    if (!confirmed) {
      return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "Sharing thread" });
    try {
      await mutate(shareThreadWithOrganization(thread));
      toast.style = Toast.Style.Success;
      toast.title = "Thread shared with organization";
    } catch (e) {
      await showFailureToast(e, { title: "Couldn't share thread" });
    }
  }

  return (
    <ActionPanel>
      <ActionPanel.Section>
        <Action title="Open in Delta" icon={Icon.AppWindow} onAction={open} />
        {webUrl && <Action.OpenInBrowser url={webUrl} shortcut={Keyboard.Shortcut.Common.Open} />}
        {detail && (
          <Action
            title={detail.isShowing ? "Hide Details" : "Show Details"}
            icon={Icon.Sidebar}
            shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
            onAction={detail.onToggle}
          />
        )}
      </ActionPanel.Section>
      <ActionPanel.Section>
        {webUrl && (
          <Action.CopyToClipboard title="Copy Thread Link" content={webUrl} shortcut={Keyboard.Shortcut.Common.Copy} />
        )}
        <Action.CopyToClipboard
          title="Copy Thread Title"
          content={title}
          shortcut={Keyboard.Shortcut.Common.CopyName}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Share with Organization"
          icon={Icon.TwoPeople}
          shortcut={{ modifiers: ["cmd", "shift"], key: "u" }}
          onAction={share}
        />
        <Action
          title={thread.archived ? "Unarchive Thread" : "Archive Thread"}
          icon={thread.archived ? Icon.Tray : Icon.Box}
          shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
          onAction={toggleArchived}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Refresh Threads"
          icon={Icon.ArrowClockwise}
          shortcut={Keyboard.Shortcut.Common.Refresh}
          onAction={revalidate}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
