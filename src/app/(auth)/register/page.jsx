"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useLazyGetMyProfileQuery, useSignUpMutation } from "@/redux/features/auth/authApi";
import Card from "@/compoent/ui/Card";
import Input from "@/compoent/ui/Input";
import Button from "@/compoent/ui/Button";
import { initSocket } from "@/socket/socket";

const RegisterPage = () => {
  const router = useRouter();
  const [signUp, { isLoading }] = useSignUpMutation();
  const [triggerGetProfile] = useLazyGetMyProfileQuery();

  const [inputName, setInputName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!inputName.trim()) newErrors.name = "Name is required";
    if (!inputEmail.trim()) newErrors.email = "Email is required";
    if (!inputPassword || inputPassword.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await signUp({ name: inputName, email: inputEmail, password: inputPassword }).unwrap();

      if (response?.success) {
        const { token, _id, name, email } = response.data;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify({ _id, name, email }));
        initSocket(token);

        try {
          const profileResult = await triggerGetProfile().unwrap();
          localStorage.setItem("permissions", JSON.stringify(profileResult.data.permissions || []));
        } catch (permErr) {
          localStorage.setItem("permissions", JSON.stringify([]));
        }

        toast.success("Account created successfully");
        router.push("/company/create");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed");
    }
  };

  return (
    <Card>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500">Start managing your currency exchange business</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Full Name"
          placeholder="John Doe"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          error={errors.name}
        />
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
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          error={errors.password}
        />

        <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
};

export default RegisterPage;