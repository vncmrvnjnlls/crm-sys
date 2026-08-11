import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiUserPlus,
  FiX,
  FiLock,
} from "react-icons/fi";
import Swal from "sweetalert2";

import ViewDrawer from "../../../components/view/ViewDrawer";
import ViewTabs from "../../../components/view/ViewTabs";
import ViewProfileHero from "../../../components/view/ViewProfileHero";
import { Field, SectionBlock } from "../../../components/view/ViewField";
import UserCard from "../../../components/view/ViewUserCard";
import BaseBadge from "../../../components/badge/BaseBadge";

import { useActivities } from "../../../hooks/useActivities";
import ActivityTimeline from "../../../components/activity/ActivityTimeline";

import { formatDate, formatDateTime } from "../../../utils/date";
import { formatPhone } from "../../../utils/format";
import { buildFullAddress } from "../../../utils/buildFullAddress";

const PROSPECT_STATUSES = ["New", "Contacted", "Lost"];
const TABS = ["Overview", "Activity"];

const statusConfig = {
  New: { text: "New", tone: "blue" },
  Contacted: { text: "Contacted", tone: "green" },
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
          ? "border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none opacity-50 bg-gray-50"
          : className
      }`}
    >
      {Icon && <Icon size={14} />} {label}
    </button>
  </span>
);

export default function ProspectView({
  open,
  prospect,
  permissions = {},
  onClose,
  onEdit,
  onConvert,
  onUpdateStatus,
}) {
  const { canEdit, canUpdateStatus } = permissions;

  const [activeTab, setActiveTab] = useState("Overview");
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const { activities, loading: activitiesLoading, refetch } = useActivities(
    open && prospect ? "Prospect" : null,
    prospect?._id
  );

  useEffect(() => {
    if (!open) {
      setActiveTab("Overview");
      setStatusSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && prospect?._id && activeTab === "Activity") {
      refetch();
    }
  }, [open, prospect, activeTab, refetch]);

  const representative = prospect?.representativeName || {};
  const owner = prospect?.ownerName || {};

  const addr = useMemo(() => {
    const a = prospect?.address || {};
    const ba = prospect?.businessAddress || {};

    return {
      houseNumber: a.houseNumber || ba.houseNumber || prospect?.houseNumber || "",
      street: a.street || ba.streetAddress || prospect?.street || "",
      barangay: a.barangay || prospect?.barangay || "",
      municipality: a.municipality || ba.city || prospect?.city || prospect?.municipality || "",
      province: a.province || ba.province || prospect?.province || "",
      country: a.country || ba.country || prospect?.country || "Philippines",
      zipCode: a.zipCode || prospect?.zipCode || "",
    };
  }, [prospect]);

  const repFullName = useMemo(() => {
    return [
      representative?.firstName || prospect?.firstName,
      representative?.middleInitial || representative?.middleName || prospect?.middleName,
      representative?.lastName || prospect?.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [prospect, representative]);

  const ownerFullName = useMemo(() => {
    return [
      owner?.firstName || prospect?.ownerFirstName,
      owner?.middleInitial || owner?.middleName || prospect?.ownerMiddleName,
      owner?.lastName || prospect?.ownerLastName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [owner, prospect]);

  const isLost = prospect?.status === "Lost";
  const isConverted = prospect?.status === "Contacted" || prospect?.status === "Converted";
  const isLocked = isLost;

  const status = statusConfig[prospect?.status] ?? {
    text: prospect?.status || "Unknown",
    tone: "gray",
  };

  const handleStatusChange = async (newStatus) => {
    if (!prospect || !onUpdateStatus || statusSubmitting) return;

    if (prospect.status === newStatus) return;

    if (isLost) {
      Swal.fire({
        icon: "warning",
        title: "Status not allowed",
        text: "Lost prospects are final and can no longer be moved.",
      });
      return;
    }

    setStatusSubmitting(true);
    try {
      await onUpdateStatus(prospect._id, newStatus);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusBadge =
    canUpdateStatus && !isLocked ? (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Status:</span>
        <select
          value={prospect?.status || "New"}
          disabled={statusSubmitting}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`text-xs font-semibold rounded-md border px-2 w-full py-1 cursor-pointer focus:outline-none ${statusConfig[prospect?.status]?.tone ?? ""}`}
        >
          {PROSPECT_STATUSES.map((s) => (
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

  const companyEmail =
    prospect?.companyEmailAddress ||
    prospect?.emailAddress ||
    prospect?.companyEmail;

  return (
    <ViewDrawer open={open} onClose={onClose}>
      {prospect && (
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
                <ActionButton
                  label={isConverted ? "Converted" : "Convert to Lead"}
                  icon={FiUserPlus}
                  onClick={() => onConvert?.(prospect._id)}
                  disabled={isConverted || isLocked}
                  tooltip={
                    isLost
                      ? "Cannot convert a lost prospect"
                      : isConverted
                        ? "Prospect has already been converted"
                        : undefined
                  }
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                />

                <ActionButton
                  label="Edit"
                  icon={FiEdit2}
                  onClick={() => {
                    onClose();
                    onEdit?.(prospect);
                  }}
                  disabled={(permissions.canEdit !== undefined && !canEdit) || isLocked}
                  tooltip={
                    isLost
                      ? "Lost prospects cannot be edited"
                      : "You don't have permission to edit prospects"
                  }
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                />
              </div>
            </div>

            <ViewProfileHero
              record={prospect}
              title={prospect?.companyName || "Unnamed Prospect"}
              subtitle={`${repFullName || "No Representative"} · ${prospect?.natureOfBusiness || prospect?.industry || "—"}`}
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
                  This prospect is marked as <strong>Lost</strong> and cannot be modified or updated.
                </span>
              </div>
            )}

            <div className={isLost ? "opacity-60 pointer-events-none select-none" : ""}>
              {activeTab === "Overview" && (
                <>
                  <SectionBlock title="Assignment">
                    <div className="col-span-3 grid grid-cols-2 gap-4">
                      {prospect?.createdBy ? (
                        <UserCard
                          user={
                            typeof prospect.createdBy === "object"
                              ? prospect.createdBy
                              : { name: prospect.createdBy }
                          }
                          label="Created By"
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-400 italic">
                            No creator details
                          </p>
                        </div>
                      )}

                      {prospect?.handlingOfficer ? (
                        <UserCard
                          user={
                            typeof prospect.handlingOfficer === "object"
                              ? prospect.handlingOfficer
                              : { name: prospect.handlingOfficer }
                          }
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
                  </SectionBlock>

                  <SectionBlock title="Representative Information">
                    <Field label="Representative" value={repFullName} />
                    <Field label="Title" value={prospect?.title} />
                    <Field label="Phone" value={formatPhone(prospect?.phone)} />
                    <Field label="Viber" value={prospect?.viber} />
                    <Field label="Company Email" value={companyEmail} />
                  </SectionBlock>

                  <SectionBlock title="Company Information">
                    <Field label="Company" value={prospect?.companyName} />
                    <Field
                      label="Nature of Business"
                      value={prospect?.natureOfBusiness || prospect?.industry}
                    />
                    <Field
                      label="Employees"
                      value={prospect?.numberOfEmployees}
                    />
                    <Field
                      label="Website"
                      value={
                        prospect?.companyWebsite ? (
                          <a
                            href={
                              prospect.companyWebsite.startsWith("http")
                                ? prospect.companyWebsite
                                : `https://${prospect.companyWebsite}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {prospect.companyWebsite}
                          </a>
                        ) : null
                      }
                    />
                    <Field label="Lead Source" value={prospect?.leadSource} />
                    <Field label="Status" value={status.text} />
                  </SectionBlock>

                  <SectionBlock title="Owner Information">
                    <Field label="Owner" value={ownerFullName} />
                  </SectionBlock>

                  <SectionBlock title="Business Address">
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
                      {prospect?.notes || "—"}
                    </p>
                  </SectionBlock>

                  <SectionBlock title="Record">
                    <Field
                      label="Created"
                      value={formatDateTime(prospect?.createdAt)}
                    />
                    <Field
                      label="Updated"
                      value={formatDateTime(prospect?.updatedAt)}
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
    </ViewDrawer>
  );
}