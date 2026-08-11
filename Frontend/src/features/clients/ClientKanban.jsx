import ClientCard from "./ClientCard";
import BaseKanban from "../../components/kanban/BaseKanban";
import KanbanColumnHeader from "../../components/kanban/KanbanColumnHeader";
import LoaderCards from "../../components/loader/CardsLazyLoader";

export default function ClientKanban({
  columns = {},
  statuses = ["Active", "Inactive", "Lost"],
  permissions = {},
  onDragEnd,
  onCardClick,
  isLoading = false,
}) {
  const handleDragEndWithLock = async (result) => {
    const { destination, source } = result;

    if (!destination) return;

    if (source.droppableId === "Lost") return;

    await onDragEnd?.(result);
  };

  if (isLoading) {
    return <LoaderCards columns={statuses} />;
  }

  return (
    <BaseKanban
      columns={columns}
      statuses={statuses}
      permissions={permissions}
      onDragEnd={handleDragEndWithLock}
      emptyMessage="No clients"
      renderHeader={(status, clients) => (
        <KanbanColumnHeader
          label={status}
          count={clients.length}
        />
      )}
      renderCard={(client, index, clients) => (
        <ClientCard
          key={client._id}
          client={client}
          index={index}
          isLast={index === clients.length - 1}
          permissions={permissions}
          onClick={() => onCardClick?.(client)}
        />
      )}
    />
  );
}