"use client";

import { setUser } from "@/Redux/Features/Auth/authSlice";
import { useAppDispatch } from "@/Redux/hook";
import { loginUser } from "@/services/auth";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

// ==========================================================
// CONSTANTS
// ==========================================================

const BRAND_NAME = "Gilbrice Blocks";

// Must match the UserRole enum in prisma/schema.prisma.
// Change the paths to match your actual frontend routes.
const ROLE_REDIRECTS: Record<string, string> = {
  OWNER: "/owner",
  ADMIN: "/admin",
  SALES_REPRESENTATIVE: "/sales",
  PRODUCTION_SUPERVISOR: "/production",
  DELIVERY_STAFF: "/delivery",
  CASHIER: "/cashier",
  ACCOUNTANT: "/accounts",
};

// Only allow internal paths ("/something"), never "//evil.com" or "https://..."
const getSafeRedirect = (path: string | null) => {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
};

const inputClass = `
  w-full
  px-4
  py-2.5
  border
  border-gray-300
  rounded-lg
  bg-white
  text-black
  outline-none
  focus:ring-2
  focus:ring-blue-500
  disabled:opacity-60
`;

const labelClass = `
  block
  text-sm
  font-medium
  text-gray-600
  dark:text-gray-300
  mb-1
`;

// ==========================================================
// COMPONENT
// ==========================================================

const LoginForm = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = getSafeRedirect(searchParams.get("redirectPath"));

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (!res?.success) {
        toast.error(res?.message || "Login information is incorrect.");
        return;
      }

      // ======================================================
      // BACKEND USER  (id, name, email, role, preferredLocale)
      // ======================================================

      const user = res?.data?.user;

      if (!user) {
        console.error("User missing from login response:", res);
        throw new Error("User information not found.");
      }

      // ======================================================
      // REDUX USER
      // ======================================================

      dispatch(
        setUser({
          user: {
            id: user.id,
            username: user.email,
            name: user.name,
            email: user.email,
            role: user.role,
            preferredLocale: user.preferredLocale,
          },
          token: res.data.accessToken,
        }),
      );

      toast.success("Login successful");

      // ======================================================
      // REDIRECT
      // ======================================================

      if (redirect) {
        router.replace(redirect);
        return;
      }

      router.replace(ROLE_REDIRECTS[user.role] ?? "/");
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);
      toast.error(error?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="w-full max-w-md mx-auto">
      {/* BRAND */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">{BRAND_NAME}</h1>
        <p className="text-sm text-gray-500 mt-1">Login to your account</p>
      </div>

      {/* LOGIN CARD */}
      <div
        className="
          bg-white
          dark:bg-zinc-900
          border
          border-gray-200
          dark:border-zinc-700
          rounded-xl
          shadow-sm
          p-6
        "
      >
        <h2
          className="
            text-2xl
            font-bold
            text-gray-800
            dark:text-white
            text-center
            mb-6
          "
        >
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* EMAIL */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isSubmitting}
              className={inputClass}
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                className={`${inputClass} pr-12`}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-500
                  disabled:opacity-50
                "
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <AiFillEyeInvisible size={22} />
                ) : (
                  <AiFillEye size={22} />
                )}
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="
                text-sm
                font-medium
                text-blue-600
                hover:text-blue-800
                hover:underline
                transition
              "
            >
              Forgot Password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full
              bg-blue-600
              text-white
              py-2.5
              rounded-lg
              font-medium
              hover:bg-blue-700
              transition
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* BACK TO HOME */}
        <div className="text-center mt-6 pt-5 border-t">
          <Link
            href="/"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-blue-600
              hover:text-blue-800
            "
          >
            <MoveLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
