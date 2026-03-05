"use client";

import { useState, useEffect } from "react";
import { Task, Sprint, ViewMode, EnergyLevel, SprintAPIResponse } from "../components/types";
import { TaskCard } from "../components/TaskCard";
import { HighlightBanner } from "../components/HighlightBanner";
import { Column } from "../components/Column";
import { FocusTaskList } from "../components/FocusTaskList";
import { getTorontoDateString, formatTime, isPast4PM, getTorontoDate, categoryColors } from "../lib/utils";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
  const [taskStats, setTaskStats] = useState({ urgent: 0, admin: 0, creative: 0, deadline: 0 });
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [currentSprint, setCurrentSprint] = useState<number>(1);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightTask, setHighlightTask] = useState<Task | null>(null);
  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [test4PM, setTest4PM] = useState(false);

  // Derived state
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const backlogTasks = activeTasks.filter(t => !t.sprint_id);
  const currentSprintData = sprints.find(s => s.sprint_number === currentSprint);
  const currentSprintTasks = activeTasks.filter(t => t.sprint_id === currentSprintData?.id);
  const currentSprintCompleted = tasks.filter(t => t.completed && t.sprint_id === currentSprintData?.id);
  const completedCount = currentSprintCompleted.length;

  const getSprintTasks = (sprintNumber: number) => {
    const sprint = sprints.find(s => s.sprint_number === sprintNumber);
    return activeTasks.filter(t => t.sprint_id === sprint?.id);
  };

  const getCompletedTasks = (sprintNumber: number) => {
    const sprint = sprints.find(s => s.sprint_number === sprintNumber);
    return tasks.filter(t => t.completed && t.sprint_id === sprint?.id);
  };

  // Update time
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getTorontoDate());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sprint");
      const data = await res.json() as SprintAPIResponse;
      if (data.tasks || data.completed || data.sprints) {
        setTasks([...(data.tasks || []), ...(data.completed || [])]);
        setSprints(data.sprints || []);
        if (data.energyLevel) setEnergyLevel(data.energyLevel);
        if (data.highlightTask) setHighlightTask(data.highlightTask);
        if (typeof data.highlightCompleted === 'boolean') setHighlightCompleted(data.highlightCompleted);
        if (data.stats) setTaskStats(data.stats);
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

  const handleEnergySelect = async (level: EnergyLevel) => {
    setEnergyLevel(level);
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateEnergy", energyLevel: level }),
    });
  };

  const handleCompleteTask = async (taskId: string, currentlyCompleted: boolean) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !currentlyCompleted } : t
    ));
    
    // Sync with server
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

  // Drag handlers
  const handleTaskMouseDown = (taskId: string, e: React.MouseEvent) => {
    if (viewMode !== 'configure' || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggedTask(taskId);
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTask) return;
    if (mouseDownPos) {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx > 3 || dy > 3) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    } else {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = async (targetSprintId: string | null) => {
    if (!draggedTask) return;
    const task = tasks.find(t => t.id === draggedTask);
    const currentSprintId = task?.sprint_id;
    const targetId = targetSprintId;

    if (currentSprintId !== targetId) {
      setTasks(prev => prev.map(t =>
        t.id === draggedTask ? { ...t, sprint_id: targetId } : t
      ));
      await fetch("/api/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assignTask", taskId: draggedTask, sprintId: targetId, movedBy: "user" }),
      });
      fetchData(); // Refresh data after drag
    }
    setDraggedTask(null);
    setDragPosition(null);
    setMouseDownPos(null);
    setDragOverColumn(null);
  };

  const handleGlobalMouseUp = () => {
    if (draggedTask) {
      setDraggedTask(null);
      setDragPosition(null);
      setMouseDownPos(null);
      setDragOverColumn(null);
    }
  };

  const handleColumnMouseEnter = (columnId: string | null) => {
    if (draggedTask) {
      setDragOverColumn(columnId === null ? 'backlog' : columnId);
    }
  };

  // Highlight handlers
  const handleSetHighlight = async (taskId: string) => {
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setHighlight", taskId }),
    });
    fetchData();
  };

  const handleToggleHighlight = async (taskId: string) => {
    // Optimistic update - immediately toggle locally
    const isCurrentlyHighlighted = highlightTask?.id === taskId;
    
    if (isCurrentlyHighlighted) {
      // Clear highlight locally
      setHighlightTask(null);
      setHighlightCompleted(false);
    } else {
      // Set new highlight locally - find the task
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setHighlightTask(task);
        setHighlightCompleted(task.completed);
      }
    }
    
    // Sync with server in background
    if (isCurrentlyHighlighted) {
      await fetch("/api/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearHighlight" }),
      });
    } else {
      await fetch("/api/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setHighlight", taskId }),
      });
    }
  };

  const handleCompleteHighlight = async () => {
    // Optimistic update
    setHighlightCompleted(!highlightCompleted);
    
    // Sync with server
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "completeHighlight" }),
    });
    fetchData();
  };

  const handleClearHighlight = async () => {
    // Optimistic update
    setHighlightTask(null);
    setHighlightCompleted(false);
    
    // Sync with server
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clearHighlight" }),
    });
  };

  const handleDailyReset = async () => {
    const res = await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dailyReset" }),
    });
    const data = await res.json();
    alert(`Daily reset complete! ${data.resetCount} tasks moved to backlog.`);
    fetchData();
  };

  const currentIsPast4PM = test4PM || isPast4PM();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-zinc-900 text-zinc-100 ${focusMode ? 'overflow-hidden' : ''}`}
      onMouseUp={handleGlobalMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <header className="border-b border-zinc-800 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">🏃 Sprint Dashboard</h1>
            <div className="flex bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => { setViewMode('focus'); fetchData(); }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'focus' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Focus
              </button>
              <button
                onClick={() => setViewMode('configure')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'configure' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Configure
              </button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm font-mono">
              <span className="text-zinc-400">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              <span className="text-zinc-600 ml-1 text-xs">ET</span>
            </div>
            <button
              onClick={() => setTest4PM(!test4PM)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                test4PM ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🧪 4PM
            </button>
            <button
              onClick={handleDailyReset}
              className="px-3 py-1.5 rounded-lg font-medium text-sm bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              title="Test daily reset - move incomplete sprint tasks to backlog"
            >
              🔄 Reset
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 text-sm"
            >
              {syncing ? "Syncing..." : "🔄 Sync"}
            </button>
            {viewMode === 'focus' && (
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                  focusMode ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {focusMode ? "Exit Focus" : "Enter Focus"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3">
        <div className="h-full">
          {/* 4PM Toast */}
          {/* CONFIGURE VIEW */}
          {viewMode === 'configure' && !focusMode && (
            <>
              {/* Daily Highlight Banner */}
              <div className="mb-4">
                <h2 className="text-base font-semibold mb-3">🎯 Today&apos;s Highlight</h2>
                <HighlightBanner
                  highlightTask={highlightTask}
                  highlightCompleted={highlightCompleted}
                  isPast4PM={currentIsPast4PM}
                  onComplete={handleCompleteHighlight}
                  onClear={handleClearHighlight}
                />
              </div>

              {/* Columns */}
              <div className="flex gap-3 h-[calc(100vh-280px)]">
                <Column
                  title="Backlog"
                  icon="📥"
                  tasks={backlogTasks}
                  completedTasks={completedTasks.filter(t => !t.sprint_id)}
                  highlightTaskId={highlightTask?.id}
                  onCompleteTask={handleCompleteTask}
                  onToggleHighlight={handleToggleHighlight}
                  onDragStart={handleTaskMouseDown}
                  onDragOver={handleColumnMouseEnter}
                  onDrop={handleMouseUp}
                  dragOverColumn={dragOverColumn}
                  sprintId={null}
                  draggable={viewMode === 'configure'}
                />
                {sprints.map(sprint => (
                  <Column
                    key={sprint.id}
                    title={`Sprint ${sprint.sprint_number}`}
                    icon="🎯"
                    tasks={getSprintTasks(sprint.sprint_number)}
                    completedTasks={getCompletedTasks(sprint.sprint_number)}
                    highlightTaskId={highlightTask?.id}
                    onCompleteTask={handleCompleteTask}
                    onToggleHighlight={handleToggleHighlight}
                    onDragStart={handleTaskMouseDown}
                    onDragOver={handleColumnMouseEnter}
                    onDrop={handleMouseUp}
                    dragOverColumn={dragOverColumn}
                    sprintId={sprint.id}
                    draggable={viewMode === 'configure'}
                  />
                ))}
              </div>
            </>
          )}

          {/* FOCUS VIEW */}
          {viewMode === 'focus' && (
            <div className="max-w-3xl mx-auto">
              {/* Energy Check-in */}
              {!focusMode && (
                <section className="mb-6">
                  <h2 className="text-base font-semibold mb-3">⚡ How&apos;s your energy?</h2>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleEnergySelect(level)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize text-sm transition-all ${
                          energyLevel === level
                            ? level === "low" ? "bg-red-500 text-white"
                              : level === "medium" ? "bg-yellow-500 text-black"
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

              {/* Daily Highlight */}
              {!focusMode && (
                <section className="mb-6">
                  <h2 className="text-base font-semibold mb-3">🎯 Today&apos;s Highlight</h2>
                  <HighlightBanner
                    highlightTask={highlightTask}
                    highlightCompleted={highlightCompleted}
                    isPast4PM={currentIsPast4PM}
                    onComplete={handleCompleteHighlight}
                    onClear={handleClearHighlight}
                  />
                </section>
              )}

              {/* Current Sprint Tasks */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base font-semibold">🏃 Sprint</span>
                  <div className="flex bg-zinc-800 rounded-lg p-1">
                    {sprints.map(sprint => (
                      <button
                        key={sprint.id}
                        onClick={() => setCurrentSprint(sprint.sprint_number)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentSprint === sprint.sprint_number
                            ? 'bg-zinc-700 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sprint.sprint_number}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
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
                  {currentSprintTasks.length === 0 && completedTasks.length === 0 ? (
                    <p className="p-6 text-zinc-500 text-center">No tasks in this sprint</p>
                  ) : (
                    <ul className="divide-y divide-zinc-700/50">
                      {currentSprintTasks.map((task) => (
                        <li key={task.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleCompleteTask(task.id, task.completed)}
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

                      {showCompleted && currentSprintCompleted.map((task) => (
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
                <section className="mt-6">
                  <h2 className="text-base font-semibold mb-3">📊 Today&apos;s Overview</h2>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <p className="text-2xl font-bold text-red-400">{taskStats.urgent}</p>
                      <p className="text-xs text-zinc-500">Urgent</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <p className="text-2xl font-bold text-yellow-400">{taskStats.admin}</p>
                      <p className="text-xs text-zinc-500">Admin</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <p className="text-2xl font-bold text-blue-400">{taskStats.creative}</p>
                      <p className="text-xs text-zinc-500">Creative</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <p className="text-2xl font-bold text-purple-400">{taskStats.deadline}</p>
                      <p className="text-xs text-zinc-500">Deadline</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Focus Mode Overlay */}
      {focusMode && viewMode === 'focus' && (
        <div className="fixed inset-0 bg-zinc-900 z-50 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-zinc-400 font-medium">🎯 Sprint {currentSprint}</span>
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
              {currentSprintTasks.map((task) => (
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

      {/* Floating drag preview */}
      {draggedTask && dragPosition && (() => {
        const task = tasks.find(t => t.id === draggedTask);
        if (!task) return null;
        return (
          <div
            className="fixed pointer-events-none z-50"
            style={{ left: dragPosition.x + 10, top: dragPosition.y + 10 }}
          >
            <div className="p-3 bg-zinc-800/95 rounded-lg border border-green-500 shadow-2xl max-w-xs">
              <div className="flex items-start gap-2">
                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  task.completed ? "border-green-500 bg-green-500" : "border-zinc-600"
                }`}>
                  {task.completed && <span className="text-black text-xs">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${task.completed ? 'line-through text-zinc-500' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs rounded ${categoryColors[task.category]}`}>
                      {task.category}
                    </span>
                    {task.time_estimate_minutes && (
                      <span className="text-xs text-zinc-500">⏱️ {formatTime(task.time_estimate_minutes)}</span>
                    )}
                    {task.deadline && (
                      <span className="text-xs text-purple-400">📅 {new Date(task.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
