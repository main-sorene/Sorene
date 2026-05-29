"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  gender?: string;
  cv?: string;
}

function isValidBirthday(value: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(value)) return false;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date <= new Date()
  );
}

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!birthday.trim()) {
      errs.birthday = "Birthday is required.";
    } else if (!isValidBirthday(birthday)) {
      errs.birthday = "Please enter a valid date in DD/MM/YYYY format.";
    }
    if (!gender) errs.gender = "Please select a gender.";
    if (cvFile && !cvFile.name.toLowerCase().endsWith(".pdf")) {
      errs.cv = "Only PDF files are accepted.";
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!user) return;
    setSubmitting(true);

    const profileKey = `sorene_profile_${user.uid}`;
    const onboardingKey = `sorene_onboarding_complete_${user.uid}`;

    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday,
      gender,
      cvFileName: cvFile ? cvFile.name : null,
    };

    localStorage.setItem(profileKey, JSON.stringify(profile));
    localStorage.setItem(onboardingKey, "true");

    router.replace("/dashboard");
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* Progress indicator */}
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-8">
          Step 1 of 2 — Your Profile
        </p>

        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Tell us about yourself
        </h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          This helps Sorene build a direction that fits who you actually are.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors((p) => ({ ...p, firstName: undefined }));
              }}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors((p) => ({ ...p, lastName: undefined }));
              }}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName}</p>
            )}
          </div>

          {/* Birthday */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="text"
              placeholder="DD/MM/YYYY"
              value={birthday}
              onChange={(e) => {
                setBirthday(e.target.value);
                if (errors.birthday) setErrors((p) => ({ ...p, birthday: undefined }));
              }}
              aria-invalid={!!errors.birthday}
            />
            {errors.birthday && (
              <p className="text-xs text-red-500">{errors.birthday}</p>
            )}
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={gender}
              onValueChange={(val) => {
                setGender(val);
                if (errors.gender) setErrors((p) => ({ ...p, gender: undefined }));
              }}
            >
              <SelectTrigger id="gender" aria-invalid={!!errors.gender}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-red-500">{errors.gender}</p>
            )}
          </div>

          {/* CV Upload */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cv">Upload your CV (PDF, optional)</Label>
            <div
              className="flex items-center gap-3 border border-slate-300 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-slate-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-sm text-slate-500 truncate">
                {cvFile ? cvFile.name : "Choose file..."}
              </span>
              <input
                ref={fileInputRef}
                id="cv"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setCvFile(file);
                  if (errors.cv) setErrors((p) => ({ ...p, cv: undefined }));
                }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Helps Sorene understand your background. PDF files only.
            </p>
            {errors.cv && (
              <p className="text-xs text-red-500">{errors.cv}</p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={submitting}
            >
              Continue to Assessment →
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
