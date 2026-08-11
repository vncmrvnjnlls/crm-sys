import React from "react";
import { Search, Plus } from "lucide-react";

export default function SearchBar({
  searchInputRef,
  showNew = false,
  setShowNew = () => {},
  searchQuery = "",
  setSearchQuery = () => {},
  userSearch = "",
  setUserSearch = () => {},
  hasThreads = false,
  onActivateNewConversation = () => {},
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        {showNew ? (
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users by name or role..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-red-500 focus:bg-white transition"
          />
        ) : (
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-red-500 focus:bg-white transition"
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (showNew) {
            setShowNew(false);
            setUserSearch("");
          } else {
            onActivateNewConversation();
          }
        }}
        title={showNew ? "Back to chats" : "New conversation"}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition shrink-0 cursor-pointer"
      >
        <Plus size={16} className={showNew ? "rotate-45 transition-transform" : "transition-transform"} />
      </button>
    </div>
  );
}