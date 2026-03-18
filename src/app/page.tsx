"use client";

import { useState, useEffect } from "react";
import { Task, Sprint, ViewMode, EnergyLevel, SprintAPIResponse } from "../components/types";
import { TaskCard } from "../components/TaskCard";
import { HighlightBanner } from "../components/HighlightBanner";
import { Column } from "../components/Column";
import { SprintTimer } from "../components/SprintTimer";
import { WorkLogList } from "../components/WorkLogList";
import { HardStop } from "../components/HardStop";
import {
  getTorontoDateString,
  formatTime,
  isPast4PM,
  isPast9PM,
  isSnoozedUntil,
  getTorontoDate,
  categoryColors,
  TIMER_DURATION_MINUTES,
  loadTimerState,
} from "../lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, RotateCcw, RefreshCw, FlaskConical, Zap, Target, BarChart3, Star, Circle, Check, X, Moon } from "lucide-react";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("medium");
  const [taskStats, setTaskStats] = useState({ urgent: 0, admin: 0, creative: 0, deadline: 0 });
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("focus");
  const [currentSprint, setCurrentSprint] = useState<number>(1);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightTask, setHighlightTask] = useState<Task | null>(null);
  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [test4PM, setTest4PM] = useState(false);
  const [test9PM, setTest9PM] = useState(false);
  const [workLogRefresh, setWorkLogRefresh] = useState(0);
  const [showHardStop, setShowHardStop] = useState(false);
  const [timerElapsedMinutes, setTimerElapsedMinutes] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Check hard stop
  useEffect(() => {
    const checkHardStop = () => {
      const past9 = test9PM || isPast9PM();
      const snoozed = isSnoozedUntil();
      setShowHardStop(past9 && !snoozed);
    };
    checkHardStop();
    const interval = setInterval(checkHardStop, 60000);
    return () => clearInterval(interval);
  }, [test9PM]);

  // Derived state
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const backlogTasks = activeTasks.filter((t) => !t.sprint_id);
  const currentSprintData = sprints.find((s) => s.sprint_number === currentSprint);
  const currentSprintTasks = activeTasks.filter((t) => t.sprint_id === currentSprintData?.id);
  const currentSprintCompleted = tasks.filter((t) => t.completed && t.sprint_id === currentSprintData?.id);
  const completedCount = currentSprintCompleted.length;

  const getSprintTasks = (sprintNumber: number) => {
    const sprint = sprints.find((s) => s.sprint_number === sprintNumber);
    return activeTasks.filter((t) => t.sprint_id === sprint?.id);
  };

  const getCompletedTasks = (sprintNumber: number) => {
    const sprint = sprints.find((s) => s.sprint_number === sprintNumber);
    return tasks.filter((t) => t.completed && t.sprint_id === sprint?.id);
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
      const data = (await res.json()) as SprintAPIResponse;
      if (data.tasks || data.completed || data.sprints) {
        setTasks([...(data.tasks || []), ...(data.completed || [])]);
        setSprints(data.sprints || []);
        if (data.energyLevel) setEnergyLevel(data.energyLevel);
        if (data.highlightTask) setHighlightTask(data.highlightTask);
        if (typeof data.highlightCompleted === "boolean") setHighlightCompleted(data.highlightCompleted);
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
    const task = tasks.find(t => t.id === taskId);
    const isCompleting = !currentlyCompleted;

    if (isCompleting) {
      const timerState = loadTimerState();
      let duration = 0;
      if (timerState && timerState.isRunning && timerState.sprintId === task?.sprint_id) {
        const elapsed = Math.floor((Date.now() - (timerState.startedAt || Date.now())) / 60000);
        duration = Math.max(0, elapsed);
      }
      setTimerElapsedMinutes(prev => prev + duration);
      setIsTimerRunning(false);

      await fetch("/api/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "logWork",
          taskId,
          sprintCategory: task?.category || null,
          durationMinutes: duration,
          energyLevel: energyLevel,
          notes: "",
        }),
      });
      setWorkLogRefresh(prev => prev + 1);
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !currentlyCompleted } : t)));
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: currentlyCompleted ? "uncompleteTask" : "completeTask",
        taskId,
      }),
    });
    fetchData();
  };

  // Drag handlers
  const handleTaskMouseDown = (taskId: string, e: React.MouseEvent) => {
    if (viewMode !== "configure" || e.button !== 0) return;
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
    const task = tasks.find((t) => t.id === draggedTask);
    const currentSprintId = task?.sprint_id;

    if (currentSprintId !== targetSprintId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === draggedTask ? { ...t, sprint_id: targetSprintId } : t))
      );
      await fetch("/api/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignTask",
          taskId: draggedTask,
          sprintId: targetSprintId,
          movedBy: "user",
        }),
      });
      fetchData();
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
      setDragOverColumn(columnId === null ? "backlog" : columnId);
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
    const isCurrentlyHighlighted = highlightTask?.id === taskId;

    if (isCurrentlyHighlighted) {
      setHighlightTask(null);
      setHighlightCompleted(false);
    } else {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setHighlightTask(task);
        setHighlightCompleted(task.completed);
      }
    }

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
    setHighlightCompleted(!highlightCompleted);
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "completeHighlight" }),
    });
    fetchData();
  };

  const handleClearHighlight = async () => {
    setHighlightTask(null);
    setHighlightCompleted(false);
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

  const handleTimerComplete = async (durationMinutes: number) => {
    setTimerElapsedMinutes(prev => prev + durationMinutes);
    setIsTimerRunning(false);
    const sprintCategory = currentSprintData ? 
      (tasks.find(t => t.sprint_id === currentSprintData.id && !t.completed)?.category || null) : null;
    
    await fetch("/api/sprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "logWork",
        taskId: null,
        sprintCategory,
        durationMinutes,
        energyLevel: energyLevel,
        notes: "Sprint timer complete",
      }),
    });
    setWorkLogRefresh(prev => prev + 1);
  };

  const currentIsPast4PM = test4PM || isPast4PM();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (showHardStop) {
    const todayCompletedTasks = tasks.filter(t => t.completed && t.sprint_id && sprints.find(s => s.id === t.sprint_id));
    return (
      <HardStop
        tasksCompleted={todayCompletedTasks.length}
        totalTimeLogged={timerElapsedMinutes}
        energyLevelsUsed={[energyLevel]}
      />
    );
  }

  return (
    <div
      className={cn("min-h-screen bg-background text-foreground", focusMode && "overflow-hidden")}
      onMouseUp={handleGlobalMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <header className="border-b border-border h-12 px-4 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Left: Logo + view toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm tracking-tight">Sprint</span>
            </div>

            <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => { setViewMode("focus"); fetchData(); }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  viewMode === "focus"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Focus
              </button>
              <button
                onClick={() => setViewMode("configure")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  viewMode === "configure"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Configure
              </button>
            </div>
          </div>

          {/* Right: Clock + actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/50 px-2.5 py-1 rounded-md">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
              <span className="text-muted-foreground/50 text-[10px]">ET</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTest4PM(!test4PM)}
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5",
                test4PM
                  ? "text-red-400 bg-red-500/10 hover:bg-red-500/15"
                  : "text-muted-foreground"
              )}
            >
              <FlaskConical className="w-3 h-3" />
              4PM
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTest9PM(!test9PM)}
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5",
                test9PM
                  ? "text-violet-400 bg-violet-500/10 hover:bg-violet-500/15"
                  : "text-muted-foreground"
              )}
            >
              <Moon className="w-3 h-3" />
              9PM
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDailyReset}
              className="h-7 px-2.5 text-xs text-muted-foreground gap-1.5"
              title="Move incomplete sprint tasks to backlog"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="h-7 px-2.5 text-xs text-muted-foreground gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
              {syncing ? "Syncing" : "Sync"}
            </Button>

            {viewMode === "focus" && (
              <Button
                variant={focusMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="h-7 px-2.5 text-xs"
              >
                {focusMode ? "Exit Focus" : "Focus Mode"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="p-4">
        {/* CONFIGURE VIEW */}
        {viewMode === "configure" && !focusMode && (
          <div className="max-w-[1400px] mx-auto">
            {/* Highlight banner */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today&apos;s Highlight
                </h2>
              </div>
              <HighlightBanner
                highlightTask={highlightTask}
                highlightCompleted={highlightCompleted}
                isPast4PM={currentIsPast4PM}
                onComplete={handleCompleteHighlight}
                onClear={handleClearHighlight}
              />
            </div>

            {/* Columns */}
            <div className="flex gap-3 h-[calc(100vh-230px)]">
              <Column
                title="Backlog"
                icon=""
                tasks={backlogTasks}
                completedTasks={completedTasks.filter((t) => !t.sprint_id)}
                highlightTaskId={highlightTask?.id}
                onCompleteTask={handleCompleteTask}
                onToggleHighlight={handleToggleHighlight}
                onDragStart={handleTaskMouseDown}
                onDragOver={handleColumnMouseEnter}
                onDrop={handleMouseUp}
                dragOverColumn={dragOverColumn}
                sprintId={null}
                draggable={viewMode === "configure"}
              />
              {sprints.map((sprint) => (
                <Column
                  key={sprint.id}
                  title={`Sprint ${sprint.sprint_number}`}
                  icon=""
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
                  draggable={viewMode === "configure"}
                />
              ))}
            </div>
          </div>
        )}

        {/* FOCUS VIEW */}
        {viewMode === "focus" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Sprint Timer */}
            {!focusMode && (
              <SprintTimer
                sprintId={currentSprintData?.id || null}
                onComplete={handleTimerComplete}
              />
            )}

            {/* Energy selector */}
            {!focusMode && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Energy level
                  </h2>
                </div>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleEnergySelect(level)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all border",
                        energyLevel === level
                          ? level === "low"
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : level === "medium"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full mr-2",
                        level === "low" ? "bg-red-400" : level === "medium" ? "bg-amber-400" : "bg-emerald-400"
                      )} />
                      {level}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Daily Highlight */}
            {!focusMode && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Today&apos;s Highlight
                  </h2>
                </div>
                <HighlightBanner
                  highlightTask={highlightTask}
                  highlightCompleted={highlightCompleted}
                  isPast4PM={currentIsPast4PM}
                  onComplete={handleCompleteHighlight}
                  onClear={handleClearHighlight}
                />
              </section>
            )}

            {/* Sprint tasks */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sprint
                </h2>

                {/* Sprint tabs */}
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  {sprints.map((sprint) => (
                    <button
                      key={sprint.id}
                      onClick={() => setCurrentSprint(sprint.sprint_number)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-md text-xs font-medium transition-all",
                        currentSprint === sprint.sprint_number
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {sprint.sprint_number}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className={cn(
                    "ml-auto px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                    showCompleted
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground/30"
                  )}
                >
                  Done ({completedCount})
                </button>
              </div>

              {/* Task list */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {currentSprintTasks.length === 0 && !showCompleted ? (
                  <p className="p-8 text-muted-foreground text-sm text-center">No tasks in this sprint</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {currentSprintTasks.map((task) => (
                      <li
                        key={task.id}
                        className="px-4 py-3 flex items-start gap-3 hover:bg-accent/30 transition-colors group"
                      >
                        <button
                          onClick={() => handleCompleteTask(task.id, task.completed)}
                          className="mt-0.5 w-4 h-4 rounded-full border border-muted-foreground/40 hover:border-emerald-500 flex-shrink-0 flex items-center justify-center transition-all"
                        >
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                          )}
                          {task.deadline && (
                            <p className="text-xs text-violet-400 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.deadline).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs px-1.5 py-0 h-4",
                              categoryBadgeColors[task.category]
                            )}
                          >
                            {task.category}
                          </Badge>
                          {task.time_estimate_minutes && (
                            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(task.time_estimate_minutes)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}

                    {showCompleted &&
                      currentSprintCompleted.map((task) => (
                        <li
                          key={task.id}
                          className="px-4 py-3 flex items-start gap-3 bg-muted/20 transition-colors"
                        >
                          <button
                            onClick={() => handleCompleteTask(task.id, task.completed)}
                            className="mt-0.5 w-4 h-4 rounded-full border border-emerald-500 bg-emerald-500 flex-shrink-0 flex items-center justify-center"
                          >
                            <svg className="w-2.5 h-2.5 text-background" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-through text-muted-foreground">
                              {task.title}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs px-1.5 py-0 h-4 opacity-50",
                              categoryBadgeColors[task.category]
                            )}
                          >
                            {task.category}
                          </Badge>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Stats */}
            {!focusMode && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Overview
                  </h2>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "urgent", label: "Urgent", color: "text-red-400" },
                    { key: "admin", label: "Admin", color: "text-amber-400" },
                    { key: "creative", label: "Creative", color: "text-blue-400" },
                    { key: "deadline", label: "Deadline", color: "text-violet-400" },
                  ].map(({ key, label, color }) => (
                    <div
                      key={key}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <p className={cn("text-2xl font-bold tabular-nums", color)}>
                        {taskStats[key as keyof typeof taskStats]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Work Log */}
            {!focusMode && (
              <WorkLogList
                energyLevel={energyLevel}
                refreshTrigger={workLogRefresh}
              />
            )}
          </div>
        )}
      </main>

      {/* Focus Mode Overlay */}
      {focusMode && viewMode === "focus" && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="h-12 px-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sprint {currentSprint}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {energyLevel === "high" ? "High energy" : energyLevel === "medium" ? "Medium energy" : "Low energy"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <SprintTimer
                sprintId={currentSprintData?.id || null}
                onComplete={handleTimerComplete}
                compact
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFocusMode(false)}
                className="h-7 px-3 text-xs gap-1.5"
              >
                <X className="w-3 h-3" />
                Exit
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            <ul className="max-w-xl mx-auto space-y-2">
              {currentSprintTasks.map((task) => (
                <li
                  key={task.id}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
                >
                  <Circle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                  <span className="text-base font-medium flex-1">{task.title}</span>
                  {task.time_estimate_minutes && (
                    <span className="text-sm text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(task.time_estimate_minutes)}
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn("text-xs px-1.5 py-0 h-4", categoryBadgeColors[task.category])}
                  >
                    {task.category}
                  </Badge>
                </li>
              ))}
              {currentSprintTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-16">No tasks in this sprint</p>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Floating drag preview */}
      {draggedTask &&
        dragPosition &&
        (() => {
          const task = tasks.find((t) => t.id === draggedTask);
          if (!task) return null;
          return (
            <div
              className="fixed pointer-events-none z-50"
              style={{ left: dragPosition.x + 12, top: dragPosition.y + 12 }}
            >
              <div className="p-3 bg-card rounded-xl border border-emerald-500/50 shadow-2xl shadow-black/50 max-w-xs backdrop-blur-sm">
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "mt-0.5 w-4 h-4 rounded-full border flex-shrink-0",
                      task.completed ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs px-1.5 py-0 h-4", categoryBadgeColors[task.category])}
                      >
                        {task.category}
                      </Badge>
                      {task.time_estimate_minutes && (
                        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(task.time_estimate_minutes)}
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
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

const categoryBadgeColors: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400 hover:bg-red-500/15",
  admin: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/15",
  creative: "bg-blue-500/15 text-blue-400 hover:bg-blue-500/15",
  deadline: "bg-violet-500/15 text-violet-400 hover:bg-violet-500/15",
};
