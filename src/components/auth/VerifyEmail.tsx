"use client";

import React from "react";
import { useAtomValue } from "jotai";
import { emailInputAtom, userAtom } from "@/store/atoms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/authApi";
import { getUserProfile } from "@/lib/firestore";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

const VerifyEmail = () => {
  const email = useAtomValue(emailInputAtom);
  const setUser = useSetAtom(userAtom);
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const { mutate: verifyOTP, isPending: isVerifying } = useMutation({
    mutationFn: (otp: string) => authApi.verifyOTP(email, otp),
    onSuccess: async (data) => {
      if (data.success) {
        if (data.token && auth) {
          try {
            await signInWithCustomToken(auth, data.token);
          } catch (e) {
            console.error("Firebase custom token signin failed", e);
          }
        }
        // Correct OTP - Initialize session
        const uid = email!;
        const profile = await getUserProfile(uid);

        setUser({
          uid,
          email,
          displayName: null,
          photoURL: null,
          profile: profile || undefined,
        });

        if (profile?.onboardingComplete) {
          router.push("/chat");
        } else {
          router.push("/onBoarding");
        }
      } else {
        setError("Invalid verification code. Please try again.");
      }
    },
    onError: (err: Error) => {
      setError(getFriendlyErrorMessage(err));
    },
  });

  const { mutate: resendOTP, isPending: isResending } = useMutation({
    mutationFn: () => authApi.sendOTP(email),
    onSuccess: () => {
      setError(null);
      // Optional: Show a "Code resent" toast or message
    },
    onError: (err: Error) => {
      setError(getFriendlyErrorMessage(err));
    },
  });

  const handleVerify = () => {
    if (!code.trim()) return;
    setError(null);
    verifyOTP(code);
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex items-center justify-center p-4">
      {/* Main Content */}
      <div className="flex flex-col items-center gap-6 w-full max-w-md text-center">
        {/* Logo */}
        <img
          className="block h-24 w-24 object-cover"
          alt="Sorene logo"
          src="/figmaAssets/logo.png"
        />

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-base font-medium text-[#101010]">
            Verify your email
          </h1>
          <p className="text-[#878787] text-sm">
            Enter the code we&apos;ve sent to{" "}
            <span className="text-[#4c4c4c] font-medium">
              {email || "mail@email.com"}
            </span>
          </p>
        </div>

        {/* Form */}
        <div className="w-full space-y-3">
          <Input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            className="w-full text-sm h-11 border-[#ededed] bg-white text-[#101010] shadow-shadow-xs focus-visible:ring-1 focus-visible:ring-[#fdaa22] focus-visible:border-[#fdaa22]"
          />

          {error && (
            <p className="text-red-500 text-xs text-left px-1">{error}</p>
          )}

          <Button
            onClick={handleVerify}
            disabled={!code.trim() || isVerifying}
            className="w-full h-11 bg-[#101010] hover:bg-[#101010]/90 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Verify Code"
            )}
          </Button>

          <div className="text-xs text-[#878787]">
            Didn&apos;t get the code?{" "}
            <button
              type="button"
              disabled={isResending}
              onClick={() => resendOTP()}
              className="text-[#101010] font-medium hover:underline disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Resend it"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-8 w-full text-center text-[#878787] text-xs px-6">
        By using Sorene, you agree to our Terms and have read our Privacy Policy
      </div>
    </div>
  );
};

export default VerifyEmail;
