"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Settings,
  BarChart3,
  Coffee,
  Target,
  Volume2,
  VolumeX,
  SkipForward,
  Bell,
  BellOff,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

interface PomodoroStats {
  completedSessions: number;
  totalWorkMinutes: number;
  todaySessions: number;
  todayMinutes: number;
  lastSessionDate: string;
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  notificationsEnabled: false,
};

const defaultStats: PomodoroStats = {
  completedSessions: 0,
  totalWorkMinutes: 0,
  todaySessions: 0,
  todayMinutes: 0,
  lastSessionDate: "",
};

const modeLabels: Record<TimerMode, string> = {
  work: "Travail",
  shortBreak: "Pause courte",
  longBreak: "Pause longue",
};

const modeColors: Record<TimerMode, string> = {
  work: "text-red-500",
  shortBreak: "text-green-500",
  longBreak: "text-blue-500",
};

export default function PomodoroTimerPage() {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [stats, setStats] = useState<PomodoroStats>(defaultStats);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { permission, isSupported, requestPermission, sendNotification } = useNotifications();

  // Load settings and stats from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("pomodoro-settings");
    const savedStats = localStorage.getItem("pomodoro-stats");

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTimeLeft(parsed.workDuration * 60);
    }

    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      const today = new Date().toDateString();
      if (parsed.lastSessionDate !== today) {
        parsed.todaySessions = 0;
        parsed.todayMinutes = 0;
      }
      setStats(parsed);
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem("pomodoro-settings", JSON.stringify(settings));
  }, [settings]);

  // Save stats
  useEffect(() => {
    localStorage.setItem("pomodoro-stats", JSON.stringify(stats));
  }, [stats]);

  const getDurationForMode = (m: TimerMode): number => {
    switch (m) {
      case "work":
        return settings.workDuration * 60;
      case "shortBreak":
        return settings.shortBreakDuration * 60;
      case "longBreak":
        return settings.longBreakDuration * 60;
    }
  };

  const playSound = useCallback(() => {
    if (settings.soundEnabled) {
      const audio = new Audio("/song/bip.wav");
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Fallback si le fichier audio ne peut pas être joué
        console.log("Impossible de jouer le son de notification");
      });
    }
  }, [settings.soundEnabled]);

  const sendTimerNotification = useCallback((nextMode: TimerMode) => {
    if (!settings.notificationsEnabled || permission !== "granted") return;

    const messages: Record<TimerMode, { title: string; body: string }> = {
      work: {
        title: "Pause terminée !",
        body: "C'est l'heure de reprendre le travail.",
      },
      shortBreak: {
        title: "Session terminée !",
        body: "Bravo ! Prenez une courte pause.",
      },
      longBreak: {
        title: "Cycle terminé !",
        body: "Excellent travail ! Prenez une longue pause bien méritée.",
      },
    };

    const { title, body } = messages[nextMode];
    sendNotification(title, { body });
  }, [settings.notificationsEnabled, permission, sendNotification]);

  const handleModeComplete = useCallback(() => {
    playSound();
    setIsRunning(false);

    if (mode === "work") {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);

      // Update stats
      const today = new Date().toDateString();
      setStats((prev) => ({
        completedSessions: prev.completedSessions + 1,
        totalWorkMinutes: prev.totalWorkMinutes + settings.workDuration,
        todaySessions: prev.lastSessionDate === today ? prev.todaySessions + 1 : 1,
        todayMinutes: prev.lastSessionDate === today ? prev.todayMinutes + settings.workDuration : settings.workDuration,
        lastSessionDate: today,
      }));

      // Determine next break type
      if (newSessionCount % settings.sessionsBeforeLongBreak === 0) {
        setMode("longBreak");
        setTimeLeft(settings.longBreakDuration * 60);
        sendTimerNotification("longBreak");
        if (settings.autoStartBreaks) setIsRunning(true);
      } else {
        setMode("shortBreak");
        setTimeLeft(settings.shortBreakDuration * 60);
        sendTimerNotification("shortBreak");
        if (settings.autoStartBreaks) setIsRunning(true);
      }
    } else {
      setMode("work");
      setTimeLeft(settings.workDuration * 60);
      sendTimerNotification("work");
      if (settings.autoStartWork) setIsRunning(true);
    }
  }, [mode, sessionCount, settings, playSound, sendTimerNotification]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleModeComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleModeComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
  };

  const skipToNext = () => {
    handleModeComplete();
  };

  const changeMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = 1 - timeLeft / getDurationForMode(mode);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-lg font-semibold">Pomodoro Timer</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mode selector */}
          <div className="flex justify-center gap-2">
            {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {m === "work" && <Target className="mr-1 inline h-4 w-4" />}
                {m === "shortBreak" && <Coffee className="mr-1 inline h-4 w-4" />}
                {m === "longBreak" && <Coffee className="mr-1 inline h-4 w-4" />}
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {/* Timer display */}
          <div className="relative flex justify-center">
            <div className="relative">
              {/* Progress ring */}
              <svg className="h-64 w-64 -rotate-90 transform">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
                  className={modeColors[mode]}
                  strokeLinecap="round"
                />
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold tabular-nums">
                  {formatTime(timeLeft)}
                </span>
                <span className="mt-2 text-sm text-muted-foreground">
                  Session {sessionCount + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={resetTimer}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border hover:bg-accent"
              title="Réinitialiser"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={toggleTimer}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isRunning ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </button>

            <button
              onClick={skipToNext}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border hover:bg-accent"
              title="Passer"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Session indicator */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < sessionCount % settings.sessionsBeforeLongBreak
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Paramètres</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 flex justify-between text-sm">
                  <span>Durée de travail</span>
                  <span className="text-muted-foreground">{settings.workDuration} min</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={settings.workDuration}
                  onChange={(e) => setSettings((prev) => ({ ...prev, workDuration: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-2 flex justify-between text-sm">
                  <span>Pause courte</span>
                  <span className="text-muted-foreground">{settings.shortBreakDuration} min</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings((prev) => ({ ...prev, shortBreakDuration: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-2 flex justify-between text-sm">
                  <span>Pause longue</span>
                  <span className="text-muted-foreground">{settings.longBreakDuration} min</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={30}
                  step={5}
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings((prev) => ({ ...prev, longBreakDuration: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-2 flex justify-between text-sm">
                  <span>Sessions avant pause longue</span>
                  <span className="text-muted-foreground">{settings.sessionsBeforeLongBreak}</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={settings.sessionsBeforeLongBreak}
                  onChange={(e) => setSettings((prev) => ({ ...prev, sessionsBeforeLongBreak: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => setSettings((prev) => ({ ...prev, autoStartBreaks: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Démarrer les pauses automatiquement</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.autoStartWork}
                    onChange={(e) => setSettings((prev) => ({ ...prev, autoStartWork: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Démarrer le travail automatiquement</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {settings.soundEnabled ? <Volume2 className="mr-1 inline h-4 w-4" /> : <VolumeX className="mr-1 inline h-4 w-4" />}
                    Son activé
                  </span>
                </label>

                {/* Notifications */}
                {isSupported && (
                  <div className="flex items-center gap-2">
                    {permission === "granted" ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notificationsEnabled}
                          onChange={(e) => setSettings((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {settings.notificationsEnabled ? <Bell className="mr-1 inline h-4 w-4" /> : <BellOff className="mr-1 inline h-4 w-4" />}
                          Notifications activées
                        </span>
                      </label>
                    ) : permission === "denied" ? (
                      <span className="text-sm text-muted-foreground">
                        <BellOff className="mr-1 inline h-4 w-4" />
                        Notifications bloquées (modifiez les paramètres du navigateur)
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          const granted = await requestPermission();
                          if (granted) {
                            setSettings((prev) => ({ ...prev, notificationsEnabled: true }));
                          }
                        }}
                        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
                      >
                        <Bell className="h-4 w-4" />
                        Activer les notifications
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Stats modal */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Statistiques</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.todaySessions}</p>
                <p className="text-sm text-muted-foreground">Sessions aujourd'hui</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.todayMinutes}</p>
                <p className="text-sm text-muted-foreground">Minutes aujourd'hui</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-3xl font-bold">{stats.completedSessions}</p>
                <p className="text-sm text-muted-foreground">Sessions totales</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-3xl font-bold">{Math.round(stats.totalWorkMinutes / 60)}h</p>
                <p className="text-sm text-muted-foreground">Heures totales</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm("Réinitialiser les statistiques ?")) {
                  setStats(defaultStats);
                }
              }}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Réinitialiser les statistiques
            </button>

            <button
              onClick={() => setShowStats(false)}
              className="mt-4 w-full rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
