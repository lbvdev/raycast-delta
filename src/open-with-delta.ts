import { closeMainWindow, getSelectedFinderItems, open, showToast, Toast } from "@raycast/api";
import { runAppleScript, showFailureToast } from "@raycast/utils";
import { DELTA_DOWNLOAD_URL, DeltaNotInstalledError, openInDelta } from "./lib/delta";

async function getFrontFinderFolder(): Promise<string | undefined> {
  const path = await runAppleScript(`
    try
      tell application "Finder" to return POSIX path of (insertion location as alias)
    on error
      return ""
    end try
  `);
  return path || undefined;
}

async function getFinderPaths(): Promise<string[]> {
  try {
    const items = await getSelectedFinderItems();
    if (items.length > 0) {
      return items.map((item) => item.path);
    }
  } catch {
    // Finder isn't frontmost or nothing is selected; fall back to the front Finder folder.
  }
  const folder = await getFrontFinderFolder();
  return folder ? [folder] : [];
}

export default async function OpenWithDelta() {
  try {
    const paths = await getFinderPaths();
    if (paths.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No Finder item selected",
        message: "Select a file or folder in Finder and try again.",
      });
      return;
    }
    await closeMainWindow();
    for (const path of paths) {
      await openInDelta(path);
    }
  } catch (e) {
    if (e instanceof DeltaNotInstalledError) {
      await showFailureToast(e, {
        title: "Delta is not installed",
        primaryAction: { title: "Download Delta", onAction: () => open(DELTA_DOWNLOAD_URL) },
      });
      return;
    }
    await showFailureToast(e, { title: "Couldn't open in Delta" });
  }
}
