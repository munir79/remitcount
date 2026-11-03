"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/compoent/layout/Sidebar";
import Header from "@/compoent/layout/Header";
import PageLoader from "@/compoent/ui/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyProfileQuery } from "@/redux/features/auth/authApi";
import { getTimezone, setTimezone } from "@/lib/format";

const DashboardLayout = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // ✅ Company র Timezone — বদলালে (প্রথম Login / Admin বদলালে) সব Page আবার আঁকা হয়
  const { data: profile } = useGetMyProfileQuery(undefined, { skip: !isAuthenticated });
  const [timezone, setTimezoneKey] = useState(getTimezone);
  const companyTimezone = profile?.data?.company?.settings?.timezone;
  if (companyTimezone && companyTimezone !== timezone && setTimezone(companyTimezone)) setTimezoneKey(companyTimezone);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing) {
    return <PageLoader className="h-screen" />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="app-shell flex h-screen bg-canvas print:bg-white">
      <div className="contents print:hidden">
        <Sidebar isMobileOpen={isMobileNavOpen} onMobileClose={() => setIsMobileNavOpen(false)} />
      </div>
      <div className="app-shell flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="contents print:hidden">
          <Header onMenuClick={() => setIsMobileNavOpen(true)} />
        </div>
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div key={timezone} className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
