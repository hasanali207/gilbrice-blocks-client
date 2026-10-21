"use client";

import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { forgotPassword } from "@/services/auth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter your email address.");

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await forgotPassword({
        email: trimmedEmail,
      });

      if (!response?.success) {
        toast.error(response?.message || "Unable to send reset email.");

        return;
      }

      setIsSuccess(true);

      toast.success("Password reset link has been sent.");
    } catch (error: any) {
      console.error("FORGOT PASSWORD ERROR:", error);

      toast.error(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // SUCCESS UI
  // ==========================================================

  if (isSuccess) {
    return (
      <div
        className="
          min-h-[calc(100vh-80px)]
          flex
          items-center
          justify-center
          px-4
          py-10
          bg-gray-50
          dark:bg-zinc-950
        "
      >
        <div
          className="
            w-full
            max-w-md
            bg-white
            dark:bg-zinc-900
            border
            border-gray-200
            dark:border-zinc-700
            rounded-2xl
            shadow-sm
            p-8
            text-center
          "
        >
          {/* SUCCESS ICON */}

          <div
            className="
              mx-auto
              mb-5
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-green-100
              dark:bg-green-950
            "
          >
            <Mail
              size={30}
              className="
                text-green-600
                dark:text-green-400
              "
            />
          </div>

          {/* TITLE */}

          <h1
            className="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            Check Your Email
          </h1>

          {/* MESSAGE */}

          <p
            className="
              mt-3
              text-sm
              leading-6
              text-gray-500
              dark:text-gray-400
            "
          >
            If an account exists with
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {" "}
              {email}
            </span>
            , we have sent a password reset link to that email address.
          </p>

          {/* EXPIRATION */}

          <div
            className="
              mt-6
              rounded-lg
              bg-blue-50
              dark:bg-blue-950/30
              border
              border-blue-100
              dark:border-blue-900
              p-4
              text-left
            "
          >
            <p
              className="
                text-xs
                leading-5
                text-blue-700
                dark:text-blue-300
              "
            >
              The password reset link will expire in 15 minutes.
            </p>
          </div>

          {/* BACK LOGIN */}

          <Link
            href="/login"
            className="
              mt-6
              inline-flex
              items-center
              justify-center
              gap-2
              text-sm
              font-semibold
              text-blue-600
              hover:text-blue-800
              transition
            "
          >
            <ArrowLeft size={17} />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // FORM UI
  // ==========================================================

  return (
    <div
      className="
        min-h-[calc(100vh-80px)]
        flex
        items-center
        justify-center
        px-4
        py-10
        bg-gray-50
        dark:bg-zinc-950
      "
    >
      <div
        className="
          w-full
          max-w-md
        "
      >
        {/* ==================================================
            BRAND
        =================================================== */}

        <div className="text-center mb-6">
          <h1
            className="
              text-3xl
              font-bold
              text-blue-800
              dark:text-blue-500
            "
          >
            Gilbrice Logistics
          </h1>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Secure account recovery
          </p>
        </div>

        {/* ==================================================
            CARD
        =================================================== */}

        <div
          className="
            bg-white
            dark:bg-zinc-900
            border
            border-gray-200
            dark:border-zinc-700
            rounded-2xl
            shadow-sm
            p-6
            sm:p-7
          "
        >
          {/* ICON */}

          <div
            className="
              mx-auto
              mb-5
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-blue-50
              dark:bg-blue-950/40
            "
          >
            <ShieldCheck
              size={28}
              className="
                text-blue-600
                dark:text-blue-400
              "
            />
          </div>

          {/* TITLE */}

          <h2
            className="
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
              text-center
            "
          >
            Forgot Password?
          </h2>

          {/* DESCRIPTION */}

          <p
            className="
              mt-2
              text-sm
              text-gray-500
              dark:text-gray-400
              text-center
              leading-6
            "
          >
            Enter the email address associated with your account and we'll send
            you a link to reset your password.
          </p>

          {/* FORM */}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-300
                  mb-2
                "
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="
                    w-full
                    pl-10
                    pr-4
                    py-3
                    border
                    border-gray-300
                    dark:border-zinc-700
                    rounded-lg
                    bg-white
                    dark:bg-zinc-950
                    text-gray-900
                    dark:text-white
                    placeholder:text-gray-400
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:border-blue-500
                    disabled:opacity-60
                    transition
                  "
                  required
                />
              </div>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full
                bg-blue-600
                hover:bg-blue-700
                text-white
                py-3
                rounded-lg
                font-semibold
                transition
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </form>

          {/* SECURITY NOTE */}

          <div
            className="
              mt-6
              flex
              gap-2
              rounded-lg
              bg-gray-50
              dark:bg-zinc-800/70
              p-3
            "
          >
            <ShieldCheck
              size={17}
              className="
                mt-0.5
                shrink-0
                text-gray-500
              "
            />

            <p
              className="
                text-xs
                leading-5
                text-gray-500
                dark:text-gray-400
              "
            >
              For security reasons, we'll show the same response whether or not
              an account exists with this email.
            </p>
          </div>

          {/* BACK LOGIN */}

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-blue-600
                hover:text-blue-800
                transition
              "
            >
              <ArrowLeft size={17} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
