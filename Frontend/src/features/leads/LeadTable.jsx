import { useState } from "react";
import { Pencil } from "lucide-react";
import { getDisplayName } from "../../utils/name";
import { formatPhone } from "../../utils/format";

import StatusDropdown from "../../components/select/StatusDropdown";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../components/table";
import LoaderTables from "../../components/loader/TablesLazyLoader";
import LeadActionConfirmModal from "./LeadActionConfirmModal";

const STATUSES = ["Contacted", "Qualified", "Converted", "Lost"];
const STATUS_TONE = {
  Contacted: "blue",
  Qualified: "amber",
  Converted: "green",
  Lost: "red",
};

const CONFIRM_STATUSES = new Set(["Lost", "Converted"]);

const EMPTY_VALUE = (
  <span className="text-gray-300 tracking-widest">
    ─────────
  </span>
);

const getInitials = (person) => {
  if (!person) return "?";
  const first = person.firstName || person.name?.split(" ")[0] || "";
  const last = person.lastName || person.name?.split(" ").slice(-1)[0] || "";

  if (first && last && first !== last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  return (first[0] || "?").toUpperCase();
};

export default function LeadTable({
  leads,
  permissions = {},
  isCurrentAgent,
  onEdit,
  onView,
  onUpdateStatus,
  onConvertLead,
  onShowWarning,
  isLoading = false,
}) {
  const [pendingChange, setPendingChange] = useState(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const columns = [
    { label: "Lead Owner" },
    { label: "Company" },
    { label: "Assigned Agent" },
    { label: "Mobile" },
    { label: "Email" },
    { label: "Status" },
    ...(permissions.canEdit ? [{ label: "", align: "text-right" }] : []),
  ];

  const {
    currentPage,
    rowsPerPage,
    totalRows,
    totalPages,
    paginatedItems,
    pageWindow,
    from,
    to,
    goTo,
    setRowsPerPage,
  } = useTablePagination(leads, 10);

  const HEADERS = columns.map((col) => col.label);

  const handleBeforeSelect = (lead, newStatus) => {
    if (CONFIRM_STATUSES.has(newStatus)) {
      if (newStatus === "Lost") {
        setPendingChange({ lead, newStatus });
        return;
      }

      if (newStatus === "Converted") {
        if (isCurrentAgent) {
          if (!lead.conversionRequested) {
            onShowWarning(
              "Approval required",
              "Please request conversion approval from your manager first."
            );
            return;
          }

          if (!lead.conversionApproved) {
            onShowWarning(
              "Pending approval",
              "Your conversion request is still awaiting manager approval."
            );
            return;
          }
        }

        if (
          !isCurrentAgent &&
          (lead.conversionRequested || lead.conversionApproved)
        ) {
          onShowWarning(
            "Cannot convert",
            "Conversion process has already started. The assigned agent must complete the conversion."
          );
          return;
        }

        setPendingChange({ lead, newStatus });
        return;
      }
    }

    onUpdateStatus(lead._id, newStatus);
  };

  const handleConfirm = async () => {
    if (!pendingChange || confirmSubmitting) return;
    setConfirmSubmitting(true);
    try {
      if (pendingChange.newStatus === "Converted") {
        await onConvertLead(pendingChange.lead._id);
      } else {
        await onUpdateStatus(pendingChange.lead._id, pendingChange.newStatus);
      }
      setPendingChange(null);
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const handleCancel = () => setPendingChange(null);

  const renderUserCell = (person, size = "w-9 h-9", textClass = "text-sm") => {
    if (!person) return EMPTY_VALUE;

    const name = getDisplayName(person, {
      includeMiddleInitial: true,
      includeSuffix: true,
    });

    return (
      <div className="flex items-center gap-2">
        <span
          className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 uppercase`}
        >
          {getInitials(person)}
        </span>
        <span className={`font-medium text-gray-700 ${textClass}`}>{name}</span>
      </div>
    );
  };

  const renderRow = (lead) => {
    const isLost = lead.status === "Lost";
    const isConverted = lead.convertedToClient;

    return (
      <TableRow key={lead._id} onClick={() => onView(lead)}>
        <TableCell>{renderUserCell(lead)}</TableCell>
        <TableCell>{lead.company || EMPTY_VALUE}</TableCell>
        <TableCell>
          {renderUserCell(lead.leadAssignee, "w-7 h-7", "text-sm")}
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {lead.phone ? formatPhone(lead.phone) : EMPTY_VALUE}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">{lead.email || EMPTY_VALUE}</div>
        </TableCell>

        <TableCell>
          <div
            className="w-[110px]"
            onClick={(e) => e.stopPropagation()}
          >
            <StatusDropdown
              status={lead.status}
              statuses={STATUSES}
              toneMap={STATUS_TONE}
              disabled={!permissions.canEdit || isConverted || isLost}
              onBeforeSelect={(newStatus) =>
                handleBeforeSelect(lead, newStatus)
              }
              onSelect={(newStatus) => onUpdateStatus(lead._id, newStatus)}
            />
          </div>
        </TableCell>

        {permissions.canEdit && (
          <TableCell align="text-right">
            {!isLost && !isConverted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(lead);
                }}
                className="p-2 rounded-md text-gray-400 hover:text-[#ef4444] transition-colors cursor-pointer"
                title="Edit lead"
              >
                <Pencil size={16} />
              </button>
            )}
          </TableCell>
        )}
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={HEADERS}
        emptyMessage="No leads found."
        heightClass="h-112.5"
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={totalRows}
        rowsPerPage={rowsPerPage}
        from={from}
        to={to}
        pageWindow={pageWindow}
        onGoTo={goTo}
        onRowsPerPageChange={setRowsPerPage}
        renderRow={renderRow}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] justify-between">
      <BaseTable
        columns={columns}
        empty={paginatedItems.length === 0 ? "No leads found." : null}
        colSpan={columns.length}
      >
        {paginatedItems.map(renderRow)}
      </BaseTable>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={totalRows}
        rowsPerPage={rowsPerPage}
        from={from}
        to={to}
        pageWindow={pageWindow}
        onGoTo={goTo}
        onRowsPerPageChange={setRowsPerPage}
        marginTop="mt-2"
      />

      <LeadActionConfirmModal
        open={Boolean(pendingChange)}
        lead={pendingChange?.lead}
        action={pendingChange?.newStatus === "Converted" ? "convert" : "lost"}
        submitting={confirmSubmitting}
        canConvert={permissions.canConvert}
        onClose={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
}