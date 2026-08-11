import BaseKanban from "../../../components/kanban/BaseKanban";
import BaseDraggableCard from "../../../components/kanban/BaseDraggableCard";
import KanbanColumnHeader from "../../../components/kanban/KanbanColumnHeader";
import LoaderCards from "../../../components/loader/CardsLazyLoader";
import UserDisplayName from "../../../components/UserDisplayName";
import { getProfileImage } from "../../../utils/avatar";
import { getDisplayName } from "../../../utils/name";

const STATUSES = ["New", "Contacted", "Lost"];

const getRepresentativeName = (prospect) => {
  const representative = prospect?.representativeName || {};

  return getDisplayName(representative, {
    includeMiddleInitial: true,
    includeSuffix: true,
  });
};

const groupProspectsByStatus = (prospects) => {
  return STATUSES.reduce((grouped, status) => {
    grouped[status] = prospects.filter(
      (prospect) => (prospect.status || "New") === status,
    );
    return grouped;
  }, {});
};

export default function ProspectKanban({
  prospects = [],
  loading = false,
  onView,
  onStatusChange,
}) {
  const columns = groupProspectsByStatus(prospects);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const currentStatus = source.droppableId;
    const nextStatus = destination.droppableId;

    if (currentStatus === nextStatus) return;

    const prospect = prospects.find((p) => p._id === draggableId);
    await onStatusChange?.(prospect || draggableId, nextStatus);
  };

  if (loading) {
    return <LoaderCards columns={STATUSES} />;
  }

  return (
    <BaseKanban
      columns={columns}
      statuses={STATUSES}
      onDragEnd={handleDragEnd}
      emptyMessage="No prospects"
      renderHeader={(status, items) => (
        <KanbanColumnHeader
          label={status}
          count={items.length}
          successStatus="Contacted"
        />
      )}
      renderCard={(prospect, index, items) => {
        const fullName = getRepresentativeName(prospect);
        const assignedName = prospect.handlingOfficer ? (
          <UserDisplayName user={prospect.handlingOfficer} showIcon={false}>
            {getDisplayName(prospect.handlingOfficer, {
              includeMiddleInitial: true,
              includeSuffix: true,
            })}
          </UserDisplayName>
        ) : (
          "Unassigned"
        );

        return (
          <BaseDraggableCard
            key={prospect._id}
            id={prospect._id}
            index={index}
            isLast={index === items.length - 1}
            onClick={() => onView?.(prospect)}
          >
            {/* Avatar + Representative Name */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={getProfileImage(prospect)}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover border shrink-0"
                />
                <h4 className="text-sm font-medium text-gray-600 leading-tight truncate">
                  {fullName}
                </h4>
              </div>
            </div>

            {prospect.companyName && (
              <div className="text-xs text-gray-500 mb-1.5 truncate">
                <span className="font-medium text-gray-600">
                  {prospect.companyName}
                </span>
              </div>
            )}

            {prospect.leadSource && (
              <div className="text-xs text-gray-400 mb-1.5">
                Source: {prospect.leadSource}
              </div>
            )}

            {/* Assignee Footer */}
            <div
              className={`flex items-center text-[11px] text-gray-400 ${
                !prospect.handlingOfficer && "italic"
              } mt-2 pt-2 border-t border-gray-100`}
            >
              <span className="flex items-center gap-1 truncate">
                {prospect.handlingOfficer && (
                  <img
                    src={getProfileImage(prospect.handlingOfficer)}
                    alt="assignee avatar"
                    className="w-5 h-5 rounded-full border"
                  />
                )}
                {assignedName}
              </span>
            </div>
          </BaseDraggableCard>
        );
      }}
      successStatus="Contacted"
    />
  );
}