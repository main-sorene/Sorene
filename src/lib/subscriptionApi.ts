import { apiRequest, API_BASE_URL } from "./queryClient";
import { SubscriptionStatus } from "@/store/atoms";

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
  const res = await apiRequest(
    "POST",
    `${API_BASE_URL}/subscription/checkout`,
    payload,
  );
  return res.json();
}

export async function getSubscriptionStatus(
  email: string,
): Promise<SubscriptionStatus> {
  const res = await apiRequest(
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
  const res = await apiRequest(
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
  const res = await apiRequest(
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
  const res = await apiRequest(
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

export async function upgradeSubscription(
  payload: UpgradePayload,
): Promise<UpgradeResponse> {
  const res = await apiRequest(
    "POST",
    `${API_BASE_URL}/subscription/upgrade`,
    payload,
  );
  return res.json();
}
