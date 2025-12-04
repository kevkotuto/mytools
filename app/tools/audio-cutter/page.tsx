"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  Download,
  Scissors,
  Volume2,
  VolumeX,
  RotateCcw,
  Music,
} from "lucide-react";

interface AudioRegion {
  start: number;
  end: number;
}

export default function AudioCutterPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [region, setRegion] = useState<AudioRegion>({ start: 0, end: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"mp3" | "wav" | "ogg">("mp3");
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"start" | "end" | "region" | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const drawWaveform = useCallback((audioBuffer: AudioBuffer) => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const y1 = ((1 + min) / 2) * height;
      const y2 = ((1 + max) / 2) * height;

      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }

    ctx.stroke();
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      alert("Veuillez sélectionner un fichier audio");
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Decode audio for waveform
    const arrayBuffer = await file.arrayBuffer();
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    audioBufferRef.current = audioBuffer;
    setDuration(audioBuffer.duration);
    setRegion({ start: 0, end: audioBuffer.duration });
    drawWaveform(audioBuffer);
  }, [drawWaveform]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = region.start;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    if (time >= region.end) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleWaveformClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, type: "start" | "end") => {
    e.stopPropagation();
    setDragType(type);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragType || !containerRef.current || !duration) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const time = (x / rect.width) * duration;

    setRegion(prev => {
      if (dragType === "start") {
        return { ...prev, start: Math.min(time, prev.end - 0.1) };
      } else {
        return { ...prev, end: Math.max(time, prev.start + 0.1) };
      }
    });
  }, [dragType, duration]);

  const handleMouseUp = useCallback(() => {
    setDragType(null);
  }, []);

  useEffect(() => {
    if (dragType) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragType, handleMouseMove, handleMouseUp]);

  const cutAudio = async () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    setIsProcessing(true);

    try {
      const originalBuffer = audioBufferRef.current;
      const sampleRate = originalBuffer.sampleRate;
      const startSample = Math.floor(region.start * sampleRate);
      const endSample = Math.floor(region.end * sampleRate);
      const length = endSample - startSample;

      const offlineContext = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        length,
        sampleRate
      );

      const newBuffer = offlineContext.createBuffer(
        originalBuffer.numberOfChannels,
        length,
        sampleRate
      );

      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const oldData = originalBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          newData[i] = oldData[startSample + i];
        }
      }

      // Convert to WAV
      const wavBlob = audioBufferToWav(newBuffer);

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cut_audio.${outputFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error cutting audio:", error);
      alert("Erreur lors du découpage audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  const reset = () => {
    setAudioFile(null);
    setAudioUrl("");
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setRegion({ start: 0, end: 0 });
    audioBufferRef.current = null;
  };

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
        <h1 className="text-lg font-semibold">Audio Cutter</h1>
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          {!audioFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Music className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">Déposez un fichier audio</p>
              <p className="mb-4 text-sm text-muted-foreground">
                ou cliquez pour sélectionner
              </p>
              <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                Choisir un fichier
              </label>
              <p className="mt-4 text-xs text-muted-foreground">
                MP3, WAV, OGG, M4A, FLAC supportés
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File info */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Durée: {formatTime(duration)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Changer
                </button>
              </div>

              {/* Waveform */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div
                  ref={containerRef}
                  className="relative h-32 cursor-pointer"
                  onClick={handleWaveformClick}
                >
                  <canvas
                    ref={waveformRef}
                    className="h-full w-full rounded"
                  />

                  {/* Selection region */}
                  {duration > 0 && (
                    <>
                      <div
                        className="absolute top-0 h-full bg-primary/20"
                        style={{
                          left: `${(region.start / duration) * 100}%`,
                          width: `${((region.end - region.start) / duration) * 100}%`,
                        }}
                      />

                      {/* Start handle */}
                      <div
                        className="absolute top-0 h-full w-1 cursor-ew-resize bg-primary"
                        style={{ left: `${(region.start / duration) * 100}%` }}
                        onMouseDown={(e) => handleMouseDown(e, "start")}
                      >
                        <div className="absolute -left-2 top-1/2 h-6 w-5 -translate-y-1/2 rounded bg-primary" />
                      </div>

                      {/* End handle */}
                      <div
                        className="absolute top-0 h-full w-1 cursor-ew-resize bg-primary"
                        style={{ left: `${(region.end / duration) * 100}%` }}
                        onMouseDown={(e) => handleMouseDown(e, "end")}
                      >
                        <div className="absolute -left-2 top-1/2 h-6 w-5 -translate-y-1/2 rounded bg-primary" />
                      </div>

                      {/* Playhead */}
                      <div
                        className="absolute top-0 h-full w-0.5 bg-red-500"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                      />
                    </>
                  )}
                </div>

                {/* Time display */}
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(region.start)}</span>
                  <span>Sélection: {formatTime(region.end - region.start)}</span>
                  <span>{formatTime(region.end)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-accent"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as "mp3" | "wav" | "ogg")}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="wav">WAV</option>
                    <option value="mp3">MP3</option>
                    <option value="ogg">OGG</option>
                  </select>

                  <button
                    onClick={cutAudio}
                    disabled={isProcessing || region.end <= region.start}
                    className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Scissors className="h-4 w-4" />
                        Couper & Télécharger
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
