"use client";

import { Task } from "./types";
import { formatTime } from "../lib/utils";
import { cn } from "@/lib/utils";
import { Star, Clock, AlertTriangle, X } from "lucide-react";
import { Button } from "./ui/button";

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
  onClear,
}: HighlightBannerProps) {
  if (!highlightTask) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 flex items-center justify-center min-h-[72px]">
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          <Star className="w-4 h-4" />
          Click the star on any task to set it as today&apos;s highlight
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-4 flex items-center gap-3 min-h-[72px] transition-all",
      highlightCompleted
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-amber-500/20 bg-amber-500/5"
    )}>
      {/* Completion toggle */}
      <button
        onClick={onComplete}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
          highlightCompleted
            ? "border-emerald-500 bg-emerald-500"
            : "border-muted-foreground/40 hover:border-emerald-500"
        )}
      >
        {highlightCompleted && (
          <svg className="w-3 h-3 text-background" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm",
          highlightCompleted && "line-through text-muted-foreground"
        )}>
          {highlightTask.title}
        </p>
        {highlightTask.time_estimate_minutes && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{formatTime(highlightTask.time_estimate_minutes)}</span>
          </p>
        )}
      </div>

      {/* Warnings + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPast4PM && !highlightCompleted && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Get started!
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
