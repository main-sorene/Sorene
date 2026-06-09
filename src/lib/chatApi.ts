import type {
  AIModel,
  AuthUser,
  Message,
  Role,
  IdeationData,
} from "@/store/atoms";
import { API_BASE_URL, apiRequest } from "@/lib/queryClient";
import { authFetch } from "@/lib/authFetch";

export const chatKeys = {
  history: (userId: string, chatId: string) =>
    ["chat", "history", userId, chatId] as const,
};

export type ApiHistoryMessage = {
  content?: string;
  message?: string;
  nquestion?: number;
  segment?: string;
  timestamp?: string;
  user_id?: string;
  user_name?: string;
  done?: boolean;
};

export type ApiFlowObject = {
  chat_id: string;
  done: boolean;
  nquestion: number;
  segment: string;
  updated_at: string;
};

export type ApiChatResponse = {
  chat_id: string;
  count: number;
  flow?: ApiFlowObject;
  history: ApiHistoryMessage[];
  user_id: string | null;
};

export type ApiConvoItem = {
  chat_id: string;
  message: string;
  segment: string;
};

export type ApiConvoResponse = {
  chats: ApiConvoItem[];
};

export type ApiReplyPayload = {
  user_id: string;
  prompt: string;
  chat_id?: string;
  character?: string;
  client?: string;
  model?: string;
  name?: string;
  nquestion?: number;
  segment?: string;
  token?: number;
};

export type ApiProfilePayload = {
  chat_id: string;
  client?: string;
  model?: string;
  name?: string;
  prompt: string;
  token?: number;
  user_id?: string;
};

export type ApiIdeatePayload = {
  user_id: string;
  user_name: string;
  character: string;
  client: string;
  model: string;
};

export type ApiReplyResponse = {
  done: boolean;
  nquestion: number;
  reply: string;
  section?: {
    focus: string;
    intents: string[];
    key: string;
    signals: string[];
    title: string;
  };
  segment: string;
};

const MODEL_TO_API: Record<string, { client: string; model: string }> = {
  "sorene-1": { client: "claude", model: "CLAUDEH" },
  "sorene-1-mini": { client: "claude", model: "CLAUDEH" },
  "sorene-lite": { client: "claude", model: "CLAUDEH" },
};

export function getChatUserId(user: AuthUser | null): string {
  return user?.uid ?? "guest";
}

export function toApiModel(selectedModel?: AIModel): {
  client: string;
  model: string;
} {
  if (!selectedModel) {
    return { client: "claude", model: "CLAUDEH" };
  }
  return (
    MODEL_TO_API[selectedModel.id] ?? { client: "claude", model: "CLAUDEH" }
  );
}

function toDate(value?: string): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function mapHistoryToMessages(
  history: ApiHistoryMessage[] = [],
): Message[] {
  const messages: Message[] = [];

  history.forEach((item, index) => {
    const stamp = item.timestamp;

    // Use current role or derive from user_name
    const role: Role = item.user_name === "Sorene" ? "assistant" : "user";

    // Message field is high priority for the actual text content
    const messageContent = item.message ?? item.content;

    if (messageContent) {
      messages.push({
        id: `history-${role}-${index}-${item.timestamp}`,
        role,
        content: messageContent,
        timestamp: toDate(stamp),
        done: item.done,
      });
    }
  });

  return messages;
}

export async function getConvoHistory(
  userId: string,
): Promise<ApiConvoResponse> {
  const search = new URLSearchParams({ user_id: userId });
  try {
    const res = await fetch(`${API_BASE_URL}/history/convo?${search.toString()}`);
    if (!res.ok) {
      // External history API not yet wired up — return empty list silently
      return { conversations: [] } as unknown as ApiConvoResponse;
    }
    return (await res.json()) as ApiConvoResponse;
  } catch {
    return { conversations: [] } as unknown as ApiConvoResponse;
  }
}

export async function getChatHistory(params: {
  chatId: string;
}): Promise<ApiChatResponse> {
  const search = new URLSearchParams({ chat_id: params.chatId });
  const res = await fetch(`${API_BASE_URL}/history/chat?${search.toString()}`);

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return (await res.json()) as ApiChatResponse;
}

export async function sendReply(
  payload: ApiReplyPayload,
): Promise<ApiReplyResponse> {
  const res = await authFetch(`${API_BASE_URL}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return (await res.json()) as ApiReplyResponse;
}

export async function updateProfile(
  payload: ApiProfilePayload,
): Promise<{ ok: boolean; structured_advanced: any }> {
  const res = await apiRequest(
    "POST",
    `${API_BASE_URL}/profile/update`,
    payload,
  );
  return (await res.json()) as { ok: boolean; structured_advanced: any };
}

export async function addProfileInfo(
  payload: ApiProfilePayload,
): Promise<ApiReplyResponse> {
  const res = await apiRequest("POST", `${API_BASE_URL}/profile/add`, payload);
  return (await res.json()) as ApiReplyResponse;
}

export async function ideateSections(payload: ApiIdeatePayload): Promise<any> {
  const res = await apiRequest(
    "POST",
    `${API_BASE_URL}/ideate/sections`,
    payload,
  );
  return await res.json();
}

export async function ideate(payload: ApiIdeatePayload): Promise<IdeationData> {
  const res = await apiRequest("POST", `${API_BASE_URL}/ideate`, payload);
  return (await res.json()) as IdeationData;
}

export async function getIdeate(user_id: string): Promise<IdeationData> {
  const res = await apiRequest(
    "GET",
    `${API_BASE_URL}/ideate?user_id=${user_id}`,
  );
  return (await res.json()) as IdeationData;
}

export async function deleteHistory(params: {
  userId: string;
  chatId: string;
}): Promise<{ status: string; deleted: boolean; target: string }> {
  const res = await apiRequest("DELETE", `${API_BASE_URL}/history`, {
    target: "chat",
    user_id: params.userId,
    chat_id: params.chatId,
  });
  return (await res.json()) as {
    status: string;
    deleted: boolean;
    target: string;
  };
}

export type Recipe = {
  key: string;
  label: string;
};

export type RecipeListResponse = {
  recipes: Recipe[];
};

export type RecipePresetPayload = {
  user_id: string;
  client: string;
  model: string;
  token: number;
  recipe: string;
};

export type RecipePresetResponse = {
  label: string;
  recipe: string;
  response: string;
};

export async function getRecipeList(): Promise<RecipeListResponse> {
  const res = await fetch(`${API_BASE_URL}/recipe/list`);
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return (await res.json()) as RecipeListResponse;
}

export async function sendRecipePreset(
  payload: RecipePresetPayload,
): Promise<RecipePresetResponse> {
  const res = await apiRequest("POST", `${API_BASE_URL}/recipe/preset`, payload);
  return (await res.json()) as RecipePresetResponse;
}

export async function transcribeAudio(
  file: File,
): Promise<{ transcript: string }> {
  const formData = new FormData();
  formData.append("audio", file);

  const res = await fetch(`${API_BASE_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return (await res.json()) as { transcript: string };
}
