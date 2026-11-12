import { useCachedPromise } from "@raycast/utils";
import { listThreads } from "../lib/delta";

/** All local Delta threads, cached between launches and refreshed in the background. */
export function useThreads() {
  return useCachedPromise(listThreads, [], {
    failureToastOptions: { title: "Couldn't load Delta threads" },
  });
}

export type ThreadsState = ReturnType<typeof useThreads>;
