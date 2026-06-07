import { API_BASE_URL, CREDITS_EXHAUSTED_EVENT } from "./queryClient";
import { authFetch } from "./authFetch";
import { SubscriptionStatus } from "@/store/atoms";

// authFetch wrapper that mirrors apiRequest's error handling (incl. 402 → upgrade modal)
async function authRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await authFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    if (res.status === 402 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(CREDITS_EXHAUSTED_EVENT));
    }
    let errorMessage = res.statusText;
    try {
      const body = await res.json();
      errorMessage = body.error || body.message || errorMessage;
    } catch {
      /* keep statusText */
    }
    throw new Error(errorMessage || `${res.status}: Unknown Error`);
  }
  return res;
}

interface CheckoutPayload {
  cancel_url: string;
  duration: number;
  email: string;
  plan: string;
  success_url: string;
}

interface CheckoutResponse {
  session_id: string;
  url: string;
}

export async function createCheckoutSession(
  payload: CheckoutPayload,
): Promise<CheckoutResponse> {
  const res = await authRequest(
    "POST",
    `${API_BASE_URL}/subscription/checkout`,
    payload,
  );
  return res.json();
}

export async function getSubscriptionStatus(
  email: string,
): Promise<SubscriptionStatus> {
  const res = await authRequest(
    "GET",
    `${API_BASE_URL}/subscription/status?email=${encodeURIComponent(email)}`,
  );
  return res.json();
}

export interface PaymentMethodResponse {
  brand: string;
  exp_month: number;
  exp_year: number;
  has_payment_method: boolean;
  last4: string;
  type: string;
}

export async function getPaymentMethod(
  email: string,
): Promise<PaymentMethodResponse> {
  const res = await authRequest(
    "GET",
    `${API_BASE_URL}/subscription/method?email=${encodeURIComponent(email)}`,
  );
  return res.json();
}

interface PortalPayload {
  email: string;
  return_url: string;
}

interface PortalResponse {
  url: string;
}

export async function createPortalSession(
  payload: PortalPayload,
): Promise<PortalResponse> {
  const res = await authRequest(
    "POST",
    `${API_BASE_URL}/subscription/portal`,
    payload,
  );
  return res.json();
}

export interface Invoice {
  amount: number;
  currency: string;
  date: string;
  id: string;
  pdf_url: string;
  plan: string;
  status: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

export async function getInvoices(
  email: string,
  page: number = 1,
  limit: number = 10,
): Promise<InvoicesResponse> {
  const res = await authRequest(
    "GET",
    `${API_BASE_URL}/subscription/invoices?email=${encodeURIComponent(
      email,
    )}&page=${page}&limit=${limit}`,
  );
  return res.json();
}

interface UpgradePayload {
  duration: number;
  email: string;
  plan: string;
  prorate: boolean;
}

interface UpgradeResponse {
  duration: number;
  plan: string;
  price_id: string;
  status: string;
}

export async function buyCreditPack(payload: {
  email: string;
  success_url: string;
  cancel_url: string;
}): Promise<{ url: string }> {
  const res = await authRequest(
    "POST",
    `${API_BASE_URL}/subscription/credits`,
    payload,
  );
  return res.json();
}

export async function upgradeSubscription(
  payload: UpgradePayload,
): Promise<UpgradeResponse> {
  const res = await authRequest(
    "POST",
    `${API_BASE_URL}/subscription/upgrade`,
    payload,
  );
  return res.json();
}

export async function cancelSubscription(): Promise<{ ok: boolean; cancel_at_period_end: boolean }> {
  const res = await authRequest("POST", `${API_BASE_URL}/subscription/cancel`);
  return res.json();
}

export async function resubscribe(): Promise<{ ok: boolean }> {
  const res = await authRequest("POST", `${API_BASE_URL}/subscription/resubscribe`);
  return res.json();
}
