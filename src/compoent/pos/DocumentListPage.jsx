"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useListFilters } from "@/hooks/useListFilters";
import { useSocketEvent } from "@/socket/useSocketEvent";
import PageHeader from "../ui/PageHeader";
import ExcelDownloadButton from "../ui/ExcelDownloadButton";
import ListToolbar, {
  DOCUMENT_STATUS_OPTIONS,
  StatusTabs,
} from "../ui/ListToolbar";
import FilterPanel from "../ui/FilterPanel";
import PageLoader from "../ui/PageLoader";
import EmptyState from "../ui/EmptyState";
import Table from "../ui/Table";
import Button from "../ui/Button";
import Pagination from "../ui/Pagination";
import ConfirmDialog from "../ui/ConfirmDialog";
import { DocActionsCell, StatusCell } from "../ui/TableCells";
import RequestCancelModal from "./RequestCancelModal";

const noopMutation = () => [null, { isLoading: false }];

/**
 * ✅ POS এর সব Document List (Buy, Sell, Send, Other Income, Expense, Payment In/Out) একই নিয়মে চলে:
 * Draft → Post → (Cancel / Cancel Request)
 *
 * প্রতিটা Page শুধু Config দেয় — কোন API, কোন Column, কোন Form।
 * Status ও Action Column এখানে নিজে থেকে যোগ হয়।
 */
const DocumentListPage = ({
  title,
  description,
  newLabel,
  icon,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = "Search…",

  useListQuery,
  usePostMutation,
  useCancelMutation = noopMutation,

  socketModule, // Real-time Refetch এর জন্য Module এর নাম
  entityType, // Cancel Approval Request এর জন্য
  numberField, // যেমন "buyNumber"
  cancelPermission, // থাকলে সরাসরি Cancel, না থাকলে Approval Request
  canCancelRecord, // (record) => boolean ; না দিলে Cancel Button দেখায় না
  canPostRecord = (r) => r.status === "Draft", // (record) => boolean ; যেমন Expense এ সীমার বেশি হলে শুধু Admin
  renderStatusExtra, // (record) => Status এর পাশে বাড়তি Badge (যেমন "Waiting approval")
  statusOptions = DOCUMENT_STATUS_OPTIONS,
  supportsPeriod = true,

  columns, // Status/Action বাদে বাকি Column
  renderCells, // (record) => <td>…</td> গুলো
  renderExtraActions, // (record) => Action Column এ বাড়তি Button (যেমন Receipt)
  onRowClick, // (record) => Row এ Click করলে (যেমন Detail খোলা)
  renderFilters, // (filters) => Page এর নিজের Filter (যেমন Send এ Currency / Supplier) — filters.extra / filters.setExtra
  manualApply = false, // true → Filter বাছাই করে "Apply" / Enter চাপলে তবেই ফলাফল
  renderSummary, // (summary) => Filter এর পুরো ফলাফলের মোট (API র data.summary)
  FormModal,
  postDescription = "This will update account balances.",
  exportType, // থাকলে "Excel" Button — যা Filter করা আছে সেটাই নামে
}) => {
  const { hasPermission } = useAuth();
  const canFilterByBranch = hasPermission("cashierSession:manage");
  const filters = useListFilters({ manualApply });

  const { data, isLoading, isFetching, refetch } = useListQuery(filters.params);
  const [postRecord, { isLoading: isPosting }] = usePostMutation();
  const [cancelRecord, { isLoading: isCancelling }] = useCancelMutation();

  const records = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const summary = data?.data?.summary;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === socketModule) refetch();
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [requestCancelTarget, setRequestCancelTarget] = useState(null);

  const handlePost = async () => {
    try {
      await postRecord(postTarget._id).unwrap();
      toast.success(`${postTarget[numberField]} posted successfully`);
      setPostTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRecord({
        id: cancelTarget._id,
        reason: "Cancelled by user",
      }).unwrap();
      toast.success(`${cancelTarget[numberField]} cancelled successfully`);
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel");
    }
  };

  const handleCancelClick = (record) => {
    if (cancelPermission && hasPermission(cancelPermission))
      setCancelTarget(record);
    else setRequestCancelTarget(record);
  };

  const allColumns = [
    ...columns,
    { key: "status", label: "Status" },
    { key: "actions", label: "" },
  ];

  const newButton = FormModal && (
    <Button onClick={() => setIsFormOpen(true)}>
      <Plus className="h-4 w-4" />
      {newLabel}
    </Button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={title}
        description={description}
        actions={
          (exportType || newButton) && (
            <>
              {exportType && <ExcelDownloadButton type={exportType} params={filters.params} />}
              {newButton}
            </>
          )
        }
      />

      {manualApply ? (
        <>
          {statusOptions && (
            <div className="mb-3 print:hidden">
              <StatusTabs
                options={statusOptions}
                status={filters.status}
                onChange={filters.setStatus}
              />
            </div>
          )}
          <FilterPanel
            filters={filters}
            searchPlaceholder={searchPlaceholder}
            supportsPeriod={supportsPeriod}
            showBranch={canFilterByBranch}
          >
            {renderFilters?.(filters)}
          </FilterPanel>
        </>
      ) : (
        <ListToolbar
          statusOptions={statusOptions}
          status={filters.status}
          onStatusChange={filters.setStatus}
          period={filters.period}
          onPeriodChange={supportsPeriod ? filters.setPeriod : undefined}
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onFromDateChange={filters.setFromDate}
          onToDateChange={filters.setToDate}
          showBranch={canFilterByBranch}
          branch={filters.branch}
          onBranchChange={filters.setBranch}
          search={filters.search}
          onSearchChange={filters.setSearch}
          searchPlaceholder={searchPlaceholder}
        />
      )}

      {!manualApply && renderFilters && (
        <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
          {renderFilters(filters)}
          {filters.hasActiveFilters && (
            <Button variant="ghost" onClick={filters.clearAll}>
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>
      )}
      {renderSummary && summary && !isLoading && renderSummary(summary)}

      {isLoading ? (
        <PageLoader />
      ) : records.length === 0 ? (
        <EmptyState
          icon={icon}
          title={filters.hasActiveFilters ? "No matching records" : emptyTitle}
          description={
            filters.hasActiveFilters
              ? "Try changing the filters or search."
              : emptyDescription
          }
          action={!filters.hasActiveFilters && newButton}
        />
      ) : (
        <>
          <Table
            columns={allColumns}
            className={isFetching ? "opacity-70 transition-opacity" : ""}
          >
            {records.map((r) => (
              <tr
                key={r._id}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={onRowClick ? "cursor-pointer" : undefined}
              >
                {renderCells(r)}
                <StatusCell status={r.status} extra={renderStatusExtra?.(r)} />
                <DocActionsCell
                  canPost={r.status === "Draft" && canPostRecord(r)}
                  onPost={() => setPostTarget(r)}
                  canCancel={Boolean(canCancelRecord?.(r))}
                  onCancel={() => handleCancelClick(r)}
                >
                  {renderExtraActions?.(r)}
                </DocActionsCell>
              </tr>
            ))}
          </Table>
          <Pagination
            pagination={pagination}
            onPageChange={filters.setPage}
            limit={filters.limit}
            onLimitChange={filters.setLimit}
          />
        </>
      )}

      {FormModal && (
        <FormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      )}

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        isLoading={isPosting}
        variant="primary"
        confirmLabel="Post"
        title={`Post ${postTarget?.[numberField] || ""}`}
        description={`Post ${postTarget?.[numberField]}? ${postDescription}`}
      />
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        confirmLabel="Cancel record"
        title={`Cancel ${cancelTarget?.[numberField] || ""}`}
        description={`Cancel ${cancelTarget?.[numberField]}? Posted entries will be reversed.`}
      />
      {entityType && (
        <RequestCancelModal
          isOpen={Boolean(requestCancelTarget)}
          onClose={() => setRequestCancelTarget(null)}
          entityType={entityType}
          entityId={requestCancelTarget?._id}
          entityLabel={requestCancelTarget?.[numberField]}
        />
      )}
    </div>
  );
};

export default DocumentListPage;
