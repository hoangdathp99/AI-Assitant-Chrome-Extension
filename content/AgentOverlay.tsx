import React from "react";
import { MousePointer2 } from "lucide-react";
import { AgentCursorState } from "../types";

interface AgentOverlayProps {
  cursorState: AgentCursorState;
}

export const AgentOverlay: React.FC<AgentOverlayProps> = ({ cursorState }) => {
  if (!cursorState.visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[10000000] transition-all duration-500 ease-in-out"
      style={{
        left: cursorState.x,
        top: cursorState.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="relative">
        <MousePointer2
          size={32}
          className={`text-indigo-600 fill-indigo-100 ${cursorState.isClicking ? "scale-90" : "scale-100"} transition-transform`}
        />

        {cursorState.isClicking && (
          <span className="absolute -top-2 -left-2 w-12 h-12 bg-indigo-500/30 rounded-full animate-ping"></span>
        )}

        {cursorState.label && (
          <div className="absolute top-8 left-4 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
            {cursorState.label}
          </div>
        )}
      </div>
    </div>
  );
};
