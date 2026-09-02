

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/compoent/layout/Sidebar";
import Header from "@/compoent/layout/Header";
import { useAuth } from "@/hooks/useAuth";

const DashboardLayout = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center text-neutral-400">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;