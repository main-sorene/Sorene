"use client";

import { useEffect, useRef, useCallback } from "react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSetAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useRouter } from "next/navigation";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface Props {
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
}

export function GoogleOneTapButton({ onLoadingChange, onError }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!auth) return;
      onLoadingChange?.(true);
      try {
        const credential = GoogleAuthProvider.credential(response.credential);
        const result = await signInWithCredential(auth, credential);
        const user = result.user;
        const userUid = user.email || user.uid;

        if (user.email) {
          await saveUserProfile(userUid, {
            email: user.email,
            photoUrl: user.photoURL || undefined,
          });
        }

        const profile = await getUserProfile(userUid);
        setUser({
          uid: userUid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          profile: profile || undefined,
        });
        router.push(profile?.onboardingComplete ? "/chat" : "/onBoarding");
      } catch (e: any) {
        console.error("Google sign-in error:", e);
        onError?.(e.message || "Sign-in failed");
      } finally {
        onLoadingChange?.(false);
      }
    },
    [auth, setUser, router, onLoadingChange, onError],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const google = (window as any).google;
      if (!google) return;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: buttonRef.current!.offsetWidth,
      });
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return <div ref={buttonRef} className="w-full" />;
}
