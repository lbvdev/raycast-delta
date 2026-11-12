# Delta for Raycast

Search, create and open your [Delta](https://delta.dev) threads, and ask questions about your past work with coding agents. Delta is the agent-first coding app from Zed Industries.

## Requirements

- macOS with the Delta desktop app installed and signed in to your account. If you aren't signed in, the extension tells you and offers to open Delta.
- Nothing else to set up: the extension uses the `delta` CLI bundled inside the app, so you don't install a CLI, add anything to your `PATH` or enter a token.
- Asking questions uses a model through your Delta account, so it needs model access in Delta.

## Commands

### Search Threads

Find threads by title, summary or keyword, with a detail pane showing each thread's summary and goals. Filter by Active, Archived or All.

| Action                                | Shortcut |
| ------------------------------------- | -------- |
| Open in Delta                         | `↵`      |
| Open in Browser (delta.dev)           | `⌘O`     |
| Ask About Thread                      | `⌘⇧I`    |
| Show or Hide Details                  | `⌘⇧D`    |
| Copy Thread Link                      | `⌘⇧C`    |
| Copy Thread Title                     | `⌘⇧.`    |
| Share (Invite People, General Access) | `⌘⇧U`    |
| Invite People                         | `⌘⇧E`    |
| Fork Thread                           | `⌘⇧F`    |
| Archive or Unarchive Thread           | `⌘⇧A`    |
| Delete Thread                         | `⌃X`     |
| Create Thread                         | `⌘N`     |
| Refresh Threads                       | `⌘R`     |
| Change Answer Model                   | `⌘⇧M`    |

When a newer Delta is out, a row at the top of the list offers to install it.

### Asking Questions

There are two ways to ask, both answered by a model that reads your threads:

- **Across all threads**: type a question in Search Threads and pick **Ask Delta** at the bottom of the list. Delta reads the threads that mention the question's specific words (the row shows which), so name the project, feature, error or file you mean: "What did we decide about the GitLab push?" works, "What did we decide?" doesn't. Questions in English and Russian both work, and word endings don't have to match the threads exactly.
- **About one thread**: press `⌘⇧I` on a thread and pick a quick question (Summarize this thread, What was decided?, What's left to do?, Which files changed and why?) or type your own.

Answers list the threads they came from; `⌘O` opens them in Delta. Answers aren't saved: each one is a model call, so **Ask Again** (`⌘R`) is always your choice.

### Create Thread

Start a thread with a draft prompt in the organization you choose, shared only with people you invite or with everyone there. Delta opens it so you can review the prompt and send it. Nothing runs until you do.

### Open with Delta

Open the selected Finder items, or the front Finder folder, in Delta.

### Ask Past Threads

Ask across all threads straight from Raycast's root search. It works best as a [fallback command](https://manual.raycast.com/fallback-commands): type a question in Raycast, then pick **Ask Past Threads** without retyping it.

## Answer Model

The first time you ask a question, the extension asks which model should answer: Delta's default, or one of the models used in your 10 most recent threads, so the list matches the providers you've connected in Delta. You can also type any model as `provider/model-id`, for example `anthropic/claude-opus-5-5`.

Change it any time with `⌘⇧M`, or from the dropdown next to the search bar in **Ask About Thread**. The list of models is refreshed when you start a new thread and once a day; **Rescan Threads** (`⌘R`) in the model list refreshes it now.

## Raycast AI

Mention `@delta` in AI Chat or Quick AI to work with your threads in plain language:

- "@delta what did we decide about the PantryPal push to GitLab?"
- "@delta summarize what I worked on this week"
- "@delta какие треды были про SSH ключи?"
- "@delta create a thread to add dark mode to the settings screen"
- "@delta archive the Capy Stack thread"

Raycast AI can find threads, read their transcripts, create a draft thread and archive or unarchive a thread. It asks you to confirm before creating or archiving anything, and it never sends a prompt to an agent: drafts wait in Delta for you.

## Troubleshooting

- **"Sign in to Delta"**: open Delta and sign in, then run the command again.
- **"No thread mentions…"**: the question's words don't appear in any thread. Use the words the threads themselves use, or ask about one thread with `⌘⇧I`.
- **"Delta can't load this thread's history"**: some imported and recorded threads can't be read by Delta's CLI. They still open in Delta.
- **An answer fails after you picked a model**: the model may not be available on your Delta plan. Press `⌘⇧M` and switch back to Delta's default.
