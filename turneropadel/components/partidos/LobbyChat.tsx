"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Send, X, Minus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  text: string;
  author: string;
  initials: string;
  own: boolean;
  hora: string;
}

interface LobbyChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombreLobby: string;
}

export function LobbyChat({ open, onOpenChange, nombreLobby }: LobbyChatProps) {
  const { user } = useUser();
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hola! ¿Todos confirmados para mañana?",
      author: "Organizador",
      initials: "OR",
      own: false,
      hora: "10:30",
    },
    {
      id: 2,
      text: "Sí, ahí voy a estar 🎾",
      author: "Jugador 2",
      initials: "J2",
      own: false,
      hora: "10:32",
    },
  ]);
  const [input, setInput] = useState("");

  const nombre = user?.firstName ?? "Vos";
  const iniciales = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const now = new Date();
    const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, author: nombre, initials: iniciales, own: true, hora },
    ]);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground cursor-pointer select-none"
        onClick={() => setMinimized((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="size-4 shrink-0" />
          <span className="text-sm font-semibold truncate">{nombreLobby}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v); }}
            className="size-6 rounded-full hover:bg-white/20 flex items-center justify-center transition"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
            className="size-6 rounded-full hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Body — oculto si minimizado */}
      {!minimized && (
        <>
          <p className="text-[10px] text-muted-foreground text-center py-1.5 border-b border-border bg-muted/40">
            Funcionalidad demostrativa · Los mensajes no se persisten
          </p>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 max-h-72">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : "flex-row"}`}
              >
                {!msg.own && (
                  <div className="size-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {msg.initials}
                  </div>
                )}
                <div className={`max-w-[75%] space-y-0.5 flex flex-col ${msg.own ? "items-end" : "items-start"}`}>
                  {!msg.own && (
                    <span className="text-[10px] text-muted-foreground px-1">{msg.author}</span>
                  )}
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-sm ${
                      msg.own
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">{msg.hora}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí un mensaje..."
              className="flex-1 rounded-full bg-muted px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button
              size="icon"
              className="rounded-full size-8 shrink-0"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}