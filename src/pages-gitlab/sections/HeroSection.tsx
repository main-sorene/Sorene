"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emailInputAtom, userAtom } from "@/store/atoms";
import { useAtom, useSetAtom } from "jotai";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/authApi";
import { Loader2 } from "lucide-react";
import { getFriendlyErrorMessage } from "@/lib/utils";

const trafficLights = [
  { bg: "bg-[#ff5e5d]", border: "border-[#e14942]" },
  { bg: "bg-[#ffbc4f]", border: "border-[#e1a325]" },
  { bg: "bg-[#22cb58]", border: "border-[#3eaf3f]" },
];

export const HeroSection = () => {
  const [emailInput, setEmailInput] = useAtom(emailInputAtom);
  const setUser = useSetAtom(userAtom);
  const [error, setError] = React.useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const { mutate: sendOTP, isPending: isSendingOTP } = useMutation({
    mutationFn: authApi.sendOTP,
    onSuccess: () => {
      setError(null);
      router.push("/verify-email");
    },
    onError: (error: Error) => {
      setError(getFriendlyErrorMessage(error));
    },
  });

  const handleContinueWithEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(emailInput)) {
      setError("Please enter a valid email");
      return;
    }
    sendOTP(emailInput);
  };

  const handleGoogleSignup = async () => {
    if (!auth || !provider) {
      console.error("Firebase auth not initialized");
      return;
    }

    try {
      setIsGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userUid = user.email || user.uid;
      // Save/update profile with basic Google info
      if (user.photoURL || user.email) {
        await saveUserProfile(userUid, {
          photoUrl: user.photoURL || undefined,
          email: user.email || "",
        });
      }

      // Check Firestore for user profile
      const profile = await getUserProfile(userUid);

      setUser({
        uid: userUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        profile: profile || undefined,
      });

      if (profile && profile.onboardingComplete) {
        router.push("/chat");
      } else {
        router.push("/onBoarding");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <section className="pt-8 pb-8 px-0 flex flex-col items-center gap-10 lg:gap-20 relative self-stretch w-full overflow-hidden h-screen">
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <div className="absolute inset-0 overflow-hidden pointer-events-none ">
          <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[rgba(254,221,144,0.5)] rounded-full blur-[120px]" />
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-[rgba(254,221,144,0.5)] rounded-full blur-[120px]" />
          <div className="absolute -bottom-1 -left-40 w-[400px] h-[400px] bg-[#d4f6f9] rounded-full blur-[120px]" />
          <div className="absolute -bottom-1 -right-40 w-[400px] h-[400px] bg-[#d4f6f9] rounded-full blur-[120px]" />
        </div>

        <div className="max-w-[1440px] flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 px-5 sm:px-10 lg:px-20 py-0 w-full relative z-10">
          {/* Left Column: Headline + Sign-up Card */}
          <div className="flex flex-col w-full lg:max-w-[600px] items-center gap-8 lg:gap-10 flex-1">
            {/* Headline */}
            <div className="flex flex-col items-start gap-4 lg:gap-6 self-stretch w-full">
              <h1 className="self-stretch font-normal text-[#101010] text-4xl sm:text-5xl lg:text-[64px] text-center leading-tight lg:leading-[64px]">
                <span className="font-medium tracking-[-0.32px]">
                  Know yourself.
                  <br />
                </span>
                <span className="text-display-medium font-normal tracking-[-0.64px]">
                  {" "}
                  Build what fits.
                </span>
              </h1>
              <p className="self-stretch text-body-large text-[#878787] sm:text-lg text-center tracking-[0] leading-[1.6]">
                Turn self-understanding into clear strategic direction.
              </p>
            </div>

            {/* Sign-up Card + Privacy */}
            <div className="flex flex-col items-center gap-4 self-stretch w-full">
              <div className="flex w-full max-w-[550px] items-center justify-center gap-10 p-5 sm:p-6 bg-white rounded-3xl border border-solid border-[#FDC24C] shadow-yellow-shadow">
                <div className="flex flex-col items-start gap-5 sm:gap-6 w-full">
                  {/* Google */}
                  <div className="flex justify-center gap-2 p-0.5 self-stretch w-full bg-white rounded-[8px] border-[0.5px] border-[#EDEDED] shadow-shadow items-center">
                    <button className="flex items-center justify-center gap-2 px-4 sm:px-[18px] py-3 sm:py-3.5 flex-1 bg-white rounded-lg border-none cursor-pointer hover:bg-gray-50 transition-colors">
                      <img
                        className="w-6 h-6"
                        alt="Google"
                        src="/figmaAssets/logo-6.svg"
                      />
                      <span
                        className="text-body-medium-medium text-[#101010] text-sm sm:text-base text-center tracking-[0] leading-6"
                        onClick={handleGoogleSignup}
                      >
                        {isGoogleLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing in...
                          </div>
                        ) : (
                          "Continue with Google"
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="self-stretch font-normal text-[#101010] text-base text-center tracking-[0] leading-6">
                    OR
                  </div>

                  {/* Email + Submit */}
                  <div className="flex flex-col items-start gap-4 self-stretch w-full">
                    <div className="flex items-center gap-2 p-3 sm:p-4 self-stretch w-full bg-[#f7f7f7] rounded-[10px] border border-solid border-[#ededed] shadow-shadow-xs">
                      <Input
                        className="flex-1 border-none bg-transparent shadow-none p-0 h-auto font-normal text-[#878787] text-sm sm:text-base tracking-[0] leading-6 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#878787]"
                        placeholder="Enter your email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (error) setError(null);
                        }}
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-xs mt-[-10px] w-full px-1">
                        {error}
                      </p>
                    )}
                    <button
                      onClick={handleContinueWithEmail}
                      disabled={isSendingOTP}
                      className="flex justify-center gap-2 p-0.5 self-stretch w-full rounded-[10px] border border-solid border-[#FDAA22] shadow-shadow [background:radial-gradient(263.36%_77.05%_at_11.85%_23.83%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),#FDC24C] items-center cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center gap-2 px-[18px] py-3 sm:py-3.5 flex-1 rounded-lg">
                        {isSendingOTP ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <span className="text-white text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                            Continue with email
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <p className="self-stretch font-normal text-[#878787] text-xs text-center tracking-[0] leading-normal">
                By continuing, you acknowledge Sorene&apos;s{" "}
                <Link
                  href="/privacy-policy"
                  className="hover:underline hover:text-[#555]"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Right Column: Browser Mockup — hidden on mobile, shown on lg+ */}
          <div className="hidden lg:flex flex-col w-full max-w-[773px] xl:w-[773.72px] items-start rounded-[4.78px] overflow-hidden border-[0.86px] border-solid border-[#ededed] shadow-[5.17px_5.17px_27.57px_#0000000f]">
            {/* Browser Chrome Bar */}
            <div className="relative w-full h-[19.13px] bg-white border-b-[0.4px] border-b-[#00000012] shrink-0">
              <img
                className="absolute top-[5px] right-[35px] w-2.5 h-2.5"
                alt="Icon"
                src="/figmaAssets/icon-1.svg"
              />
              <img
                className="absolute top-[5px] right-[22px] w-2.5 h-2.5"
                alt="Icon"
                src="/figmaAssets/icon.svg"
              />
              <img
                className="absolute top-[5px] right-2.5 w-2.5 h-2.5"
                alt="Icon"
                src="/figmaAssets/icon-2.svg"
              />
              <div className="inline-flex items-start gap-[3.19px] absolute top-[37.50%] left-[7px]">
                {trafficLights.map((dot, i) => (
                  <div
                    key={i}
                    className={`${dot.bg} border-[0.2px] border-solid ${dot.border} w-[4.78px] h-[4.78px] rounded-[2.39px]`}
                  />
                ))}
              </div>
              <div className="flex w-[22px] items-start gap-[3.19px] absolute top-[5px] left-[62px]">
                <img
                  className="w-[9.56px] h-[9.56px]"
                  alt="Arrow left"
                  src="/figmaAssets/arrow-left.svg"
                />
                <img
                  className="w-[9.56px] h-[9.56px]"
                  alt="Arrow right"
                  src="/figmaAssets/arrow-right.svg"
                />
              </div>
              <img
                className="absolute top-[5px] left-11 w-2.5 h-2.5"
                alt="Icon"
                src="/figmaAssets/icon-4.svg"
              />
              <div className="inline-flex items-center gap-[2.79px] absolute top-1 left-[calc(50.00%-129px)]">
                <img
                  className="w-[9.56px] h-[9.56px]"
                  alt="Icon"
                  src="/figmaAssets/icon-3.svg"
                />
                <div className="relative w-[232.31px] h-[11.16px] bg-[#f2f2f2] rounded-[1.99px]">
                  <img
                    className="absolute w-[4.12%] h-[85.71%] top-[7.14%] left-[95.71%]"
                    alt="Refresh"
                    src="/figmaAssets/refresh.svg"
                  />
                  <div className="flex w-[16.98%] items-center justify-center gap-[0.4px] absolute h-[85.71%] top-[7.14%] left-[41.51%]">
                    <div className="relative w-[9.56px] h-[9.56px]">
                      <div className="relative top-[3px] left-[3px] w-[3px] h-1 bg-[url(/figmaAssets/union.svg)] bg-position-[100%_100%]" />
                    </div>
                    <span className="font-['Inter_Tight',Helvetica] font-medium text-[#4c4c4c] text-[6px] whitespace-nowrap">
                      Sorene.ai
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <img
              className="w-full object-cover"
              alt="Website builder"
              src="/figmaAssets/website-builder---website--edit-page----desktop-1.png"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
