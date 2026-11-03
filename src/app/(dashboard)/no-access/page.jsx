"use client";
import { useRouter } from "next/navigation";
import { Building2, LogOut, ShieldAlert } from "lucide-react";
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
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-600/20">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome{user?.name ? `, ${user.name}` : ""}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Your account doesn&apos;t have access to any area yet. Ask your company admin to assign you a role, or set up your own company.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => router.push("/company/create")}>
            <Building2 className="h-4 w-4" />
            Set up a company
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoAccessPage;
