"use client";

import { Message } from "@/store/atoms";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { ThinkingState } from "./ThinkingState";

interface MessageBubbleProps {
  message: Message;
}

/**
 * Basic formatter for chat content supporting:
 * - Bold: **text**
 * - Italic: *text*
 * - Horizontal Rule: --- (on its own line/paragraph)
 */
const formatInline = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={j} className="font-semibold text-[#151515]">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={j} className="italic text-[#151515]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

// Auto-bold important phrases: em dashes introduce key info, roles/titles, proper nouns after "at/as/from"
const autoBoldContent = (text: string): string => {
  // Don't double-process if already has markdown bold
  if (text.includes("**")) return text;

  // Bold text around em dashes that introduce key descriptions
  let result = text.replace(
    /—\s*([^—.!?]{10,80}?)(?=\s*—|\.|!|\?|$)/g,
    (match, group) => `— **${group.trim()}**`,
  );

  // Bold key patterns: "as a [Role]", "at [Company]", "from [Place]"
  result = result.replace(
    /\b(as (?:a |an )?)([\w\s&]+?(?:Manager|Director|COO|CEO|CTO|CFO|Lead|Head|Officer|Consultant|Specialist))/gi,
    (_, prefix, role) => `${prefix}**${role}**`,
  );

  return result;
};

const formatContent = (content: string): ReactNode[] => {
  if (!content) return [];

  const paragraphs = content.split(/\n\n+/g);
  const result: ReactNode[] = [];

  paragraphs.forEach((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return;

    if (trimmed === "---") {
      result.push(<hr key={i} className="my-6 border-t border-gray-100" />);
      return;
    }

    // Apply auto-bolding to long paragraphs without existing markdown
    const processed = trimmed.length > 150 ? autoBoldContent(trimmed) : trimmed;

    // Split at sentence boundaries — max ~2 sentences per paragraph for readability
    const sentences = processed.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let current = "";
    let sentenceCount = 0;
    for (const s of sentences) {
      sentenceCount++;
      if (current && (sentenceCount > 2 || (current + " " + s).length > 150)) {
        chunks.push(current);
        current = s;
        sentenceCount = 1;
      } else {
        current = current ? current + " " + s : s;
      }
    }
    if (current) chunks.push(current);

    chunks.forEach((chunk, ci) => {
      result.push(
        <p key={`${i}-${ci}`} className="whitespace-pre-wrap leading-7 mb-4 last:mb-0">
          {formatInline(chunk)}
        </p>,
      );
    });
  });

  return result;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  const [liked, setLiked] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({ description: "Copied to clipboard" });
  };

  if (isAssistant) {
    return (
      <div
        className="flex items-start gap-3 group"
        data-testid={`message-assistant-${message.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[#111111] text-label-large">
            {message.isStreaming && !message.content ? (
              <ThinkingState type={message.type} />
            ) : (
              formatContent(message.content)
            )}
          </div>

          {!message.isStreaming && (
            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                data-testid={`copy-message-${message.id}`}
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                title="Copy"
              >
                <Copy size={13} />
              </button>
              <button
                data-testid={`thumbs-up-${message.id}`}
                onClick={() => setLiked(true)}
                className={cn(
                  "p-1.5 rounded-lg hover:bg-gray-100 transition-colors",
                  liked === true
                    ? "text-[#111111]"
                    : "text-gray-400 hover:text-gray-600",
                )}
                title="Good response"
              >
                <ThumbsUp size={13} />
              </button>
              <button
                data-testid={`thumbs-down-${message.id}`}
                onClick={() => setLiked(false)}
                className={cn(
                  "p-1.5 rounded-lg hover:bg-gray-100 transition-colors",
                  liked === false
                    ? "text-red-400"
                    : "text-gray-400 hover:text-gray-600",
                )}
                title="Bad response"
              >
                <ThumbsDown size={13} />
              </button>
              <button
                data-testid={`retry-message-${message.id}`}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                title="Regenerate"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-end group"
      data-testid={`message-user-${message.id}`}
    >
      <div className="max-w-[75%] sm:max-w-[65%] flex flex-col items-end gap-2">
        {message.attachedFileName && (
          <div className="bg-[#FFFFFF] rounded-xl rounded-tr-md border border-[#ECEDEE] px-4 py-3 flex flex-col items-center gap-1 min-w-[120px]">
            <img src="/figmaAssets/FilePdf.svg" alt="PDF" className="w-10 h-10" />
            <span className="text-[10px] font-semibold text-[#4E5055] tracking-wide uppercase">PDF</span>
            <span className="text-xs text-[#111111] text-center break-all max-w-[160px]">
              {message.attachedFileName}
            </span>
          </div>
        )}
        {message.content && (
          <div className="bg-[#F2F2F2] rounded-2xl rounded-tr-md px-4 py-3">
            <div className="text-[#111111] text-label-large">
              {formatContent(message.content)}
            </div>
          </div>
        )}

        {/* Copy & Edit actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Copy"
          >
            <img src="/figmaAssets/Copy.svg" alt="Copy" className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <img src="/figmaAssets/Vector.svg" alt="Edit" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
