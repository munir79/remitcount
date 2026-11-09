"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { EXPORT_LIST } from "@/utils/url";
import Button from "./Button";

/** Server এর Header থেকে ফাইলের নাম — না পেলে fallback */
const fileNameFrom = (res, fallback) => {
  const match = /filename="?([^";]+)"?/.exec(res.headers.get("Content-Disposition") || "");
  return match ? decodeURIComponent(match[1]) : fallback;
};

/**
 * ✅ Excel Download — পর্দার তালিকার একই Filter, সব পাতা একসাথে (ফাইল Server এ তৈরি হয়)
 * type: "send" | "buy" | "sell" | "other-income" | "expense" | "payment-in" | "payment-out" | "debtors" | "creditors"
 * params: তালিকার Filter (page / limit থাকলেও Server বাদ দেয়)
 * export:data না থাকলে কিছুই দেখায় না
 */
const ExcelDownloadButton = ({ type, params = {} }) => {
  const { hasPermission } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  if (!hasPermission("export:data")) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const query = new URLSearchParams(Object.entries(params).filter(([k, v]) => v !== undefined && v !== null && v !== "" && k !== "page" && k !== "limit"));
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${EXPORT_LIST(type)}?${query}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Could not download. Please try again.");
      }
      const url = window.URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(res, `${type}.xlsx`);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleDownload} isLoading={isDownloading} title="Download what this list shows, with the same filters">
      {!isDownloading && <Download className="h-4 w-4" />}
      Excel
    </Button>
  );
};

export default ExcelDownloadButton;
