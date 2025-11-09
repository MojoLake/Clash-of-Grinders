"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { getLast5DaysTotals, formatDuration } from "@/lib/sessions";
import type { Session, TimerData, DailyTotal } from "@/lib/types";

interface ActivityGraphCardProps {
  sessions: Session[];
}

export function ActivityGraphCard({ sessions }: ActivityGraphCardProps) {
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate daily totals (including current session for today)
  const dailyData = useMemo(() => {
    const baseTotals = getLast5DaysTotals(sessions);
    // Add current session time to today
    if (baseTotals.length > 0 && baseTotals[baseTotals.length - 1].isToday) {
      baseTotals[baseTotals.length - 1] = {
        ...baseTotals[baseTotals.length - 1],
        seconds:
          baseTotals[baseTotals.length - 1].seconds + currentSessionSeconds,
      };
    }
    return baseTotals;
  }, [sessions, currentSessionSeconds]);

  // Real-time update for current session (pattern from TimeRangeCard)
  useEffect(() => {
    const updateCurrentSession = () => {
      const saved = localStorage.getItem("currentSession");
      if (saved) {
        try {
          const data: TimerData = JSON.parse(saved);
          if (data.state === "running" || data.state === "paused") {
            setCurrentSessionSeconds(data.elapsedSeconds);
          } else {
            setCurrentSessionSeconds(0);
          }
        } catch (error) {
          console.error("Failed to parse saved session:", error);
          setCurrentSessionSeconds(0);
        }
      } else {
        setCurrentSessionSeconds(0);
      }
    };

    // Initial load
    updateCurrentSession();

    // Set up interval to update every second
    const interval = setInterval(updateCurrentSession, 1000);

    // Listen for storage events
    window.addEventListener("storage", updateCurrentSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", updateCurrentSession);
    };
  }, []);

  // Canvas drawing logic
  useEffect(() => {
    if (!canvasRef.current || dailyData.length === 0) return;
    drawGraph(canvasRef.current, dailyData, hoveredDay);
  }, [dailyData, hoveredDay]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !containerRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const xStep = rect.width / (dailyData.length - 1);

      // Find closest day
      let closestDay = Math.round(x / xStep);
      closestDay = Math.max(0, Math.min(dailyData.length - 1, closestDay));

      setHoveredDay(closestDay);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    },
    [dailyData.length]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredDay(null);
  }, []);

  // Calculate peak day
  const peakDay = useMemo(() => {
    if (dailyData.length === 0) return null;
    const peak = dailyData.reduce((max, day) =>
      day.seconds > max.seconds ? day : max
    );
    return peak.seconds > 0 ? peak : null;
  }, [dailyData]);

  // Check if all data is zero
  const hasNoActivity = useMemo(() => {
    return dailyData.every((day) => day.seconds === 0);
  }, [dailyData]);

  return (
    <Card className="p-4">
      <div className="text-sm text-slate-400 mb-3">Last 5 Days</div>

      {/* Canvas for graph */}
      <div ref={containerRef} className="relative h-24 mb-3">
        {hasNoActivity ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            No activity yet
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />

            {/* Tooltip */}
            {hoveredDay !== null && (
              <div
                className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm pointer-events-none"
                style={{
                  left: tooltipPosition.x + 10,
                  top: tooltipPosition.y - 40,
                }}
              >
                <div className="font-medium">
                  {dailyData[hoveredDay].isToday
                    ? "Today"
                    : format(dailyData[hoveredDay].date, "EEEE")}
                </div>
                <div className="text-slate-400">
                  {formatDuration(dailyData[hoveredDay].seconds)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Day labels */}
      <div className="flex justify-between text-xs text-slate-500">
        {dailyData.map((day, i) => (
          <span
            key={i}
            className={day.isToday ? "text-indigo-400 font-medium" : ""}
          >
            {day.isToday ? "Today" : format(day.date, "EEE")}
          </span>
        ))}
      </div>

      {/* Peak day stat */}
      {peakDay && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-500">Peak Day</div>
          <div className="text-sm font-medium">
            {peakDay.isToday ? "Today" : format(peakDay.date, "EEEE")} •{" "}
            {formatDuration(peakDay.seconds)}
          </div>
        </div>
      )}
    </Card>
  );
}

function drawGraph(
  canvas: HTMLCanvasElement,
  data: DailyTotal[],
  hoveredDay: number | null
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set canvas size (handle retina displays)
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Calculate scale
  const maxSeconds = Math.max(...data.map((d) => d.seconds), 3600); // Min 1h for scale
  const padding = 10;
  const yScale = (seconds: number) =>
    rect.height -
    padding -
    (seconds / maxSeconds) * (rect.height - padding * 2);
  const xScale = (index: number) => {
    if (data.length === 1) return rect.width / 2;
    return (rect.width / (data.length - 1)) * index;
  };

  // Draw line
  ctx.beginPath();
  data.forEach((point, i) => {
    const x = xScale(i);
    const y = yScale(point.seconds);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = "#94a3b8"; // slate-400
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw dots
  data.forEach((point, i) => {
    const x = xScale(i);
    const y = yScale(point.seconds);

    ctx.beginPath();
    ctx.arc(x, y, hoveredDay === i ? 5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = point.isToday ? "#6366f1" : "#94a3b8"; // indigo-500 or slate-400
    ctx.fill();

    // Highlight hovered dot
    if (hoveredDay === i) {
      ctx.strokeStyle = "#6366f1"; // indigo-500
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}
