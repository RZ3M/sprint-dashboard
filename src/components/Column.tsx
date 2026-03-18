"use client";

import { Task } from "./types";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Check } from "lucide-react";

interface ColumnProps {
  title: string;
  icon: string;
  tasks: Task[];
  completedTasks?: Task[];
  highlightTaskId?: string;
  onCompleteTask: (taskId: string, completed: boolean) => void;
  onToggleHighlight: (taskId: string) => void;
  onDragStart: (taskId: string, e: React.MouseEvent) => void;
  onDragOver: (columnId: string | null) => void;
  onDrop: (sprintId: string | null) => void;
  dragOverColumn: string | null;
  sprintId: string | null;
  draggable: boolean;
}

export function Column({
  title,
  tasks,
  completedTasks = [],
  highlightTaskId,
  onCompleteTask,
  onToggleHighlight,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverColumn,
  sprintId,
  draggable,
}: ColumnProps) {
  const columnId = sprintId || "backlog";
  const isDragOver = dragOverColumn === columnId;

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-xl border flex flex-col transition-all duration-150",
        isDragOver
          ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_0_1px_theme(colors.emerald.500/30)]"
          : "border-border bg-card"
      )}
      onMouseEnter={() => onDragOver(sprintId)}
      onMouseUp={(e) => {
        e.preventDefault();
        onDrop(sprintId);
      }}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
        <h2 className="font-medium text-sm text-foreground">{title}</h2>
        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 ml-auto bg-muted text-muted-foreground">
          {tasks.length}
        </Badge>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isHighlight={highlightTaskId === task.id}
            onComplete={onCompleteTask}
            onToggleHighlight={onToggleHighlight}
            onDragStart={onDragStart}
            draggable={draggable}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-muted-foreground text-xs text-center py-8">
            {sprintId ? "Drop tasks here" : "No tasks in backlog"}
          </p>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <>
            <div className="border-t border-border my-2" />
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <Check className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                Completed ({completedTasks.length})
              </span>
            </div>
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isHighlight={highlightTaskId === task.id}
                onComplete={onCompleteTask}
                onToggleHighlight={onToggleHighlight}
                onDragStart={onDragStart}
                draggable={draggable}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
