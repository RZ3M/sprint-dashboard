"use client";

import { Task } from "./types";

interface TaskCardProps {
  task: Task;
  isHighlight: boolean;
  onComplete: (taskId: string, completed: boolean) => void;
  onToggleHighlight: (taskId: string) => void;
  onDragStart: (taskId: string, e: React.MouseEvent) => void;
  draggable: boolean;
}

const categoryColors = {
  urgent: "bg-red-500/20 text-red-400",
  admin: "bg-yellow-500/20 text-yellow-400",
  creative: "bg-blue-500/20 text-blue-400",
  deadline: "bg-purple-500/20 text-purple-400"
};

export function TaskCard({ task, isHighlight, onComplete, onToggleHighlight, onDragStart, draggable }: TaskCardProps) {
  return (
    <div
      onMouseDown={(e) => {
        if (draggable) {
          onDragStart(task.id, e);
        }
      }}
      className={`p-3 bg-zinc-800/50 rounded-lg border transition-all select-none ${
        isHighlight
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-zinc-700/50 hover:bg-zinc-800'
      } ${draggable ? 'cursor-grab' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id, task.completed);
          }}
          className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "border-green-500 bg-green-500"
              : "border-zinc-600 hover:border-green-500"
          }`}
        >
          {task.completed && <span className="text-black text-xs">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-sm flex-1 ${task.completed ? 'line-through text-zinc-500' : ''}`}>
              {task.title}
            </p>
          </div>
          {task.description && (
            <p className="text-xs text-zinc-500 mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs rounded ${categoryColors[task.category]}`}>
              {task.category}
            </span>
            {task.time_estimate_minutes && (
              <span className="text-xs text-zinc-500">
                ⏱️ {task.time_estimate_minutes}
              </span>
            )}
            {task.deadline && (
              <span className="text-xs text-purple-400">
                📅 {formatDate(task.deadline)}
              </span>
            )}
          </div>
        </div>
        {/* Star button to set as highlight */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleHighlight(task.id);
          }}
          className={`ml-2 text-lg flex-shrink-0 transition-colors ${
            isHighlight
              ? 'text-yellow-400'
              : 'text-zinc-600 hover:text-yellow-400'
          }`}
          title={isHighlight ? 'Remove from highlight' : 'Set as highlight'}
        >
          {isHighlight ? '⭐' : '☆'}
        </button>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}
