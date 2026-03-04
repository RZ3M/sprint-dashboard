"use client";

import { useState, useEffect, useCallback } from "react";

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
  sprint_id: string | null;
}

interface Sprint {
  id: string;
  sprint_number: number;
  date: string;
  title: string;
}

type ViewMode = 'configure' | 'focus';

interface DailyLog {
  highlight_task_id: string | null;
  highlight_completed: boolean;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [energyLevel, setEnergyLevel] = useState<"low" | "medium" | "high">("medium");
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [currentSprint, setCurrentSprint] = useState<number>(1);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [highlightTask, setHighlightTask] = useState<Task | null>(null);
  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // 4pm Rule check
  const [show4PMWarning, setShow4PMWarning] = useState(false);
  useEffect(() => {
    const check4PMRule = () => {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
      const hour = now.getHours();
      // Show warning if it's 4pm or later, highlight is set, but not completed
      if (hour >= 16 && highlightTask && !highlightCompleted) {
        setShow4PMWarning(true);
      }
    };
    check4PMRule();
    // Check every minute
    const interval = setInterval(check4PMRule, 60000);
    return () => clearInterval(interval);
  }, [highlightTask, highlightCompleted]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/sprint");
      const data = await res.json();
      if (data.tasks || data.completed || data.sprints) {
        const allTasks = [
          ...(data.tasks || []),
          ...(data.completed || [])
        ];
        setTasks(allTasks);
        setSprints(data.sprints || []);
        if (data.energyLevel) setEnergyLevel(data.energyLevel);
        if (data.highlightTask) setHighlightTask(data.highlightTask);
        if (typeof data.highlightCompleted === 'boolean') setHighlightCompleted(data.highlightCompleted);
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

  const handleSetHighlight = async (taskId: string) => {
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setHighlight", taskId }),
    });
    setShowHighlightPicker(false);
    fetchData();
  };

  const handleCompleteHighlight = async () => {
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "completeHighlight" }),
    });
    fetchData();
  };

  const handleClearHighlight = async () => {
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clearHighlight" }),
    });
    // Clear locally for instant feedback
    setHighlightTask(null);
    setHighlightCompleted(false);
    fetchData();
  };

  const handleDragStart = (taskId: string, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTask(taskId);
    // Force opacity change immediately
    requestAnimationFrame(() => {
      const el = document.getElementById(`task-${taskId}`);
      if (el) el.style.opacity = '0.4';
    });
  };

  const handleDragOver = (e: React.DragEvent, columnId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
    return false;
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (sprintId: string | null) => {
    if (!draggedTask) return;
    
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "assignTask", 
        taskId: draggedTask,
        sprintId: sprintId
      }),
    });
    
    setDraggedTask(null);
    setDragOverColumn(null);
    fetchData();
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Group tasks by sprint
  const backlogTasks = activeTasks.filter(t => !t.sprint_id);
  const getSprintTasks = (sprintNumber: number) => {
    const sprint = sprints.find(s => s.sprint_number === sprintNumber);
    return activeTasks.filter(t => t.sprint_id === sprint?.id);
  };
  const getCompletedTasks = (sprintNumber: number) => {
    const sprint = sprints.find(s => s.sprint_number === sprintNumber);
    return tasks.filter(t => t.completed && t.sprint_id === sprint?.id);
  };
  const currentSprintData = sprints.find(s => s.sprint_number === currentSprint);
  const currentSprintTasks = activeTasks.filter(t => t.sprint_id === currentSprintData?.id);
  const currentSprintCompleted = tasks.filter(t => t.completed && t.sprint_id === currentSprintData?.id);
  const completedCount = currentSprintCompleted.length;

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

  const TaskCard = ({ task, isHighlight = false }: { task: Task; isHighlight?: boolean }) => {
    const isDragging = draggedTask === task.id;
    
    return (
      <div 
        id={`task-${task.id}`}
        draggable={viewMode === 'configure'}
        onDragStart={(e) => handleDragStart(task.id, e)}
        onDragEnd={() => {
          setDraggedTask(null);
          setDragOverColumn(null);
        }}
        className={`p-3 bg-zinc-800/50 rounded-lg border transition-all select-none ${
          isDragging 
            ? 'opacity-40 border-green-500' 
            : isHighlight
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-zinc-700/50 hover:bg-zinc-800'
        } ${viewMode === 'configure' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={() => handleCompleteTask(task.id, task.completed)}
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
              {isHighlight && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded flex-shrink-0">
                  ⭐ Highlight
                </span>
              )}
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
                  ⏱️ {formatTime(task.time_estimate_minutes)}
                </span>
              )}
              {task.deadline && (
                <span className="text-xs text-purple-400">
                  📅 {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
      <header className="border-b border-zinc-800 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">🏃 Sprint Dashboard</h1>
            
            {/* View Toggle */}
            <div className="flex bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('focus')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'focus' 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Focus
              </button>
              <button
                onClick={() => setViewMode('configure')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'configure' 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Configure
              </button>
            </div>
          </div>

          <div className="flex gap-2">
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
                  focusMode 
                    ? "bg-red-500/20 text-red-400 border border-red-500/50" 
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
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
          
          {/* 4PM Rule Warning */}
          {show4PMWarning && !focusMode && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-medium text-red-400">4 PM Rule triggered!</p>
                <p className="text-sm text-zinc-400">
                  Your highlight hasn't been started yet. Time to focus!
                </p>
              </div>
              <button
                onClick={() => setShow4PMWarning(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* CONFIGURE VIEW */}
          {/* Daily Highlight Banner for Configure */}
          {viewMode === 'configure' && highlightTask && !focusMode && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCompleteHighlight}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    highlightCompleted 
                      ? "border-green-500 bg-green-500" 
                      : "border-zinc-600 hover:border-green-500"
                  }`}
                >
                  {highlightCompleted && <span className="text-black text-xs">✓</span>}
                </button>
                <div className="flex-1">
                  <p className="text-xs text-green-400 font-medium">⭐ TODAY'S HIGHLIGHT</p>
                  <p className={`font-medium ${highlightCompleted ? 'line-through text-zinc-500' : ''}`}>
                    {highlightTask.title}
                  </p>
                  {highlightTask.time_estimate_minutes && (
                    <p className="text-sm text-zinc-500">
                      ⏱️ {formatTime(highlightTask.time_estimate_minutes)}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClearHighlight}
                  className="text-zinc-500 hover:text-zinc-300 p-1"
                  title="Clear highlight"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {viewMode === 'configure' && (
            <div className="flex gap-3 h-[calc(100vh-140px)]">
              {/* Backlog Column */}
              <div 
                className={`flex-1 min-w-0 bg-zinc-800/30 rounded-lg p-3 border flex flex-col transition-colors ${
                  dragOverColumn === 'backlog' ? 'border-green-500 bg-green-500/5' : 'border-zinc-700/50'
                }`}
                onDragOver={(e) => handleDragOver(e, 'backlog')}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(null)}
              >
                <h2 className="font-semibold text-zinc-400 mb-3 flex items-center gap-2 flex-shrink-0">
                  📥 Backlog
                  <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full">
                    {backlogTasks.length}
                  </span>
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {backlogTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      isHighlight={highlightTask?.id === task.id}
                    />
                  ))}
                  {backlogTasks.length === 0 && (
                    <p className="text-zinc-500 text-sm text-center py-8">
                      No tasks in backlog
                    </p>
                  )}
                  
                  {/* Completed tasks at bottom of backlog */}
                  {completedTasks.filter(t => !t.sprint_id).length > 0 && (
                    <>
                      <div className="border-t border-zinc-700/50 my-3"></div>
                      <h3 className="text-xs font-semibold text-zinc-500 mb-2">✓ Completed</h3>
                      {completedTasks.filter(t => !t.sprint_id).map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task}
                          isHighlight={highlightTask?.id === task.id}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Sprint Columns */}
              {sprints.map(sprint => (
                <div 
                  key={sprint.id}
                  className={`flex-1 min-w-0 bg-zinc-800/30 rounded-lg p-3 border flex flex-col transition-colors ${
                    dragOverColumn === sprint.id ? 'border-green-500 bg-green-500/5' : 'border-zinc-700/50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, sprint.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(sprint.id)}
                >
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2 flex-shrink-0">
                    🎯 Sprint {sprint.sprint_number}
                    <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full">
                      {getSprintTasks(sprint.sprint_number).length}
                    </span>
                  </h2>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {getSprintTasks(sprint.sprint_number).map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task}
                        isHighlight={highlightTask?.id === task.id}
                      />
                    ))}
                    {getSprintTasks(sprint.sprint_number).length === 0 && (
                      <p className="text-zinc-500 text-sm text-center py-8">
                        Drop tasks here
                      </p>
                    )}
                    
                    {/* Completed tasks at bottom */}
                    {getCompletedTasks(sprint.sprint_number).length > 0 && (
                      <>
                        <div className="border-t border-zinc-700/50 my-3"></div>
                        <h3 className="text-xs font-semibold text-zinc-500 mb-2">✓ Completed</h3>
                        {getCompletedTasks(sprint.sprint_number).map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task}
                            isHighlight={highlightTask?.id === task.id}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FOCUS VIEW */}
          {viewMode === 'focus' && (
            <div className="max-w-3xl mx-auto">
              {/* Energy Check-in */}
              {!focusMode && (
                <section className="mb-6">
                  <h2 className="text-base font-semibold mb-3">⚡ How&apos;s your energy?</h2>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleEnergySelect(level)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize text-sm transition-all ${
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

              {/* Daily Highlight */}
              {!focusMode && (
                <section className="mb-6">
                  <h2 className="text-base font-semibold mb-3">🎯 Today&apos;s Highlight</h2>
                  
                  {highlightTask ? (
                    <div className={`p-4 rounded-lg border ${
                      highlightCompleted 
                        ? 'bg-green-500/10 border-green-500/50' 
                        : 'bg-zinc-800/50 border-zinc-700/50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCompleteHighlight}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            highlightCompleted 
                              ? "border-green-500 bg-green-500" 
                              : "border-zinc-600 hover:border-green-500"
                          }`}
                        >
                          {highlightCompleted && <span className="text-black text-xs">✓</span>}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${highlightCompleted ? 'line-through text-zinc-500' : ''}`}>
                            {highlightTask.title}
                          </p>
                          {highlightTask.time_estimate_minutes && (
                            <p className="text-sm text-zinc-500">
                              ⏱️ {formatTime(highlightTask.time_estimate_minutes)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={handleClearHighlight}
                          className="text-zinc-500 hover:text-zinc-300 p-1"
                          title="Clear highlight"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                        className="w-full p-4 rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors text-left"
                      >
                        + Set your #1 priority for today
                      </button>
                      
                      {showHighlightPicker && (
                        <div className="mt-2 bg-zinc-800/80 rounded-lg border border-zinc-700 max-h-60 overflow-y-auto">
                          {activeTasks.length === 0 ? (
                            <p className="p-4 text-zinc-500 text-sm">No tasks available</p>
                          ) : (
                            activeTasks.map(task => (
                              <button
                                key={task.id}
                                onClick={() => handleSetHighlight(task.id)}
                                className="w-full p-3 text-left hover:bg-zinc-700/50 border-b border-zinc-700/50 last:border-0"
                              >
                                <p className="font-medium text-sm">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded ${categoryColors[task.category]}`}>
                                    {task.category}
                                  </span>
                                  {task.time_estimate_minutes && (
                                    <span className="text-xs text-zinc-500">
                                      ⏱️ {formatTime(task.time_estimate_minutes)}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Current Sprint Tasks */}
              <section>
                {/* Sprint Selector - Right above tasks */}
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
                      <p className="text-2xl font-bold text-red-400">{tasks.filter(t => t.category === 'urgent' && !t.completed).length}</p>
                      <p className="text-xs text-zinc-500">Urgent</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <p className="text-2xl font-bold text-yellow-400">{tasks.filter(t => t.category === 'admin' && !t.completed).length}</p>
                      <p className="text-xs text-zinc-500">Admin</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <p className="text-2xl font-bold text-blue-400">{tasks.filter(t => t.category === 'creative' && !t.completed).length}</p>
                      <p className="text-xs text-zinc-500">Creative</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <p className="text-2xl font-bold text-purple-400">{tasks.filter(t => t.category === 'deadline' && !t.completed).length}</p>
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
    </div>
  );
}
