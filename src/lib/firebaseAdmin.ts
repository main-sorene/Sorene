import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { NextRequest } from "next/server";

let app: App | undefined;
let adminAuth: Auth | undefined;

function getAdminAuth(): Auth {
  if (adminAuth) return adminAuth;

  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      app = initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
      });
    } else {
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  }

  adminAuth = getAuth(app);
  return adminAuth;
}

export async function verifyAuth(
  req: NextRequest,
): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
