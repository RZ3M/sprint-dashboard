"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIMER_DURATION_MINUTES,
  saveTimerState,
  loadTimerState,
  clearTimerState,
  formatTimerTime,
} from "@/lib/utils";

interface SprintTimerProps {
  sprintId: string | null;
  onComplete?: (durationMinutes: number) => void;
  compact?: boolean;
}

export function SprintTimer({ sprintId, onComplete, compact = false }: SprintTimerProps) {
  const totalSeconds = TIMER_DURATION_MINUTES * 60;

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    const stored = loadTimerState();
    if (stored && stored.sprintId === sprintId) {
      if (stored.isRunning && stored.startedAt) {
        const elapsed = Math.floor((Date.now() - stored.startedAt) / 1000);
        const newRemaining = stored.remainingSeconds - elapsed;
        if (newRemaining > 0) {
          setRemainingSeconds(newRemaining);
          setIsRunning(true);
          setStartedAt(Date.now());
        } else {
          setRemainingSeconds(0);
          setCompleted(true);
          clearTimerState();
        }
      } else {
        setRemainingSeconds(stored.remainingSeconds);
        setIsRunning(false);
        setStartedAt(null);
      }
    } else {
      setRemainingSeconds(totalSeconds);
      setIsRunning(false);
      setStartedAt(null);
      setCompleted(false);
      clearTimerState();
    }
  }, [sprintId, totalSeconds]);

  useEffect(() => {
    if (!isRunning || completed) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setCompleted(true);
          clearTimerState();
          if (!hasShownNotification) {
            setHasShownNotification(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, completed, hasShownNotification]);

  useEffect(() => {
    if (!isRunning || !startedAt || completed) return;

    const saveInterval = setInterval(() => {
      saveTimerState({
        remainingSeconds,
        isRunning: true,
        sprintId,
        startedAt,
      });
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [isRunning, startedAt, remainingSeconds, sprintId, completed]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setStartedAt(Date.now());
    setCompleted(false);
    setHasShownNotification(false);
    saveTimerState({
      remainingSeconds,
      isRunning: true,
      sprintId,
      startedAt: Date.now(),
    });
  }, [remainingSeconds, sprintId]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    saveTimerState({
      remainingSeconds,
      isRunning: false,
      sprintId,
      startedAt: null,
    });
  }, [remainingSeconds, sprintId]);

  const handleResume = useCallback(() => {
    setIsRunning(true);
    setStartedAt(Date.now());
    saveTimerState({
      remainingSeconds,
      isRunning: true,
      sprintId,
      startedAt: Date.now(),
    });
  }, [remainingSeconds, sprintId]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    setStartedAt(null);
    setCompleted(false);
    setHasShownNotification(false);
    clearTimerState();
  }, [totalSeconds]);

  const handleNotification = useCallback(() => {
    if (completed && !hasShownNotification) {
      setHasShownNotification(true);
      if (onComplete) {
        onComplete(TIMER_DURATION_MINUTES);
      }
    }
  }, [completed, hasShownNotification, onComplete]);

  useEffect(() => {
    if (completed) {
      handleNotification();
    }
  }, [completed, handleNotification]);

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  const getNotificationMessage = () => {
    if (remainingSeconds === 0) {
      return "Time's up! Sprint complete.";
    }
    if (remainingSeconds <= 300 && remainingSeconds > 0) {
      return "5 minutes remaining!";
    }
    return null;
  };

  const notification = getNotificationMessage();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Timer className={cn("w-4 h-4", completed ? "text-emerald-400" : "text-muted-foreground")} />
          <span className={cn(
            "font-mono text-sm tabular-nums",
            completed ? "text-emerald-400" : "text-foreground"
          )}>
            {formatTimerTime(remainingSeconds)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isRunning && !completed && remainingSeconds === totalSeconds && (
            <Button size="icon-xs" variant="ghost" onClick={handleStart} className="h-6 w-6">
              <Play className="w-3 h-3" />
            </Button>
          )}
          {isRunning && (
            <Button size="icon-xs" variant="ghost" onClick={handlePause} className="h-6 w-6">
              <Pause className="w-3 h-3" />
            </Button>
          )}
          {!isRunning && !completed && remainingSeconds < totalSeconds && (
            <Button size="icon-xs" variant="ghost" onClick={handleResume} className="h-6 w-6">
              <Play className="w-3 h-3" />
            </Button>
          )}
          {(completed || remainingSeconds < totalSeconds) && (
            <Button size="icon-xs" variant="ghost" onClick={handleReset} className="h-6 w-6">
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>
        {notification && remainingSeconds === 0 && (
          <span className="text-xs text-emerald-400 animate-pulse">{notification}</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className={cn("w-4 h-4", completed ? "text-emerald-400" : "text-muted-foreground")} />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sprint Timer
          </span>
        </div>
        <span className={cn(
          "font-mono text-2xl tabular-nums font-bold",
          completed ? "text-emerald-400" : remainingSeconds <= 300 ? "text-amber-400" : "text-foreground"
        )}>
          {formatTimerTime(remainingSeconds)}
        </span>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {completed ? "Complete!" : isRunning ? "Running..." : remainingSeconds < totalSeconds ? "Paused" : "Ready"}
        </span>
        <div className="flex items-center gap-2">
          {!isRunning && !completed && remainingSeconds === totalSeconds && (
            <Button size="sm" variant="outline" onClick={handleStart} className="h-7 px-3 text-xs gap-1.5">
              <Play className="w-3 h-3" />
              Start
            </Button>
          )}
          {isRunning && (
            <Button size="sm" variant="outline" onClick={handlePause} className="h-7 px-3 text-xs gap-1.5">
              <Pause className="w-3 h-3" />
              Pause
            </Button>
          )}
          {!isRunning && !completed && remainingSeconds < totalSeconds && (
            <Button size="sm" variant="outline" onClick={handleResume} className="h-7 px-3 text-xs gap-1.5">
              <Play className="w-3 h-3" />
              Resume
            </Button>
          )}
          {(completed || remainingSeconds < totalSeconds) && (
            <Button size="sm" variant="ghost" onClick={handleReset} className="h-7 px-3 text-xs gap-1.5 text-muted-foreground">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {notification && remainingSeconds === 0 && (
        <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 text-center font-medium animate-pulse">
            {notification}
          </p>
        </div>
      )}

      {remainingSeconds <= 300 && remainingSeconds > 0 && !completed && (
        <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400 text-center font-medium">
            5 minutes remaining
          </p>
        </div>
      )}
    </div>
  );
}
