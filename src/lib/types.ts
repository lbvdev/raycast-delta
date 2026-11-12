/** Shape of one entry in `delta thread list --json`. */
export interface Thread {
  id: string;
  name: string;
  archived: boolean;
  join_id: string | null;
  status: string | null;
  created_at_utc: string;
  index: number;
  generated_title: string | null;
  summary: string | null;
  keywords: string[];
  intents: string[];
}

/** Shape of one entry in `delta org list --json`. */
export interface Organization {
  id: string;
  name: string;
  current: boolean;
}

export type Visibility = "private" | "organization";
