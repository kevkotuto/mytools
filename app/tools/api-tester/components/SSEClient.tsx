'use client';

import { useRef, useEffect } from 'react';
import { Rss, Play, Pause, Trash2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tab, SSEEvent } from '../types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SSEClientProps {
  tab: Tab;
  onUpdateTab: (updates: Partial<Tab>) => void;
  replaceVariables: (text: string) => string;
  getSseRef: (tabId: string) => EventSource | undefined;
  setSseRef: (tabId: string, sse: EventSource | null) => void;
}

export function SSEClient({
  tab,
  onUpdateTab,
  replaceVariables,
  getSseRef,
  setSseRef,
}: SSEClientProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const config = tab.sseConfig!;
  const events = tab.sseEvents || [];
  const isConnected = tab.sseConnected || false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const connect = () => {
    try {
      const url = replaceVariables(config.url);
      const sse = new EventSource(url, {
        withCredentials: config.withCredentials,
      });

      sse.onopen = () => {
        onUpdateTab({ sseConnected: true });
        addEvent('open', `Connected to ${url}`);
      };

      sse.onmessage = (event) => {
        addEvent('message', event.data);
      };

      sse.onerror = () => {
        if (sse.readyState === EventSource.CLOSED) {
          onUpdateTab({ sseConnected: false });
          addEvent('error', 'Connection closed');
          setSseRef(tab.id, null);
        } else {
          addEvent('error', 'Connection error');
        }
      };

      setSseRef(tab.id, sse);
    } catch (error) {
      addEvent('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnect = () => {
    const sse = getSseRef(tab.id);
    if (sse) {
      sse.close();
      setSseRef(tab.id, null);
      onUpdateTab({ sseConnected: false });
      addEvent('close', 'Disconnected');
    }
  };

  const addEvent = (type: string, data: string) => {
    const newEvent: SSEEvent = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
    };
    onUpdateTab({ sseEvents: [...events, newEvent] });
  };

  const clearEvents = () => {
    onUpdateTab({ sseEvents: [] });
  };

  const copyEvent = (evt: SSEEvent) => {
    navigator.clipboard.writeText(evt.data);
    setCopied(evt.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-green-500/20 text-green-600';
      case 'open': return 'bg-emerald-500/20 text-emerald-600';
      case 'close': return 'bg-orange-500/20 text-orange-600';
      case 'error': return 'bg-red-500/20 text-red-600';
      default: return 'bg-blue-500/20 text-blue-600';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-orange-500/20 text-orange-600 border border-orange-500/30">
          <Rss className="h-4 w-4" />
          <span className="text-sm font-bold">SSE</span>
        </div>

        <Input
          value={config.url}
          onChange={(e) => onUpdateTab({ sseConfig: { ...config, url: e.target.value } })}
          placeholder="https://api.example.com/events"
          className="flex-1 h-9 font-mono text-sm"
          disabled={isConnected}
        />

        <Button
          onClick={isConnected ? disconnect : connect}
          variant={isConnected ? 'destructive' : 'default'}
          className="h-9"
          disabled={!config.url}
        >
          {isConnected ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Disconnect
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      </div>

      {/* Events List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">
            {isConnected ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Listening for events...
              </span>
            ) : (
              `${events.length} events`
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={clearEvents}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events yet. Connect to start receiving server-sent events.
            </p>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className={cn('group rounded p-2', getEventColor(evt.type))}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase">{evt.type}</span>
                  <span className="text-[10px] opacity-60">{formatTime(evt.timestamp)}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    onClick={() => copyEvent(evt)}
                  >
                    {copied === evt.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <pre className="font-mono text-xs whitespace-pre-wrap break-all">
                  {evt.data}
                </pre>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
