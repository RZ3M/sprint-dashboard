"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime, snoozeHardStop } from "@/lib/utils";
import { Moon, CheckCircle2, Clock, Zap, Coffee } from "lucide-react";

interface HardStopProps {
  tasksCompleted: number;
  totalTimeLogged: number;
  energyLevelsUsed: string[];
}

export function HardStop({ tasksCompleted, totalTimeLogged, energyLevelsUsed }: HardStopProps) {
  const [snoozed, setSnoozed] = useState(false);
  const [willShowSummary, setWillShowSummary] = useState(false);

  useEffect(() => {
    setWillShowSummary(true);
  }, []);

  const handleSnooze = useCallback(() => {
    snoozeHardStop();
    setSnoozed(true);
  }, []);

  const uniqueEnergyLevels = [...new Set(energyLevelsUsed)];

  const getEnergyIcon = (level: string) => {
    return <Zap className={cn("w-3 h-3", level === "high" ? "text-emerald-400" : level === "medium" ? "text-amber-400" : "text-red-400")} />;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20">
            <Moon className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Day is Over</h1>
          <p className="text-muted-foreground">
            Good work today. Rest up for tomorrow.
          </p>
        </div>

        {willShowSummary && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Today&apos;s Summary
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{tasksCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tasks Completed</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{formatTime(totalTimeLogged)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Time Logged</p>
                </div>
              </div>

              {uniqueEnergyLevels.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">Energy levels:</span>
                  <div className="flex items-center gap-1">
                    {uniqueEnergyLevels.map((level) => (
                      <Badge key={level} variant="secondary" className="gap-1">
                        {getEnergyIcon(level)}
                        <span className="capitalize">{level}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Coffee className="w-4 h-4" />
            <p>Task management is locked until tomorrow.</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-10"
          onClick={handleSnooze}
        >
          <Clock className="w-4 h-4 mr-2" />
          Snooze for 30 minutes
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Snooze gives you 30 more minutes before the day locks again.
        </p>
      </div>
    </div>
  );
}
