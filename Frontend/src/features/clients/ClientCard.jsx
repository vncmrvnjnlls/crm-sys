import BaseDraggableCard from "../../components/kanban/BaseDraggableCard";
import UserDisplayName from "../../components/UserDisplayName";
import { getProfileImage } from "../../utils/avatar";
import { getDisplayName } from "../../utils/name";

export default function ClientCard({
  client,
  index,
  isLast,
  onClick,
}) {
  if (!client) return null;

  const fullName = getDisplayName(client, {
    includeMiddleInitial: true,
    includeSuffix: true,
  });

  const assignedName = client?.handlingOfficer ? (
    <UserDisplayName user={client.handlingOfficer} showIcon={false}>
      {getDisplayName(client.handlingOfficer, {
        includeMiddleInitial: true,
        includeSuffix: true,
      })}
    </UserDisplayName>
  ) : (
    "Unassigned"
  );

  return (
    <BaseDraggableCard
      id={client._id}
      index={index}
      isLast={isLast}
      onClick={onClick}
    >
      {/* Avatar + Name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={getProfileImage(client)}
            alt="avatar"
            className="w-7 h-7 rounded-full object-cover border shrink-0"
          />
          <h4 className="text-sm font-medium text-gray-600 leading-tight truncate">
            {fullName}
          </h4>
        </div>
      </div>

      {client?.company && (
        <div className="text-xs text-gray-500 mb-1.5 truncate">
          <span className="font-medium text-gray-600">
            {client.company}
          </span>
        </div>
      )}

      {client?.leadSource && (
        <div className="text-xs text-gray-400 mb-1.5">
          Source: {client.leadSource}
        </div>
      )}

      {/* Assignee Footer */}
      <div
        className={`flex items-center text-[11px] text-gray-400 ${
          !client?.handlingOfficer && "italic"
        } mt-2 pt-2 border-t border-gray-100`}
      >
        <span className="flex items-center gap-1 truncate">
          {client?.handlingOfficer && (
            <img
              src={getProfileImage(client.handlingOfficer)}
              alt="assignee avatar"
              className="w-5 h-5 rounded-full border"
            />
          )}
          {assignedName}
        </span>
      </div>
    </BaseDraggableCard>
  );
}