import { Pencil, Trash2 } from "lucide-react";

import {
  BaseTable,
  TableRow,
  TableCell,
  TablePagination,
  useTablePagination,
} from "../../../components/table";
import StatusDropdown from "../../../components/select/StatusDropdown";
import LoaderTables from "../../../components/loader/TablesLazyLoader";

const PROSPECT_STATUSES = ["New", "Contacted", "Lost"];

const PROSPECT_STATUS_TONE = {
  New: "blue",
  Contacted: "green",
  Lost: "red",
};

const EMPTY_VALUE = (
  <span className="text-gray-300 tracking-widest">
    ─────────
  </span>
);

const getInitials = (rep) => {
  if (!rep) return "?";
  const first = rep.firstName || rep.first_name || "";
  const last = rep.lastName || rep.last_name || "";

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  return (first[0] || "?").toUpperCase();
};

export default function ProspectTable({
  prospects = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const columns = [
    { label: "Company" },
    { label: "Representative" },
    { label: "Contact" },
    { label: "Company Email" },
    { label: "Status" },
    { label: "", align: "text-right" },
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
  } = useTablePagination(prospects, 10);

  const HEADERS = columns.map((col) => col.label);

  const renderRepresentativeCell = (prospect) => {
    const rep = prospect?.representativeName || {};
    const name = [rep.firstName, rep.middleInitial, rep.lastName]
      .filter(Boolean)
      .join(" ");

    if (!name) return EMPTY_VALUE;

    return (
      <div className="flex items-center gap-2">
        <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 uppercase">
          {getInitials(rep)}
        </span>
        <span className="font-medium text-gray-700 text-sm">{name}</span>
      </div>
    );
  };

  const renderRow = (prospect) => {
    const isLost = prospect.status === "Lost";

    return (
      <TableRow key={prospect._id} onClick={() => onView?.(prospect)}>
        <TableCell>
          <span className="font-medium text-gray-700">
            {prospect.companyName || EMPTY_VALUE}
          </span>
        </TableCell>
        <TableCell>{renderRepresentativeCell(prospect)}</TableCell>
        <TableCell>
          <div className="text-sm">
            {prospect.phone || EMPTY_VALUE}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {prospect.companyEmailAddress || EMPTY_VALUE}
          </div>
        </TableCell>

        <TableCell>
          <div
            className="w-[110px]"
            onClick={(e) => e.stopPropagation()}
          >
            <StatusDropdown
              status={prospect.status || "New"}
              statuses={PROSPECT_STATUSES}
              toneMap={PROSPECT_STATUS_TONE}
              disabled={isLost}
              onSelect={(newStatus) =>
                onStatusChange?.(prospect, newStatus)
              }
            />
          </div>
        </TableCell>

        <TableCell align="text-right">
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {!isLost && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(prospect)}
                  className="p-2 rounded-md text-gray-400 hover:text-[#ef4444] transition-colors cursor-pointer"
                  title="Edit prospect"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete?.(prospect._id)}
                  className="p-2 rounded-md text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete prospect"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <LoaderTables
        paginatedItems="loading"
        headers={HEADERS}
        emptyMessage="No prospects found."
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
        empty={paginatedItems.length === 0 ? "No prospects found." : null}
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
    </div>
  );
}