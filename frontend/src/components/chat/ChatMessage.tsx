import { cn } from "@/lib/utils";

export interface SimpleMessage {
  id: string;
  type: "player" | "dm";
  sender: string;
  content: string;
  timestamp: Date;
}

export function ChatMessage({ message }: { message: SimpleMessage }) {
  const isAI = message.type === "dm";
  return (
    <div
      data-slot="chat-message"
      className={cn(
        "rounded-md p-2 text-sm",
        isAI ? "bg-secondary" : "bg-muted"
      )}
    >
      <div className="font-semibold mb-1">{message.sender}</div>
      <div>{message.content}</div>
    </div>
  );
}
