import { useAtom } from "jotai";
import { conversationsAtom, activeConversationIdAtom } from "@/store/atoms";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HistoryPage() {
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [, setActiveId] = useAtom(activeConversationIdAtom);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpen = (id: string) => {
    setActiveId(id);
    navigate(`/chat/${id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex-1 overflow-auto px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
      <h1
        className="text-2xl font-semibold text-[#151515] mb-1"
        style={{ fontFamily: "Satoshi, Helvetica" }}
        data-testid="history-heading"
      >
        Chat History
      </h1>
      <p className="text-sm text-[#9B9B9B] mb-6">
        {conversations.length} conversation
        {conversations.length !== 1 ? "s" : ""}
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BCBCBC]"
        />
        <input
          data-testid="history-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#F7F6FA] border border-[#E8E5F0] rounded-xl text-sm text-[#151515] placeholder:text-[#BCBCBC] focus:outline-none focus:border-[#8A38F5] transition-colors"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#BCBCBC]">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              data-testid={`history-item-${conv.id}`}
              onClick={() => handleOpen(conv.id)}
              className="group flex items-center justify-between p-4 rounded-2xl border border-[#E8E5F0] bg-white hover:border-[#C4A9F5] hover:bg-[#FAF8FF] cursor-pointer transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-[#8A38F5]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#151515] truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">
                    {formatDistanceToNow(conv.updatedAt, { addSuffix: true })} •{" "}
                    {conv.model}
                  </p>
                </div>
              </div>
              <button
                data-testid={`delete-history-${conv.id}`}
                onClick={(e) => handleDelete(e, conv.id)}
                className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[#BCBCBC] hover:text-red-400 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
