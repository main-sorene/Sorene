import { auth } from "@/lib/firebase";

export async function authFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const user = auth?.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...init, headers });
}
