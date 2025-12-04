"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  Download,
  RotateCcw,
  Film,
  Settings,
} from "lucide-react";

export default function VideoToGifPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gifUrl, setGifUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // Settings
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  const [quality, setQuality] = useState(10);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms}`;
  };

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Veuillez sélectionner un fichier vidéo");
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setGifUrl("");
    setProgress(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setEndTime(Math.min(dur, 5)); // Default 5 seconds max
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const createGif = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Calculate dimensions
      const aspectRatio = video.videoHeight / video.videoWidth;
      const height = Math.round(width * aspectRatio);
      canvas.width = width;
      canvas.height = height;

      const frameDuration = 1 / fps;
      const frames: ImageData[] = [];
      const totalFrames = Math.ceil((endTime - startTime) * fps);

      // Extract frames
      for (let i = 0; i < totalFrames; i++) {
        const frameTime = startTime + i * frameDuration;
        video.currentTime = frameTime;

        await new Promise<void>((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, width, height);
            frames.push(ctx.getImageData(0, 0, width, height));
            setProgress(Math.round((i / totalFrames) * 50));
            resolve();
          };
        });
      }

      // Create GIF using a simple encoder
      const gif = await createGifFromFrames(frames, width, height, frameDuration * 1000);

      const blob = new Blob([new Uint8Array(gif)], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      setGifUrl(url);
      setProgress(100);
    } catch (error) {
      console.error("Error creating GIF:", error);
      alert("Erreur lors de la création du GIF");
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple GIF encoder
  const createGifFromFrames = async (
    frames: ImageData[],
    width: number,
    height: number,
    delay: number
  ): Promise<Uint8Array> => {
    // GIF header
    const header = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
      width & 0xff, (width >> 8) & 0xff,
      height & 0xff, (height >> 8) & 0xff,
      0xf7, // Global color table, 256 colors
      0x00, // Background color index
      0x00, // Pixel aspect ratio
    ]);

    // Create global color table (256 colors)
    const colorTable = new Uint8Array(768);
    for (let i = 0; i < 256; i++) {
      colorTable[i * 3] = i; // R
      colorTable[i * 3 + 1] = i; // G
      colorTable[i * 3 + 2] = i; // B
    }

    // Netscape extension for looping
    const netscape = new Uint8Array([
      0x21, 0xff, 0x0b,
      0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45,
      0x32, 0x2e, 0x30,
      0x03, 0x01,
      0x00, 0x00,
      0x00,
    ]);

    const frameData: Uint8Array[] = [];

    for (let f = 0; f < frames.length; f++) {
      setProgress(50 + Math.round((f / frames.length) * 45));

      const frame = frames[f];
      const delayCs = Math.round(delay / 10);

      // Graphic control extension
      const gce = new Uint8Array([
        0x21, 0xf9, 0x04,
        0x00, // No transparency
        delayCs & 0xff, (delayCs >> 8) & 0xff,
        0x00, // Transparent color index
        0x00,
      ]);

      // Image descriptor
      const imageDesc = new Uint8Array([
        0x2c,
        0x00, 0x00, // Left
        0x00, 0x00, // Top
        width & 0xff, (width >> 8) & 0xff,
        height & 0xff, (height >> 8) & 0xff,
        0x00, // No local color table
      ]);

      // Convert frame to indexed colors and LZW compress
      const indexed = new Uint8Array(width * height);
      for (let i = 0; i < frame.data.length; i += 4) {
        const r = frame.data[i];
        const g = frame.data[i + 1];
        const b = frame.data[i + 2];
        // Simple grayscale conversion
        indexed[i / 4] = Math.round((r + g + b) / 3);
      }

      // Simple LZW encoding
      const lzw = lzwEncode(indexed, 8);

      frameData.push(gce, imageDesc, lzw);
    }

    // Trailer
    const trailer = new Uint8Array([0x3b]);

    // Combine all parts
    const totalLength = header.length + colorTable.length + netscape.length +
      frameData.reduce((sum, arr) => sum + arr.length, 0) + trailer.length;

    const result = new Uint8Array(totalLength);
    let offset = 0;

    result.set(header, offset);
    offset += header.length;
    result.set(colorTable, offset);
    offset += colorTable.length;
    result.set(netscape, offset);
    offset += netscape.length;

    for (const data of frameData) {
      result.set(data, offset);
      offset += data.length;
    }

    result.set(trailer, offset);

    return result;
  };

  // Simple LZW encoder for GIF
  const lzwEncode = (data: Uint8Array, minCodeSize: number): Uint8Array => {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    const output: number[] = [minCodeSize];
    let buffer: number[] = [];
    let bitBuffer = 0;
    let bitCount = 0;
    let codeSize = minCodeSize + 1;

    const writeBits = (code: number, size: number) => {
      bitBuffer |= code << bitCount;
      bitCount += size;
      while (bitCount >= 8) {
        buffer.push(bitBuffer & 0xff);
        bitBuffer >>= 8;
        bitCount -= 8;
        if (buffer.length === 255) {
          output.push(255);
          output.push(...buffer);
          buffer = [];
        }
      }
    };

    // Write clear code
    writeBits(clearCode, codeSize);

    // Write data (simplified - just write each byte as a code)
    let nextCode = eoiCode + 1;
    for (let i = 0; i < data.length; i++) {
      writeBits(data[i], codeSize);
      if (nextCode < 4096) {
        nextCode++;
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      }
      if (nextCode === 4094) {
        writeBits(clearCode, codeSize);
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
      }
    }

    // Write EOI code
    writeBits(eoiCode, codeSize);

    // Flush remaining bits
    if (bitCount > 0) {
      buffer.push(bitBuffer & 0xff);
    }

    if (buffer.length > 0) {
      output.push(buffer.length);
      output.push(...buffer);
    }

    output.push(0); // Block terminator

    return new Uint8Array(output);
  };

  const downloadGif = () => {
    if (!gifUrl) return;
    const a = document.createElement("a");
    a.href = gifUrl;
    a.download = "video.gif";
    a.click();
  };

  const reset = () => {
    setVideoFile(null);
    setVideoUrl("");
    setDuration(0);
    setCurrentTime(0);
    setStartTime(0);
    setEndTime(0);
    setIsPlaying(false);
    setGifUrl("");
    setProgress(0);
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
        <h1 className="text-lg font-semibold">Video to GIF</h1>
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          {!videoFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Film className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">Déposez une vidéo</p>
              <p className="mb-4 text-sm text-muted-foreground">
                ou cliquez pour sélectionner
              </p>
              <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                Choisir un fichier
              </label>
              <p className="mt-4 text-xs text-muted-foreground">
                MP4, WebM, MOV supportés
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Video preview */}
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-border bg-black">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleVideoLoaded}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                  />
                </div>

                {/* Video controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlayPause}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.01}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Time selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Début</label>
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={startTime}
                        onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime - 0.1))}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{formatTime(startTime)}</span>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Fin</label>
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={endTime}
                        onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime + 0.1))}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">{formatTime(endTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings & Output */}
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <h3 className="font-medium">Paramètres</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 flex justify-between text-sm">
                        <span>Images par seconde (FPS)</span>
                        <span className="text-muted-foreground">{fps}</span>
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={30}
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex justify-between text-sm">
                        <span>Largeur</span>
                        <span className="text-muted-foreground">{width}px</span>
                      </label>
                      <input
                        type="range"
                        min={200}
                        max={800}
                        step={20}
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex justify-between text-sm">
                        <span>Qualité</span>
                        <span className="text-muted-foreground">{quality}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                      Durée: {formatTime(endTime - startTime)} • ~{Math.ceil((endTime - startTime) * fps)} frames
                    </div>
                  </div>
                </div>

                <button
                  onClick={createGif}
                  disabled={isProcessing || endTime <= startTime}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Conversion... {progress}%
                    </>
                  ) : (
                    <>
                      <Film className="h-4 w-4" />
                      Convertir en GIF
                    </>
                  )}
                </button>

                {/* Progress bar */}
                {isProcessing && (
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* GIF preview */}
                {gifUrl && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-3 text-sm font-medium">Résultat</p>
                    <img
                      src={gifUrl}
                      alt="GIF généré"
                      className="mb-3 w-full rounded border border-border"
                    />
                    <button
                      onClick={downloadGif}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-accent"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger le GIF
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>
    </div>
  );
}
