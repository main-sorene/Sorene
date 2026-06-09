import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function initAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    app = initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  } else {
    app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }
  return app;
}

export function getAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth;
  const a = initAdminApp();
  adminAuth = getAuth(a);
  return adminAuth ?? null;
}

export function getAdminFirestore(): Firestore {
  if (adminDb) return adminDb;
  const a = initAdminApp();
  adminDb = getFirestore(a);
  return adminDb;
}

export async function verifyAuth(
  req: NextRequest,
): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const auth = getAdminAuth();
    if (!auth) return null;
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
