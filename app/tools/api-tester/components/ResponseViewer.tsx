'use client';

import { useState } from 'react';
import { Copy, Check, Download, Clock, HardDrive } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RestResponse } from '../types';
import { cn } from '@/lib/utils';

interface ResponseViewerProps {
  response: RestResponse | null | undefined;
  isLoading?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-500';
  if (status >= 300 && status < 400) return 'text-yellow-500';
  if (status >= 400 && status < 500) return 'text-orange-500';
  if (status >= 500) return 'text-red-500';
  return 'text-muted-foreground';
}

function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function ResponseViewer({ response, isLoading }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (response?.body) {
      const blob = new Blob([response.body], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'response.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="animate-pulse">Sending request...</div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Send a request to see the response</p>
      </div>
    );
  }

  const isJson = response.headers['content-type']?.includes('application/json') ||
    response.body.trim().startsWith('{') ||
    response.body.trim().startsWith('[');

  return (
    <div className="h-full flex flex-col">
      {/* Status Bar */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className={cn('font-bold', getStatusColor(response.status))}>
            {response.status}
          </span>
          <span className="text-sm text-muted-foreground">{response.statusText}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{response.time} ms</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <HardDrive className="h-3.5 w-3.5" />
          <span>{formatBytes(response.size)}</span>
        </div>

        <div className="flex-1" />

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Response Content */}
      <Tabs defaultValue="body" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="h-8 w-full justify-start rounded-none border-b border-border bg-transparent px-3">
          <TabsTrigger value="body" className="text-xs h-7">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs h-7">
            Headers ({Object.keys(response.headers).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="m-0 flex-1 overflow-auto">
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
            {isJson ? tryFormatJson(response.body) : response.body}
          </pre>
        </TabsContent>

        <TabsContent value="headers" className="m-0 flex-1 overflow-auto">
          <div className="p-3 space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex text-xs font-mono">
                <span className="text-blue-500 font-medium min-w-[180px]">{key}:</span>
                <span className="text-muted-foreground break-all">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
