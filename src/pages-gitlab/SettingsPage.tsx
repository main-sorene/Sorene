import { useState } from "react";
import { useAtom } from "jotai";
import { selectedModelAtom, MODELS } from "@/store/atoms";
import { cn } from "@/lib/utils";
import {
  Bell,
  Moon,
  Globe,
  Shield,
  Trash2,
  ChevronRight,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const settingSections = [
  {
    title: "Preferences",
    items: [
      {
        icon: Moon,
        label: "Dark Mode",
        description: "Toggle dark theme",
        type: "toggle",
      },
      {
        icon: Globe,
        label: "Language",
        description: "English (US)",
        type: "link",
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Manage alerts",
        type: "link",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        icon: Shield,
        label: "Privacy Settings",
        description: "Control your data",
        type: "link",
      },
      {
        icon: Trash2,
        label: "Clear All History",
        description: "Delete all conversations",
        type: "danger",
      },
    ],
  },
];

export function SettingsPage() {
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();

  const handleClearHistory = () => {
    toast({ description: "All conversation history cleared." });
  };

  return (
    <div className="flex-1 overflow-auto px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full">
      <h1
        className="text-2xl font-semibold text-[#151515] mb-1"
        style={{ fontFamily: "Satoshi, Helvetica" }}
        data-testid="settings-heading"
      >
        Settings
      </h1>
      <p className="text-sm text-[#9B9B9B] mb-8">
        Manage your preferences and account
      </p>

      {/* Default Model */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">
          Default Model
        </h2>
        <div className="rounded-2xl border border-[#E8E5F0] bg-white overflow-hidden">
          {MODELS.map((model, i) => (
            <button
              key={model.id}
              data-testid={`settings-model-${model.id}`}
              onClick={() => setSelectedModel(model)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAF8FF] transition-colors text-left",
                i < MODELS.length - 1 && "border-b border-[#F0EEF5]",
              )}
            >
              <div>
                <p className="text-sm font-medium text-[#151515]">
                  {model.name}
                </p>
                <p className="text-xs text-[#9B9B9B]">{model.description}</p>
              </div>
              {selectedModel.id === model.id && (
                <div className="w-5 h-5 rounded-full bg-[#8A38F5] flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Other sections */}
      {settingSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">
            {section.title}
          </h2>
          <div className="rounded-2xl border border-[#E8E5F0] bg-white overflow-hidden">
            {section.items.map((item, i) => (
              <button
                key={item.label}
                data-testid={`settings-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={
                  item.type === "toggle"
                    ? () => setDarkMode((p) => !p)
                    : item.type === "danger"
                      ? handleClearHistory
                      : undefined
                }
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAF8FF] transition-colors",
                  i < section.items.length - 1 && "border-b border-[#F0EEF5]",
                  item.type === "danger" && "hover:bg-red-50",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={18}
                    className={
                      item.type === "danger" ? "text-red-400" : "text-[#6B6B6B]"
                    }
                  />
                  <div className="text-left">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        item.type === "danger"
                          ? "text-red-500"
                          : "text-[#151515]",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-[#9B9B9B]">{item.description}</p>
                  </div>
                </div>
                {item.type === "toggle" ? (
                  <div
                    className={cn(
                      "w-10 h-5.5 rounded-full transition-colors relative",
                      darkMode ? "bg-[#8A38F5]" : "bg-[#E8E5F0]",
                    )}
                    style={{ height: "22px" }}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                        darkMode ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </div>
                ) : (
                  <ChevronRight size={16} className="text-[#BCBCBC]" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Account */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">
          Account
        </h2>
        <div className="rounded-2xl border border-[#E8E5F0] bg-white p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8A38F5] to-[#C084FC] flex items-center justify-center text-white text-lg font-semibold">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-[#151515]">Alex Johnson</p>
            <p className="text-xs text-[#9B9B9B]">alex@example.com</p>
            <span className="inline-block mt-1 text-xs font-medium text-[#8A38F5] bg-[#F5F3FF] px-2 py-0.5 rounded-full">
              Pro Plan
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#BCBCBC]">Sorene v3.0.1</p>
    </div>
  );
}
