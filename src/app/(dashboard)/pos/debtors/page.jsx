"use client";
import { HandCoins } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useGetDebtorsReportQuery } from "@/redux/features/report/reportApi";
import PartyBalancePage from "@/compoent/pos/PartyBalancePage";

const DebtorsPage = () => (
  <PartyBalancePage
    title="Debtors"
    description="To collect — customers (and suppliers) who still have to pay us"
    icon={HandCoins}
    tone="sky"
    balanceLabel="To collect"
    totalLabel="Total to collect"
    totalField="totalDebtors"
    emptyTitle="No debtors"
    emptyDescription="Nothing to collect — everyone has paid in full."
    useReportQuery={useGetDebtorsReportQuery}
    exportType="debtors"
    buildReminder={(c) =>
      `Hi ${c.name}, this is a friendly reminder that you have an outstanding balance of ${formatMoney(c.amount)} with us. Please arrange payment at your earliest convenience. Thank you!`
    }
  />
);

export default DebtorsPage;
