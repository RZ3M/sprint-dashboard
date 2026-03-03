"use client";

import { useState, useEffect } from "react";

type SprintBucket = "urgent" | "admin" | "creative" | "deadline";

interface Task {
  id: string;
  title: string;
  description: string;
  category: SprintBucket;
  source: string;
  deadline: string | null;
  completed: boolean;
  created_at: string;
}

interface SprintData {
  urgent: Task[];
  admin: Task[];
  creative: Task[];
  deadline: Task[];
  currentSprint?: SprintBucket;
  energyLevel?: "low" | "medium" | "high";
  highlightTaskId?: string | null;
  highlightCompleted?: boolean;
}

export default function Home() {
  const [sprintData, setSprintData] = useState<SprintData>({ 
    urgent: [], admin: [], creative: [], deadline: [] 
  });
  const [currentSprint, setCurrentSprint] = useState<SprintBucket>("admin");
  const [energyLevel, setEnergyLevel] = useState<"low" | "medium" | "high">("medium");
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSprintData();
  }, []);

  const fetchSprintData = async () => {
    try {
      const res = await fetch("/api/sprint");
      const data = await res.json();
      if (data.urgent || data.admin || data.creative || data.deadline) {
        setSprintData(data);
        if (data.currentSprint) setCurrentSprint(data.currentSprint);
        if (data.energyLevel) setEnergyLevel(data.energyLevel);
      }
    } catch (error) {
      console.error("Failed to load sprint data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await fetchSprintData();
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleEnergySelect = async (level: "low" | "medium" | "high") => {
    setEnergyLevel(level);
    
    // Auto-suggest sprint based on energy
    if (level === "high") {
      setCurrentSprint("creative");
    } else if (level === "low") {
      setCurrentSprint("admin");
    }
    
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "updateEnergy",
        energyLevel: level,
        currentSprint: level === "high" ? "creative" : level === "low" ? "admin" : "creative"
      }),
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "completeTask", taskId }),
    });
    // Refresh data
    fetchSprintData();
  };

  const currentTasks = sprintData[currentSprint] || [];

  const bucketColors = {
    urgent: "bg-red-500",
    admin: "bg-yellow-500", 
    creative: "bg-blue-500",
    deadline: "bg-purple-500"
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

        {/* Sprint Buckets */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">🎯 Current Sprint</h2>
          
          {/* Bucket Tabs */}
          <div className="flex gap-2 mb-4">
            {(["urgent", "admin", "creative", "deadline"] as const).map((bucket) => (
              <button
                key={bucket}
                onClick={() => !focusMode && setCurrentSprint(bucket)}
                disabled={focusMode}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                  currentSprint === bucket
                    ? `${bucketColors[bucket]} text-white`
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {bucket} ({sprintData[bucket]?.length || 0})
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            {currentTasks.length === 0 ? (
              <p className="p-6 text-zinc-500 text-center">No tasks in this sprint</p>
            ) : (
              <ul className="divide-y divide-zinc-700/50">
                {currentTasks.map((task) => (
                  <li key={task.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
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
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        task.source === 'brain_dump' ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"
                      }`}>
                        {task.source}
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
          <section>
            <h2 className="text-lg font-semibold mb-4">📊 Today&apos;s Overview</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-red-400">{sprintData.urgent?.length || 0}</p>
                <p className="text-sm text-zinc-500">Urgent</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-yellow-400">{sprintData.admin?.length || 0}</p>
                <p className="text-sm text-zinc-500">Admin</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-blue-400">{sprintData.creative?.length || 0}</p>
                <p className="text-sm text-zinc-500">Creative</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-3xl font-bold text-purple-400">{sprintData.deadline?.length || 0}</p>
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${bucketColors[currentSprint]} text-white`}>
                {currentSprint}
              </span>
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
              {currentTasks.map((task) => (
                <li key={task.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600">○</span>
                    <span className="text-lg">{task.title}</span>
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
