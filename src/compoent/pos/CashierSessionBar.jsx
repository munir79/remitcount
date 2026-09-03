"use client";
import { useState } from "react";
import { PlayCircle, StopCircle, Loader2 } from "lucide-react";
import { useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import OpenSessionModal from "./OpenSessionModal";
import CloseSessionModal from "./CloseSessionModal";


const CashierSessionBar = () => {
  const { data, isLoading, refetch } = useGetMyOpenSessionQuery();
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "CashierSession") refetch();
  });

  const mySession = data?.data || null;

  if (isLoading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      {mySession ? (
        <>
          <div className="flex items-center gap-3">
            <Badge variant="success">Session Open</Badge>
            <span className="text-sm text-slate-700">
              {mySession.cashAccount?.name} — Opening: ৳ {Number(mySession.openingBalance).toFixed(2)}
            </span>
          </div>
          <Button size="sm" variant="danger" onClick={() => setIsCloseModalOpen(true)}>
            <StopCircle className="h-4 w-4" />
            Close Session
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">No Active Session</Badge>
            <span className="text-sm text-slate-600">Open a session to start recording cash transactions</span>
          </div>
          <Button size="sm" onClick={() => setIsOpenModalOpen(true)}>
            <PlayCircle className="h-4 w-4" />
            Open Session
          </Button>
        </>
      )}

      <OpenSessionModal isOpen={isOpenModalOpen} onClose={() => setIsOpenModalOpen(false)} />
      <CloseSessionModal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} session={mySession} />
    </div>
  );
};

export default CashierSessionBar;