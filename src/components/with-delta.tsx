import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { ComponentType, ReactElement } from "react";
import { DELTA_DOWNLOAD_URL, getDeltaApp } from "../lib/delta";

const NOT_INSTALLED_MARKDOWN = `## Delta Is Not Installed

This extension controls the Delta desktop app. Install Delta, then run this command again.`;

/**
 * Renders the command only when the Delta app is installed, otherwise explains how to get it.
 * `loadingView` should match the command's own root view so Raycast doesn't flash a different layout.
 */
export function withDelta<P extends object>(Component: ComponentType<P>, loadingView: ReactElement) {
  return function WithDelta(props: P) {
    const { data: app, isLoading } = usePromise(getDeltaApp);

    if (isLoading) {
      return loadingView;
    }

    if (!app) {
      return (
        <Detail
          markdown={NOT_INSTALLED_MARKDOWN}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Download Delta" icon={Icon.Download} url={DELTA_DOWNLOAD_URL} />
            </ActionPanel>
          }
        />
      );
    }

    return <Component {...props} />;
  };
}
