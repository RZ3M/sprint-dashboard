"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkLog } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, categoryColors, formatTime } from "@/lib/utils";
import { Clock, CheckCircle2, Zap, FileText } from "lucide-react";

interface WorkLogListProps {
  energyLevel: "low" | "medium" | "high";
  refreshTrigger?: number;
}

export function WorkLogList({ energyLevel, refreshTrigger = 0 }: WorkLogListProps) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getWorkLogs" }),
      });
      const data = await res.json();
      if (data.workLogs) {
        setWorkLogs(data.workLogs);
      }
    } catch (error) {
      console.error("Failed to fetch work logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs, refreshTrigger]);

  const getTimeString = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const getTotalMinutes = () => {
    return workLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Work Log
          </h2>
        </div>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Work Log
        </h2>
        {workLogs.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {formatTime(getTotalMinutes())} total
          </span>
        )}
      </div>

      {workLogs.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            No work logged today yet
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {workLogs.map((log) => (
            <Card key={log.id} className="p-3">
              <CardContent className="p-0 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.task_title ? (
                      <span className="text-sm font-medium truncate">{log.task_title}</span>
                    ) : log.notes ? (
                      <span className="text-sm font-medium truncate flex items-center gap-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        {log.notes}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Manual entry</span>
                    )}
                    {log.sprint_category && (
                      <Badge
                        variant="secondary"
                        className={cn("text-xs px-1.5 py-0 h-4", categoryColors[log.sprint_category])}
                      >
                        {log.sprint_category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {log.duration_minutes}m
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {log.energy_level}
                    </span>
                    <span>{getTimeString(log.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
