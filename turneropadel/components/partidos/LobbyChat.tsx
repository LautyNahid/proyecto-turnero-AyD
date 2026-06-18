"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col p-0">
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base">Chat — {nombreLobby}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Funcionalidad demostrativa. Los mensajes no se persisten.
          </p>
        </SheetHeader>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : "flex-row"}`}
            >
              {!msg.own && (
                <div className="size-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {msg.initials}
                </div>
              )}
              <div className={`max-w-[75%] space-y-1 ${msg.own ? "items-end" : "items-start"} flex flex-col`}>
                {!msg.own && (
                  <span className="text-xs text-muted-foreground px-1">{msg.author}</span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
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
        <div className="px-4 py-3 border-t border-border shrink-0 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje..."
            className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            size="icon"
            className="rounded-full shrink-0"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}