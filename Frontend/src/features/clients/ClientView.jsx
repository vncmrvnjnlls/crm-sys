import { useEffect, useState } from "react";
import {
  FiEdit2,
  FiUserCheck,
  FiX,
  FiLock,
} from "react-icons/fi";
import Swal from "sweetalert2";

import ViewDrawer from "../../components/view/ViewDrawer";
import ViewTabs from "../../components/view/ViewTabs";
import ViewProfileHero from "../../components/view/ViewProfileHero";
import { Field, SectionBlock } from "../../components/view/ViewField";
import UserCard from "../../components/view/ViewUserCard";
import BaseBadge from "../../components/badge/BaseBadge";

import { useActivities } from "../../hooks/useActivities";
import ActivityTimeline from "../../components/activity/ActivityTimeline";

import AssignAgentModal from "../../components/modal/AssignAgentModal";

import { formatDate, formatDateTime } from "../../utils/date";
import { formatPhone } from "../../utils/format";
import { buildFullAddress } from "../../utils/buildFullAddress";

const CLIENT_STATUSES = ["Active", "Inactive", "Lost"];
const TABS = ["Overview", "Activity"];

const statusConfig = {
  Active: { text: "Active", tone: "green" },
  Inactive: { text: "Inactive", tone: "gray" },
  Lost: { text: "Lost", tone: "red" },
};

const btnOutlineBase =
  "flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md transition-colors cursor-pointer";

const ActionButton = ({
  label,
  icon: Icon,
  onClick,
  disabled,
  tooltip,
  className,
}) => (
  <span title={disabled ? tooltip : undefined} className="inline-flex">
    <button
      type="button"
      onClick={() => !disabled && onClick?.()}
      disabled={disabled}
      className={`${btnOutlineBase} ${
        disabled
          ? "border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
          : className
      }`}
    >
      {Icon && <Icon size={14} />} {label}
    </button>
  </span>
);

export default function ClientView({
  open,
  client,
  users = [],
  permissions = {},
  onClose,
  onEdit,
  onReassignClient,
  onUpdateStatus,
}) {
  const { canAssign, canEdit, canUpdateStatus } = permissions;

  const [activeTab, setActiveTab] = useState("Overview");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const { activities, loading: activitiesLoading } = useActivities(
    open && client ? "Client" : null,
    client?._id,
  );

  useEffect(() => {
    if (!open) {
      setActiveTab("Overview");
      setReassignModalOpen(false);
      setStatusSubmitting(false);
    }
  }, [open]);

  const addr = client?.address ?? {};
  const status = statusConfig[client?.status] ?? {
    text: "Unknown",
    tone: "gray",
  };

  const isLost = client?.status === "Lost";
  const isLocked = isLost;
  const hasOwner = Boolean(client?.assignedTo || client?.handlingOfficer);

  const handleStatusChange = async (newStatus) => {
    if (!client || !onUpdateStatus || statusSubmitting) return;

    if (client.status === newStatus) return;

    if (isLost) {
      Swal.fire({
        icon: "warning",
        title: "Status not allowed",
        text: "Lost clients are final and can no longer be moved.",
      });
      return;
    }

    setStatusSubmitting(true);
    try {
      await onUpdateStatus(client._id, newStatus);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusBadge =
    canUpdateStatus && !isLocked ? (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Status:</span>
        <select
          value={client?.status}
          disabled={statusSubmitting}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`text-xs font-semibold rounded-md border px-2 w-full py-1 cursor-pointer focus:outline-none ${statusConfig[client?.status]?.tone ?? ""}`}
        >
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {statusSubmitting && (
          <span className="text-xs text-gray-400">Saving…</span>
        )}
      </div>
    ) : (
      <BaseBadge tone={status.tone} size="sm" shape="soft">
        {status.text}
      </BaseBadge>
    );

  return (
    <ViewDrawer open={open} onClose={onClose}>
      {client && (
        <>
          {/* Header */}
          <div className="shrink-0 px-6 py-3 bg-white border-b border-gray-100">
            <div className="flex justify-between items-center gap-2 mb-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
              >
                <FiX size={18} />
              </button>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {canAssign && (
                  <ActionButton
                    label={hasOwner ? "Reassign Handling Officer" : "Assign Handling Officer"}
                    icon={FiUserCheck}
                    onClick={() => setReassignModalOpen(true)}
                    disabled={isLocked}
                    tooltip={isLost ? "Cannot reassign a lost client" : undefined}
                    className="border-sky-600 text-sky-800 hover:bg-sky-50"
                  />
                )}

                <ActionButton
                  label="Edit"
                  icon={FiEdit2}
                  onClick={() => {
                    onClose();
                    onEdit(client);
                  }}
                  disabled={!canEdit || isLocked}
                  tooltip={
                    isLost
                      ? "Lost clients cannot be edited"
                      : !canEdit
                        ? "You don't have permission to edit clients"
                        : undefined
                  }
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                />
              </div>
            </div>

            <ViewProfileHero
              record={client}
              subtitle={`${client.company || "—"} · ${client.industry || "—"}`}
              badge={statusBadge}
            />

            <ViewTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Locked Visual Banner for Lost Status */}
            {isLost && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2 font-medium">
                <FiLock size={16} className="shrink-0 text-red-500" />
                <span>
                  This client is marked as <strong>Lost</strong> and cannot be modified or updated.
                </span>
              </div>
            )}

            <div className={isLost ? "opacity-60 pointer-events-none select-none" : ""}>
              {activeTab === "Overview" && (
                <>
                  <SectionBlock title="Assignment">
                    <div className="col-span-3 grid grid-cols-2 gap-4">
                      <UserCard user={client.createdBy || client.clientOwner} label="Created by" />
                      {client.assignedTo || client.handlingOfficer ? (
                        <UserCard
                          user={client.assignedTo || client.handlingOfficer}
                          label="Handling Officer"
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-400 italic">
                            No officer assigned
                          </p>
                        </div>
                      )}
                    </div>
                    {client.assignedAt && (
                      <div className="col-span-3">
                        <Field
                          label="Assigned On"
                          value={formatDateTime(client.assignedAt)}
                        />
                      </div>
                    )}
                  </SectionBlock>

                  <SectionBlock title="Personal Information">
                    <Field label="First Name" value={client.firstName} />
                    <Field label="Middle Name" value={client.middleName} />
                    <Field label="Last Name" value={client.lastName} />
                    <Field
                      label="Suffix"
                      value={client.suffixName === "N/A" ? "—" : client.suffixName}
                    />
                    <Field
                      label="Date of Birth"
                      value={formatDate(client.dateOfBirth)}
                    />
                    <Field label="Sex" value={client.sex} />
                    <Field label="Phone" value={formatPhone(client.phone)} />
                    <Field label="Email" value={client.email} />
                  </SectionBlock>

                  <SectionBlock title="Client Information">
                    <Field label="Company" value={client.company} />
                    <Field label="Industry" value={client.industry} />
                    <Field label="Client Source" value={client.source || client.leadSource} />
                    <Field label="Status" value={status.text} />
                  </SectionBlock>

                  <SectionBlock title="Address">
                    <div className="col-span-3">
                      <Field
                        label="Full Address"
                        value={buildFullAddress(addr)}
                      />
                    </div>
                    <Field label="House No." value={addr.houseNumber} />
                    <Field label="Street" value={addr.street} />
                    <Field label="Barangay" value={addr.barangay} />
                    <Field
                      label="City / Municipality"
                      value={addr.municipality}
                    />
                    <Field label="Province" value={addr.province} />
                    <Field label="Zip Code" value={addr.zipCode} />
                    <Field label="Country" value={addr.country} />
                  </SectionBlock>

                  <SectionBlock title="Notes" fullWidth>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {client.notes || "—"}
                    </p>
                  </SectionBlock>

                  <SectionBlock title="Record">
                    <Field
                      label="Created"
                      value={formatDateTime(client.createdAt)}
                    />
                    <Field
                      label="Updated"
                      value={formatDateTime(client.updatedAt)}
                    />
                  </SectionBlock>
                </>
              )}

              {activeTab === "Activity" && (
                <ActivityTimeline
                  activities={activities}
                  loading={activitiesLoading}
                />
              )}
            </div>
          </div>
        </>
      )}

      <AssignAgentModal
        open={reassignModalOpen && Boolean(client) && !isLost}
        currentAssignee={client?.assignedTo || client?.handlingOfficer}
        salesAgents={users}
        title={hasOwner ? "Reassign Handling Officer" : "Assign Handling Officer"}
        subtitle="Select a handling officer for this client."
        currentLabel="Current Officer"
        selectLabel={hasOwner ? "New Handling Officer" : "Handling Officer"}
        confirmLabel={hasOwner ? "Save reassignment" : "Assign"}
        confirmingLabel="Saving…"
        onConfirm={(agentId) => onReassignClient?.(client._id, agentId)}
        onClose={() => setReassignModalOpen(false)}
      />
    </ViewDrawer>
  );
}