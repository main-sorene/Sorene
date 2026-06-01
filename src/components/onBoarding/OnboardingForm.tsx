import * as React from "react";

import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormData } from "@/types/onboarding";
import { useAtom, useSetAtom } from "jotai";
import { userAtom, cvTextAtom } from "@/store/atoms";
import { saveUserProfile } from "@/lib/firestore";
import { useNavigate } from "react-router-dom";
import { OnboardingSideImage } from "./OnboardingSideImage";
import { authApi } from "@/lib/authApi";
import * as chatApi from "@/lib/chatApi";

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_tell", label: "Prefer not to tell" },
];

const OCCUPATION_OPTIONS = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "product_manager", label: "Product Manager" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

export function OnboardingForm({
  onNext,
}: {
  onNext: (data: FormData) => void;
}) {
  const [authUser, setAuthUser] = useAtom(userAtom);
  const setCvText = useSetAtom(cvTextAtom);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [sexOpen, setSexOpen] = React.useState(false);
  const [occupationOpen, setOccupationOpen] = React.useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      portfolioFile: null,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!authUser) {
      console.error("No authenticated user found during onboarding submission");
      return;
    }

    try {
      setIsSubmitting(true);
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: authUser.uid || "",
        birthday: data.birthday,
        occupation: data.occupation,
        sex: data.sex,
        useCase: "general",
        onboardingComplete: true,
        cvData: undefined as any,
        photoUrl: authUser.photoURL || authUser.profile?.photoUrl || undefined,
      };

      let cvExtractedText = "";

      // Handle CV Upload if file exists
      if (data.portfolioFile && data.portfolioFile.length > 0) {
        try {
          const cvResponse = await authApi.uploadCV({
            file: data.portfolioFile[0],
            user_id: authUser.uid,
            name: `${data.firstName} ${data.lastName}`,
            character: "sorene",
          });

          if (cvResponse.text) {
            cvExtractedText = cvResponse.text;
            setCvText(cvResponse.text);
            profileData.cvData = {
              file_name: cvResponse.file_name,
              file_path: cvResponse.file_path,
              status: cvResponse.status,
              text_length: cvResponse.text_length,
            };
          }
        } catch (cvError) {
          console.error("Error uploading CV:", cvError);
        }
      }

      await saveUserProfile(authUser.uid, profileData);

      // Update local state
      setAuthUser({
        ...authUser,
        profile: {
          ...profileData,
          email: authUser.email || "",
          createdAt: authUser.profile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      // Call backend API
      try {
        const [month, day, year] = data.birthday.split("/").map(Number);
        const today = new Date();
        const birthDate = new Date(year, month - 1, day);
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
          calculatedAge--;

        await authApi.updateProfileBio({
          age: calculatedAge,
          birthday: data.birthday,
          email: authUser.uid || "",
          name: `${data.firstName} ${data.lastName}`,
          occupation: data.occupation,
          sex: data.sex,
          user_id: authUser.uid,
        });
      } catch (backendError) {
        console.error("Error updating profile bio in backend:", backendError);
      }

      onNext(data);

      navigate("/chat");
    } catch (error) {
      console.error("Error saving user profile:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row">
      {/* LEFT - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-2xl">
          <div className="font-satoshi text-xl lg:text-3xl  text-[#151515] mb-2">
            Help Sorene see the full picture of you.
          </div>

          <p className="text-sm max-w-lg text-[#62646A] mb-4">
            The more we understand your stage of life, your work, and your
            background, the more tailored and useful your ideas will feel. Think
            of this as setting the foundation, not filling out a form.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="text-sm font-medium text-[#151515] ">
                First name
              </label>
              <Input
                className="mt-2"
                placeholder="Enter your first name"
                {...register("firstName", {
                  required: "First name is required",
                })}
              />
              {errors.firstName && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm font-medium text-[#151515]">
                Last name
              </label>
              <Input
                className="mt-2"
                placeholder="Enter your last name"
                {...register("lastName", { required: "Last name is required" })}
              />
              {errors.lastName && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Birthday */}
            <div>
              <label className="text-sm font-medium text-[#151515]">
                Birthday
              </label>
              <Controller
                control={control}
                name="birthday"
                rules={{ required: "Birthday is required" }}
                render={({ field }) => {
                  const dateInputRef = React.useRef<HTMLInputElement>(null);
                  const inputValue = field.value
                    ? (() => {
                        const [m, d, y] = field.value.split("/");
                        return y && m && d ? `${y}-${m}-${d}` : "";
                      })()
                    : "";

                  return (
                    <div
                      className="relative mt-2 cursor-pointer"
                      onClick={() => dateInputRef.current?.showPicker?.()}
                    >
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={inputValue}
                        onChange={(e) => {
                          const [y, m, d] = e.target.value.split("-");
                          field.onChange(y && m && d ? `${m}/${d}/${y}` : "");
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:border-black appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  );
                }}
              />
              {errors.birthday && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.birthday.message}
                </p>
              )}
            </div>

            {/* Gender Dropdown */}
            <div>
              <label className="text-sm font-medium text-[#151515]">
                Gender
              </label>
              <Controller
                control={control}
                name="sex"
                rules={{ required: "Gender is required" }}
                render={({ field }) => {
                  const selected = SEX_OPTIONS.find(
                    (o) => o.value === field.value,
                  );
                  return (
                    <DropdownMenu open={sexOpen} onOpenChange={setSexOpen}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between text-sm focus:outline-none"
                        >
                          <span
                            className={
                              selected ? "text-[#151515]" : "text-[#8A8D93]"
                            }
                          >
                            {selected ? selected.label : "Select an option..."}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#8A8D93] transition-transform duration-200 ${sexOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) rounded-xl shadow-lg border border-gray-100 p-1"
                        align="start"
                      >
                        {SEX_OPTIONS.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            className="cursor-pointer rounded-md px-3 py-2 text-xs text-[#151515] font-medium hover:bg-gray-50 focus:bg-gray-50"
                            onSelect={() => field.onChange(option.value)}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }}
              />
              {errors.sex && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.sex.message}
                </p>
              )}
            </div>

            {/* Occupation Dropdown */}
            <div>
              <label className="text-sm font-medium text-[#151515]">
                Occupation
              </label>
              <Controller
                control={control}
                name="occupation"
                rules={{ required: "Occupation is required" }}
                render={({ field }) => {
                  const selected = OCCUPATION_OPTIONS.find(
                    (o) => o.value === field.value,
                  );
                  return (
                    <DropdownMenu
                      open={occupationOpen}
                      onOpenChange={setOccupationOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full mt-2 border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between text-sm focus:outline-none"
                        >
                          <span
                            className={
                              selected ? "text-[#151515]" : "text-[#8A8D93]"
                            }
                          >
                            {selected ? selected.label : "Select an option..."}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#8A8D93] transition-transform duration-200 ${occupationOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) rounded-xl shadow-lg border border-gray-100 p-1"
                        align="start"
                      >
                        {OCCUPATION_OPTIONS.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            className="cursor-pointer rounded-md px-3 py-2 text-xs text-[#151515] font-medium hover:bg-gray-50 focus:bg-gray-50"
                            onSelect={() => field.onChange(option.value)}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }}
              />
              {errors.occupation && (
                <p className="mt-2 text-xs text-red-500">
                  {errors.occupation.message}
                </p>
              )}
            </div>

            {/* Portfolio File Upload */}
            <div>
              <label className="text-sm font-medium text-[#151515]">
                CV / Portfolio
              </label>

              <Controller
                control={control}
                name="portfolioFile"
                rules={{
                  validate: (files) => {
                    if (!files || files.length === 0) return true;
                    const file = files[0];
                    const allowedTypes = [
                      "image/jpeg",
                      "image/png",
                      "application/pdf",
                      "video/mp4",
                    ];
                    if (!allowedTypes.includes(file.type))
                      return "Invalid file type";
                    if (file.size > 50 * 1024 * 1024)
                      return "File must be less than 50MB";
                    return true;
                  },
                }}
                render={({ field }) => {
                  const inputRef = React.useRef<HTMLInputElement | null>(null);

                  const handleDrop = (e: React.DragEvent) => {
                    e.preventDefault();
                    if (
                      e.dataTransfer.files &&
                      e.dataTransfer.files.length > 0
                    ) {
                      field.onChange(e.dataTransfer.files);
                    }
                  };

                  return (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-gray-400 transition cursor-pointer"
                      onClick={() => inputRef.current?.click()}
                    >
                      {/* Hidden Input */}
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".jpeg,.jpg,.png,.pdf,.mp4"
                        onChange={(e) => field.onChange(e.target.files)}
                        className="hidden"
                      />

                      {/* Icon */}
                      <div className="mb-3 text-gray-400">
                        <img src="/figmaAssets/Files.svg" alt="Files" />
                      </div>

                      {/* Text */}
                      <p className="text-sm font-medium text-gray-700">
                        Drag and drop your files
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPEG, PNG, PDF, and MP4 formats, up to 50MB
                      </p>

                      {/* Button */}
                      <button
                        type="button"
                        className="mt-4 px-4 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
                      >
                        Select file
                      </button>

                      {/* Selected file name */}
                      {field.value && field.value.length > 0 && (
                        <p className="text-xs text-gray-600 mt-3">
                          Selected: {field.value[0].name}
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              {errors.portfolioFile && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.portfolioFile.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black/80 hover:bg-black text-white font-semibold py-2 rounded-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* RIGHT - IMAGE */}
      <OnboardingSideImage />
    </div>
  );
}
