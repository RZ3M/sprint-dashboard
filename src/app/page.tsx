"use client";

import { useState, useEffect } from "react";

type SprintBucket = "urgent" | "admin" | "creative";

interface Task {
  type: string;
  id: string;
  subject?: string;
  summary?: string;
  from?: string;
  date?: string;
  start?: string;
  end?: string;
}

interface SprintData {
  urgent: Task[];
  admin: Task[];
  creative: Task[];
}

export default function Home() {
  const [sprintData, setSprintData] = useState<SprintData>({ urgent: [], admin: [], creative: [] });
  const [currentSprint, setCurrentSprint] = useState<SprintBucket>("admin");
  const [energyLevel, setEnergyLevel] = useState<"low" | "medium" | "high">("medium");
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSprintData();
  }, []);

  const fetchSprintData = async () => {
    try {
      const res = await fetch("/api/sprint");
      const data = await res.json();
      if (data.urgent || data.admin || data.creative) {
        setSprintData(data);
      }
    } catch (error) {
      console.error("Failed to load sprint data:", error);
    } finally {
      setLoading(false);
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
      body: JSON.stringify({ currentSprint: level === "high" ? "creative" : level === "low" ? "admin" : "creative", energyLevel: level }),
    });
  };

  const currentTasks = sprintData[currentSprint] || [];

  const bucketColors = {
    urgent: "bg-red-500",
    admin: "bg-yellow-500", 
    creative: "bg-blue-500"
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
            {(["urgent", "admin", "creative"] as const).map((bucket) => (
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
                {currentTasks.map((task, i) => (
                  <li key={task.id || i} className="p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        task.type === "email" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                      }`}>
                        {task.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {task.subject || task.summary}
                        </p>
                        {task.from && (
                          <p className="text-sm text-zinc-500 truncate">{task.from}</p>
                        )}
                        {task.start && (
                          <p className="text-sm text-zinc-500">
                            {new Date(task.start).toLocaleString()}
                          </p>
                        )}
                      </div>
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
            <div className="grid grid-cols-3 gap-4">
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
              {currentTasks.map((task, i) => (
                <li key={task.id || i} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600">○</span>
                    <span className="text-lg">{task.subject || task.summary}</span>
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
