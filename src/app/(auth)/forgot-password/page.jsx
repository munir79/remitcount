"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useForgotPasswordMutation, useVerifyOtpMutation } from "@/redux/features/auth/authApi";
import Card from "@/compoent/ui/Card";
import Input from "@/compoent/ui/Input";
import Button from "@/compoent/ui/Button";


const ForgotPasswordPage = () => {
  const router = useRouter();
  const [step, setStep] = useState("request"); // "request" | "verify"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const [forgotPassword, { isLoading: isSending }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      toast.success("If this email is registered, an OTP has been sent");
      setStep("verify");
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    try {
      await verifyOtp({ email, otp }).unwrap();
      toast.success("OTP verified successfully");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err?.data?.message || "Invalid or expired OTP");
    }
  };

  return (
    <Card>
      <Link href="/login" className="mb-4 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {step === "request" ? "Forgot Password" : "Verify OTP"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {step === "request"
            ? "Enter your email to receive a reset code"
            : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      {step === "request" ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            error={error}
          />
          <Button type="submit" isLoading={isSending} className="w-full">
            Send OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <Input
            id="otp"
            label="OTP Code"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setError("");
            }}
            error={error}
          />
          <Button type="submit" isLoading={isVerifying} className="w-full">
            Verify OTP
          </Button>
          <button
            type="button"
            onClick={() => setStep("request")}
            className="text-center text-sm text-indigo-600 hover:underline"
          >
            Didn&apos;t receive it? Resend
          </button>
        </form>
      )}
    </Card>
  );
};

export default ForgotPasswordPage;