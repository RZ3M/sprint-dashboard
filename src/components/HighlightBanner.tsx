"use client";

import { Task } from "./types";
import { formatTime } from "../lib/utils";

interface HighlightBannerProps {
  highlightTask: Task | null;
  highlightCompleted: boolean;
  isPast4PM: boolean;
  onComplete: () => void;
  onClear: () => void;
}

export function HighlightBanner({ 
  highlightTask, 
  highlightCompleted, 
  isPast4PM, 
  onComplete, 
  onClear 
}: HighlightBannerProps) {
  return (
    <div className={`p-4 rounded-lg border min-h-[80px] flex items-center ${
      highlightTask 
        ? (highlightCompleted 
            ? 'bg-green-500/10 border-green-500/50' 
            : 'bg-zinc-800/50 border-zinc-700/50')
        : 'border border-dashed border-zinc-700'
    }`}>
      {highlightTask ? (
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onComplete}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              highlightCompleted 
                ? "border-green-500 bg-green-500" 
                : "border-zinc-600 hover:border-green-500"
            }`}
          >
            {highlightCompleted && <span className="text-black text-xs">✓</span>}
          </button>
          <div className="flex-1">
            <p className={`font-medium ${highlightCompleted ? 'line-through text-zinc-500' : ''}`}>
              {highlightTask.title}
            </p>
            {highlightTask.time_estimate_minutes && (
              <p className="text-sm text-zinc-500">
                ⏱️ {formatTime(highlightTask.time_estimate_minutes)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPast4PM && !highlightCompleted && (
              <span className="text-sm text-red-400">⚠️ Get Started!</span>
            )}
            <button
              onClick={onClear}
              className="text-zinc-500 hover:text-zinc-300 p-1"
              title="Clear highlight"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <p className="text-zinc-400 text-sm w-full text-center">
          Click the ☆ on any task to set it as today&apos;s highlight
        </p>
      )}
    </div>
  );
}
