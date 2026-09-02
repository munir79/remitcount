"use client";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { disconnectSocket } from "@/socket/socket";
import Button from "@/compoent/ui/Button";


const NoAccessPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <ShieldAlert className="mb-4 h-12 w-12 text-amber-500" />
      <h1 className="text-lg font-semibold text-neutral-900">Welcome, {user?.name}</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        Your account doesn&apos;t have access to any module yet. Please contact your Company Admin to assign the
        right permissions, or create a company if you haven&apos;t already.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => router.push("/company/create")}>
          Set Up a Company
        </Button>
        <Button variant="ghost" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
};

export default NoAccessPage;