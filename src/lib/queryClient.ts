import {
  QueryClient,
  QueryFunction,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const data = await res.json();
      errorMessage = data.error || data.message || JSON.stringify(data);
    } catch {
      try {
        const text = await res.text();
        if (text) errorMessage = text;
      } catch {
        /* fallback to statusText */
      }
    }
    throw new Error(errorMessage || `${res.status}: Unknown Error`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Silent — individual queries can opt in to their own error handling
      if (process.env.NODE_ENV !== "production") {
        console.error("[Query error]", error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Mutation error]", error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
