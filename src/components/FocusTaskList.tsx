"use client";

import { Task } from "./types";
import { categoryColors, formatTime } from "../lib/utils";

interface FocusTaskListProps {
  tasks: Task[];
  completedTasks: Task[];
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
  onCompleteTask: (taskId: string, completed: boolean) => void;
}

export function FocusTaskList({
  tasks,
  completedTasks,
  showCompleted,
  onToggleShowCompleted,
  onCompleteTask,
}: FocusTaskListProps) {
  const completedCount = completedTasks.length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base font-semibold">🏃 Sprint</span>
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button className="px-3 py-1 rounded-md text-sm font-medium bg-zinc-700 text-white">
            1
          </button>
        </div>
        <button
          onClick={onToggleShowCompleted}
          className={`ml-auto px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
            showCompleted
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          Done ({completedCount})
        </button>
      </div>

      <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        {tasks.length === 0 && completedTasks.length === 0 ? (
          <p className="p-6 text-zinc-500 text-center">No tasks in this sprint</p>
        ) : (
          <ul className="divide-y divide-zinc-700/50">
            {tasks.map((task) => (
              <li key={task.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onCompleteTask(task.id, task.completed)}
                    className="mt-1 w-5 h-5 rounded-full border-2 border-zinc-600 hover:border-green-500 transition-colors flex-shrink-0 flex items-center justify-center"
                  >
                    {task.completed && <span className="text-black text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-zinc-500">{task.description}</p>
                    )}
                    {task.deadline && (
                      <p className="text-sm text-purple-400">
                        📅 Due: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${categoryColors[task.category]}`}>
                      {task.category}
                    </span>
                    {task.time_estimate_minutes && (
                      <span className="text-xs text-zinc-500">
                        ⏱️ {formatTime(task.time_estimate_minutes)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}

            {showCompleted && completedTasks.map((task) => (
              <li key={task.id} className="p-4 hover:bg-zinc-800/30 transition-colors bg-zinc-800/20">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onCompleteTask(task.id, task.completed)}
                    className="mt-1 w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex-shrink-0 flex items-center justify-center"
                  >
                    <span className="text-black text-xs">✓</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-through text-zinc-500">{task.title}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded ${categoryColors[task.category]} opacity-60`}>
                    {task.category}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
