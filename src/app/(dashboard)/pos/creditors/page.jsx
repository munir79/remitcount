"use client";
import { Landmark } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useGetCreditorsReportQuery } from "@/redux/features/report/reportApi";
import PartyBalancePage from "@/compoent/pos/PartyBalancePage";

const CreditorsPage = () => (
  <PartyBalancePage
    title="Creditors"
    description="To pay — suppliers (and customers) we still have to pay"
    icon={Landmark}
    tone="amber"
    balanceLabel="To pay"
    totalLabel="Total to pay"
    totalField="totalCreditors"
    emptyTitle="No creditors"
    emptyDescription="Nothing to pay — everyone has been paid in full."
    useReportQuery={useGetCreditorsReportQuery}
    exportType="creditors"
    buildReminder={(v) =>
      `Hi ${v.name}, we would like to confirm that we currently owe ${formatMoney(v.amount)} to your account. We will settle this shortly. Thank you for your partnership!`
    }
  />
);

export default CreditorsPage;
