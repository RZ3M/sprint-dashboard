"use client";

import { Task } from "./types";
import { formatTime, categoryColors } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Star, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isHighlight: boolean;
  onComplete: (taskId: string, completed: boolean) => void;
  onToggleHighlight: (taskId: string) => void;
  onDragStart: (taskId: string, e: React.MouseEvent) => void;
  draggable: boolean;
}

export function TaskCard({ task, isHighlight, onComplete, onToggleHighlight, onDragStart, draggable }: TaskCardProps) {
  return (
    <div
      onMouseDown={(e) => {
        if (draggable) {
          onDragStart(task.id, e);
        }
      }}
      className={cn(
        "p-3 rounded-lg border transition-all select-none group",
        isHighlight
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-card hover:border-border/80 hover:bg-accent/30",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Completion button */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id, task.completed);
          }}
          className={cn(
            "mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all",
            task.completed
              ? "border-emerald-500 bg-emerald-500"
              : "border-muted-foreground/40 hover:border-emerald-500"
          )}
        >
          {task.completed && (
            <svg className="w-2.5 h-2.5 text-background" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium leading-snug",
            task.completed ? "line-through text-muted-foreground" : "text-foreground"
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className={cn("text-xs px-1.5 py-0 h-4", categoryBadgeColors[task.category])}>
              {task.category}
            </Badge>
            {task.time_estimate_minutes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{formatTime(task.time_estimate_minutes)}</span>
              </span>
            )}
            {task.deadline && (
              <span className="text-xs text-violet-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Star button */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleHighlight(task.id);
          }}
          className={cn(
            "flex-shrink-0 p-0.5 rounded transition-colors",
            isHighlight
              ? "text-amber-400"
              : "text-muted-foreground/30 hover:text-amber-400 opacity-0 group-hover:opacity-100"
          )}
          title={isHighlight ? "Remove from highlight" : "Set as highlight"}
        >
          <Star className={cn("w-3.5 h-3.5", isHighlight && "fill-amber-400")} />
        </button>
      </div>
    </div>
  );
}

const categoryBadgeColors: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 hover:bg-red-500/15",
  admin: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/15",
  creative: "bg-blue-500/15 text-blue-400 hover:bg-blue-500/15",
  deadline: "bg-violet-500/15 text-violet-400 hover:bg-violet-500/15",
};
