import { Menu, Plus } from "lucide-react";
import {
  activeConversationAtom,
  activeConversationIdAtom,
  selectedModelAtom,
  sidebarOpenAtom,
  userAtom,
  conversationsAtom,
  isSettingsOpenAtom,
  isAssessmentCompleteAtom,
} from "@/store/atoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function ChatHeader() {
  const conversation = useAtomValue(activeConversationAtom);
  const setSidebarOpen = useSetAtom(sidebarOpenAtom);
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const setActiveId = useSetAtom(activeConversationIdAtom);
  const authUser = useAtom(userAtom)[0];
  const navigate = useNavigate();
  const conversations = useAtomValue(conversationsAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);

  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);

  const handleNewChat = () => {
    setActiveId(null);
    navigate("/chat");
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-14 shrink-0 bg-white mt-5">
      {/* Left: Mobile hamburger + model selector */}
      <div className="flex items-center gap-3 bg-re">
        {/* Mobile menu toggle */}
        <button
          data-testid="sidebar-toggle"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Model selector */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="model-selector"
              className="group flex items-center gap-1.5 px-3 py-1.5 
                 text-base font-medium text-[#111111]
                 border border-[#ECEDEE] rounded-lg
                 bg-white
                 shadow-sm outline-none focus:outline-none ring-0 focus:ring-0
                 hover:bg-gray-50 transition-all 
                 "
            >
              {selectedModel.name}

              <ChevronDown
                size={20}
                className="text-[#151515] transition-transform duration-200 
                   group-data-[state=open]:rotate-180"
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-52">
            {MODELS.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span
                  className={`font-medium text-base ${
                    selectedModel.id === model.id ? "text-[#111111]" : ""
                  }`}
                >
                  {model.name}
                </span>
                <span className="text-xs text-gray-400">
                  {model.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>

      {/* Right: New Chat + avatar */}
      <div className="flex items-center gap-3">
        <button
          data-testid="new-chat-header"
          onClick={handleNewChat}
          disabled={!isAssessmentComplete}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-body-medium-medium transition-colors",
            isAssessmentComplete
              ? "bg-[#111111] hover:bg-[#222222] text-white cursor-pointer"
              : "bg-[#111111] text-white cursor-not-allowed opacity-50",
          )}
        >
          <Plus size={18} />
          New Chat
        </button>

        {/* User avatar */}
        <img
          src={
            authUser?.profile?.photoUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.displayName || "User"}`
          }
          alt="User Profile"
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 rounded-lg cursor-pointer bg-purple-100 hidden sm:block transition-transform hover:scale-105 active:scale-95"
          data-testid="user-avatar"
        />
      </div>
    </header>
  );
}
