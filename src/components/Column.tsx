"use client";

import { Task } from "./types";
import { TaskCard } from "./TaskCard";

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
  icon,
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
  const columnId = sprintId || 'backlog';
  const isDragOver = dragOverColumn === columnId;

  return (
    <div
      className={`flex-1 min-w-0 bg-zinc-800/30 rounded-lg p-3 border flex flex-col transition-colors ${
        isDragOver ? 'border-green-500 bg-green-500/5' : 'border-zinc-700/50'
      }`}
      onMouseEnter={() => onDragOver(sprintId)}
      onMouseUp={(e) => {
        e.preventDefault();
        onDrop(sprintId);
      }}
    >
      <h2 className="font-semibold text-zinc-400 mb-3 flex items-center gap-2 flex-shrink-0">
        {icon} {title}
        <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {tasks.map(task => (
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
          <p className="text-zinc-500 text-sm text-center py-8">
            {sprintId ? 'Drop tasks here' : 'No tasks in backlog'}
          </p>
        )}
        
        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <>
            <div className="border-t border-zinc-700/50 my-3"></div>
            <h3 className="text-xs font-semibold text-zinc-500 mb-2">✓ Completed</h3>
            {completedTasks.map(task => (
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
