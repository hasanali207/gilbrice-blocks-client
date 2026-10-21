"use client";

import { resetPassword } from "@/services/auth";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (!confirmPassword) {
      toast.error("Please confirm your password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        token,
        newPassword,
      });

      if (!response?.success) {
        toast.error(response?.message || "Unable to reset password.");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully.");
    } catch (error: any) {
      console.error("RESET PASSWORD ERROR:", error);

      toast.error(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // SUCCESS
  // ==========================================================

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Password Reset Successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your Gilbrice Logistics password has been successfully updated.
            </p>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // INVALID TOKEN
  // ==========================================================

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <LockKeyhole className="h-8 w-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Invalid Reset Link
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This password reset link is invalid or incomplete. Please request
              a new password reset link.
            </p>

            <Link
              href="/forgot-password"
              className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RESET PASSWORD FORM
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* BRAND */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Gilbrice Logistics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Secure Account Management
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Reset Your Password
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a new password for your Gilbrice Logistics account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NEW PASSWORD */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                New Password
              </label>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Password must be at least 6 characters.
              </p>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm Password
              </label>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          {/* SECURITY NOTE */}
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <p className="text-xs leading-5 text-slate-500">
                For your security, this reset link expires after 15 minutes and
                can only be used once.
              </p>
            </div>
          </div>

          {/* BACK */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
