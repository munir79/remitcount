"use client";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, Eye, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useListFilters } from "@/hooks/useListFilters";
import {
  useDeleteDraftJournalMutation,
  useGetAllJournalsQuery,
  usePostJournalMutation,
  useReverseJournalMutation,
} from "@/redux/features/journal/journalApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import PageHeader from "@/compoent/ui/PageHeader";
import ListToolbar from "@/compoent/ui/ListToolbar";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Button from "@/compoent/ui/Button";
import Pagination from "@/compoent/ui/Pagination";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import { DocCell, MoneyCell, StatusCell, TD } from "@/compoent/ui/TableCells";
import JournalFormModal from "@/compoent/accounting/JournalFormModal";
import JournalDetailModal from "@/compoent/accounting/JournalDetailModal";

const COLUMNS = [
  { key: "number", label: "Journal No." },
  { key: "narration", label: "Narration" },
  { key: "createdBy", label: "Created By" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const JOURNAL_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Posted", label: "Posted" },
  { value: "Reversed", label: "Reversed" },
];

const iconButton = "flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition";

const JournalPage = () => {
  const { hasPermission } = useAuth();
  const canFilterByBranch = hasPermission("cashierSession:manage");
  const canCreate = hasPermission("journal:create");
  const canPost = hasPermission("journal:approve");
  const canReverse = hasPermission("journal:delete");
  const filters = useListFilters();

  const { data, isLoading, isFetching, refetch } = useGetAllJournalsQuery({
    page: filters.params.page,
    limit: filters.params.limit,
    search: filters.params.search,
    status: filters.params.status,
    branch: filters.params.branch,
  });
  const [postJournal, { isLoading: isPosting }] = usePostJournalMutation();
  const [reverseJournal, { isLoading: isReversing }] = useReverseJournalMutation();
  const [deleteDraftJournal, { isLoading: isDeleting }] = useDeleteDraftJournalMutation();

  const journals = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Journal") refetch();
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [postTarget, setPostTarget] = useState(null);
  const [reverseTarget, setReverseTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const runAction = async (action, successMessage, clear) => {
    try {
      await action();
      toast.success(successMessage);
      clear();
    } catch (err) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  const newButton = canCreate && (
    <Button onClick={() => setIsFormOpen(true)}>
      <Plus className="h-4 w-4" />
      New Journal
    </Button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Journal Entries" description="Every posting in the books — manual entries and those created by POS" actions={newButton} />

      <ListToolbar
        statusOptions={JOURNAL_STATUS_OPTIONS}
        status={filters.status}
        onStatusChange={filters.setStatus}
        showBranch={canFilterByBranch}
        branch={filters.branch}
        onBranchChange={filters.setBranch}
        search={filters.search}
        onSearchChange={filters.setSearch}
        searchPlaceholder="Search no. or narration…"
      />

      {isLoading ? (
        <PageLoader />
      ) : journals.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filters.hasActiveFilters ? "No matching journals" : "No journal entries yet"}
          description={filters.hasActiveFilters ? "Try changing the filters or search." : "Create a manual entry for contra or non-cash transactions."}
          action={!filters.hasActiveFilters && newButton}
        />
      ) : (
        <>
          <Table columns={COLUMNS} className={isFetching ? "opacity-70 transition-opacity" : ""}>
            {journals.map((j) => (
              <tr key={j._id} className="cursor-pointer" onClick={() => setViewId(j._id)}>
                <DocCell number={j.journalNumber} date={j.date} />
                <td className={`${TD} max-w-md text-slate-700`}>
                  <p className="line-clamp-2">{j.narration}</p>
                </td>
                <td className={`${TD} text-slate-600`}>{j.createdBy?.name || "—"}</td>
                <MoneyCell value={j.totalAmount} strong />
                <StatusCell status={j.status} />
                {/* Row Click এ Detail খোলে — Action Button এ Click যেন Row তে না যায় */}
                <td className={`${TD} text-right`} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" title="View lines" aria-label="View lines" onClick={() => setViewId(j._id)} className={`${iconButton} hover:bg-slate-100 hover:text-slate-700`}>
                      <Eye className="h-4 w-4" />
                    </button>
                    {j.status === "Draft" && canCreate && (
                      <button type="button" title="Delete draft" aria-label="Delete draft" onClick={() => setDeleteTarget(j)} className={`${iconButton} hover:bg-rose-50 hover:text-rose-600`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {j.status === "Draft" && canPost && (
                      <Button size="xs" variant="soft" onClick={() => setPostTarget(j)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Post
                      </Button>
                    )}
                    {j.status === "Posted" && canReverse && !j.reversalOf && (
                      <Button size="xs" variant="ghost" onClick={() => setReverseTarget(j)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reverse
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={filters.setPage} />
        </>
      )}

      <JournalFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <JournalDetailModal journalId={viewId} onClose={() => setViewId(null)} />

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={() => runAction(() => postJournal(postTarget._id).unwrap(), "Journal posted", () => setPostTarget(null))}
        isLoading={isPosting}
        variant="primary"
        confirmLabel="Post"
        title={`Post ${postTarget?.journalNumber || ""}`}
        description={`Post ${postTarget?.journalNumber}? Account balances will be updated.`}
      />
      <ConfirmDialog
        isOpen={Boolean(reverseTarget)}
        onClose={() => setReverseTarget(null)}
        onConfirm={() =>
          runAction(() => reverseJournal({ id: reverseTarget._id, reason: "Manual reversal" }).unwrap(), "Journal reversed", () => setReverseTarget(null))
        }
        isLoading={isReversing}
        confirmLabel="Reverse"
        title={`Reverse ${reverseTarget?.journalNumber || ""}`}
        description={`Reverse ${reverseTarget?.journalNumber}? A new opposite entry will be posted; the original stays for audit.`}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => runAction(() => deleteDraftJournal(deleteTarget._id).unwrap(), "Draft deleted", () => setDeleteTarget(null))}
        isLoading={isDeleting}
        confirmLabel="Delete"
        title={`Delete ${deleteTarget?.journalNumber || ""}`}
        description={`Delete draft ${deleteTarget?.journalNumber}? Drafts have not affected any balance.`}
      />
    </div>
  );
};

export default JournalPage;
