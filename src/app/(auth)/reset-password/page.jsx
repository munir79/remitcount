"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";
import Card from "@/compoent/ui/Card";
import Input from "@/compoent/ui/Input";
import Button from "@/compoent/ui/Button";


const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const validate = () => {
    const newErrors = {};
    if (!newPassword || newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters";
    if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await resetPassword({ email, newPassword }).unwrap();
      toast.success("Password reset successfully. Please log in.");
      router.push("/login");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reset password");
    }
  };

  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Reset Password</h1>
        <p className="mt-1 text-sm text-neutral-500">Set a new password for {email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="newPassword"
          type="password"
          label="New Password"
          placeholder="At least 6 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
        />
        <Input
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Reset Password
        </Button>
      </form>
    </Card>
  );
};

export default ResetPasswordPage;