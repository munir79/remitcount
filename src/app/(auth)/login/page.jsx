"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLazyGetMyProfileQuery, useSignInMutation } from "@/redux/features/auth/authApi";
import Card from "@/compoent/ui/Card";
import Input from "@/compoent/ui/Input";
import { getLandingPage } from "@/lib/getLandingPage";
import { initSocket } from "@/socket/socket";
import Button from "@/compoent/ui/Button";

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [errors, setErrors] = useState({});

  const [signIn, { isLoading }] = useSignInMutation();
  const [triggerGetProfile] = useLazyGetMyProfileQuery();

  const validate = () => {
    const newErrors = {};
    if (!inputEmail.trim()) newErrors.email = "Email is required";
    if (!inputPassword) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await signIn({ email: inputEmail, password: inputPassword }).unwrap();

      if (response?.success) {
        const { token, _id, name, email } = response.data;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify({ _id, name, email }));
        initSocket(token);

        let userPermissions = [];
        try {
          const profileResult = await triggerGetProfile().unwrap();
          userPermissions = profileResult.data.permissions || [];
          localStorage.setItem("permissions", JSON.stringify(userPermissions));
        } catch (permErr) {
          localStorage.setItem("permissions", JSON.stringify([]));
        }

        toast.success("Login successful!");
        router.push(getLandingPage(userPermissions));
      }
    } catch (err) {
      toast.error(err?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <Card>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to your accounting workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@company.com"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          error={errors.email}
        />

        <Input
          id="password"
          label="Password"
          placeholder="••••••••"
          type={showPassword ? "text" : "password"}
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          error={errors.password}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="font-medium text-indigo-600 hover:underline">
          Forgot your password?
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </Card>
  );
};

export default LoginPage;