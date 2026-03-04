"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'urgent' | 'admin' | 'creative' | 'deadline';
  source: string;
  deadline: string | null;
  completed: boolean;
  created_at: string;
  time_estimate_minutes: number | null;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energyLevel, setEnergyLevel] = useState<"low" | "medium" | "high">("medium");
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sprint");
      const data = await res.json();
      if (data.tasks || data.completed) {
        // Combine all buckets into one list
        const allTasks = [
          ...(data.tasks || []),
          ...(data.completed || [])
        ];
        setTasks(allTasks);
        if (data.energyLevel) setEnergyLevel(data.energyLevel);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await fetchData();
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleEnergySelect = async (level: "low" | "medium" | "high") => {
    setEnergyLevel(level);
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateEnergy", energyLevel: level }),
    });
  };

  const handleCompleteTask = async (taskId: string, currentlyCompleted: boolean) => {
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: currentlyCompleted ? "uncompleteTask" : "completeTask", 
        taskId 
      }),
    });
    fetchData();
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const completedCount = completedTasks.length;

  const categoryColors = {
    urgent: "bg-red-500/20 text-red-400",
    admin: "bg-yellow-500/20 text-yellow-400", 
    creative: "bg-blue-500/20 text-blue-400",
    deadline: "bg-purple-500/20 text-purple-400"
  };

  const formatTime = (minutes: number | null): string => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-zinc-900 text-zinc-100 ${focusMode ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      <header className="border-b border-zinc-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏃 Sprint Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-lg font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "🔄 Sync"}
            </button>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                focusMode 
                  ? "bg-red-500/20 text-red-400 border border-red-500/50" 
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {focusMode ? "Exit Focus" : "Enter Focus Mode"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Energy Check-in */}
        {!focusMode && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">⚡ How&apos;s your energy?</h2>
            <div className="flex gap-3">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleEnergySelect(level)}
                  className={`px-6 py-3 rounded-lg font-medium capitalize transition-all ${
                    energyLevel === level
                      ? level === "low" 
                        ? "bg-red-500 text-white"
                        : level === "medium"
                          ? "bg-yellow-500 text-black"
                          : "bg-green-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Current Sprint */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">🎯 Current Sprint</h2>
            {completedCount > 0 && (
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="px-4 py-2 rounded-lg font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                {showCompleted ? "✓ Done" : `Done (${completedCount})`}
              </button>
            )}
          </div>

          {/* Task List */}
          <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            {activeTasks.length === 0 && completedTasks.length === 0 ? (
              <p className="p-6 text-zinc-500 text-center">No tasks yet</p>
            ) : (
              <ul className="divide-y divide-zinc-700/50">
                {/* Active Tasks */}
                {activeTasks.map((task) => (
                  <li key={task.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleCompleteTask(task.id, task.completed)}
                        className="mt-1 w-5 h-5 rounded-full border-2 border-zinc-600 hover:border-green-500 transition-colors flex-shrink-0"
                      />
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
                        <span className="text-xs text-zinc-500">{task.source}</span>
                      </div>
                    </div>
                  </li>
                ))}

                {/* Completed Tasks (shown when toggle is on) */}
                {showCompleted && completedTasks.map((task) => (
                  <li key={task.id} className="p-4 hover:bg-zinc-800/30 transition-colors bg-zinc-800/20">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleCompleteTask(task.id, task.completed)}
                        className="mt-1 w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex-shrink-0 flex items-center justify-center"
                      >
                        <span className="text-black text-xs">✓</span>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-through text-zinc-500">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-zinc-600 line-through">{task.description}</p>
                        )}
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

        {/* Quick Stats */}
        {!focusMode && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-4">📊 Today&apos;s Overview</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-red-400">{tasks.filter(t => t.category === 'urgent' && !t.completed).length}</p>
                <p className="text-sm text-zinc-500">Urgent</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-yellow-400">{tasks.filter(t => t.category === 'admin' && !t.completed).length}</p>
                <p className="text-sm text-zinc-500">Admin</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-blue-400">{tasks.filter(t => t.category === 'creative' && !t.completed).length}</p>
                <p className="text-sm text-zinc-500">Creative</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-purple-400">{tasks.filter(t => t.category === 'deadline' && !t.completed).length}</p>
                <p className="text-sm text-zinc-500">Deadline</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-zinc-900 z-50 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-zinc-400 font-medium">🎯 Current Sprint</span>
              <span className="text-zinc-500">
                {energyLevel === "high" ? "⚡ High energy" : energyLevel === "medium" ? "⚡ Medium energy" : "⚡ Low energy"}
              </span>
            </div>
            <button
              onClick={() => setFocusMode(false)}
              className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
            >
              Exit Focus
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <ul className="max-w-2xl mx-auto space-y-2">
              {activeTasks.map((task) => (
                <li key={task.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600">○</span>
                    <span className="text-lg">{task.title}</span>
                    {task.time_estimate_minutes && (
                      <span className="text-sm text-zinc-500">
                        ⏱️ {formatTime(task.time_estimate_minutes)}
                      </span>
                    )}
                    <span className={`ml-auto px-2 py-0.5 text-xs rounded ${categoryColors[task.category]}`}>
                      {task.category}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
