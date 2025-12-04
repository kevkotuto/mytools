'use client';

import { useState, useRef, useEffect } from 'react';
import { Radio, Send, Trash2, Copy, Check, Plus, X, Play, Pause } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tab, SocketIOEvent, createKeyValue } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';

interface SocketIOClientProps {
  tab: Tab;
  onUpdateTab: (updates: Partial<Tab>) => void;
  replaceVariables: (text: string) => string;
}

export function SocketIOClient({
  tab,
  onUpdateTab,
  replaceVariables,
}: SocketIOClientProps) {
  const [eventName, setEventName] = useState('message');
  const [eventData, setEventData] = useState('');
  const [newListener, setNewListener] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const config = tab.sioConfig!;
  const events = tab.sioEvents || [];
  const isConnected = tab.sioConnected || false;
  const listeningEvents = tab.sioListeningEvents || ['message', 'error'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connect = () => {
    try {
      const url = replaceVariables(config.url);

      const authObj: Record<string, string> = {};
      config.auth && Object.entries(config.auth).forEach(([k, v]) => {
        authObj[k] = replaceVariables(v);
      });

      const queryObj: Record<string, string> = {};
      config.query?.filter(q => q.enabled && q.key).forEach(q => {
        queryObj[q.key] = replaceVariables(q.value);
      });

      const socket = io(url, {
        path: config.path || '/socket.io',
        transports: config.transports || ['websocket', 'polling'],
        auth: Object.keys(authObj).length > 0 ? authObj : undefined,
        query: Object.keys(queryObj).length > 0 ? queryObj : undefined,
        reconnection: false,
      });

      socket.on('connect', () => {
        onUpdateTab({ sioConnected: true });
        addEvent('connect', 'connect', `Connected with ID: ${socket.id}`);

        // Re-register all listeners
        listeningEvents.forEach(evt => {
          socket.on(evt, (data: unknown) => {
            addEvent('receive', evt, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
          });
        });
      });

      socket.on('disconnect', (reason) => {
        onUpdateTab({ sioConnected: false });
        addEvent('disconnect', 'disconnect', `Disconnected: ${reason}`);
      });

      socket.on('connect_error', (error) => {
        addEvent('error', 'error', `Connection error: ${error.message}`);
      });

      socketRef.current = socket;
    } catch (error) {
      addEvent('error', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const emitEvent = () => {
    if (socketRef.current && eventName.trim()) {
      let data: unknown;
      try {
        data = eventData.trim() ? JSON.parse(replaceVariables(eventData)) : undefined;
      } catch {
        data = replaceVariables(eventData);
      }

      socketRef.current.emit(eventName, data);
      addEvent('emit', eventName, eventData || '(no data)');
      setEventData('');
    }
  };

  const addEvent = (type: SocketIOEvent['type'], event: string, data: string) => {
    const newEvent: SocketIOEvent = {
      id: crypto.randomUUID(),
      type,
      event,
      data,
      timestamp: Date.now(),
    };
    onUpdateTab({ sioEvents: [...events, newEvent] });
  };

  const clearEvents = () => {
    onUpdateTab({ sioEvents: [] });
  };

  const addListener = () => {
    if (newListener.trim() && !listeningEvents.includes(newListener.trim())) {
      const newListeners = [...listeningEvents, newListener.trim()];
      onUpdateTab({ sioListeningEvents: newListeners });

      // Register listener if connected
      if (socketRef.current && isConnected) {
        socketRef.current.on(newListener.trim(), (data: unknown) => {
          addEvent('receive', newListener.trim(), typeof data === 'string' ? data : JSON.stringify(data, null, 2));
        });
      }
      setNewListener('');
    }
  };

  const removeListener = (evt: string) => {
    const newListeners = listeningEvents.filter(e => e !== evt);
    onUpdateTab({ sioListeningEvents: newListeners });

    if (socketRef.current) {
      socketRef.current.off(evt);
    }
  };

  const copyEvent = (evt: SocketIOEvent) => {
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

  const getEventColor = (type: SocketIOEvent['type']) => {
    switch (type) {
      case 'emit': return 'bg-blue-500/20 text-blue-600';
      case 'receive': return 'bg-green-500/20 text-green-600';
      case 'connect': return 'bg-emerald-500/20 text-emerald-600';
      case 'disconnect': return 'bg-orange-500/20 text-orange-600';
      case 'error': return 'bg-red-500/20 text-red-600';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-purple-500/20 text-purple-600 border border-purple-500/30">
          <Radio className="h-4 w-4" />
          <span className="text-sm font-bold">SIO</span>
        </div>

        <Input
          value={config.url}
          onChange={(e) => onUpdateTab({ sioConfig: { ...config, url: e.target.value } })}
          placeholder="http://localhost:3000"
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

      {/* Config & Events */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="events" className="flex-1 flex flex-col">
          <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent px-3">
            <TabsTrigger value="events" className="text-xs">
              Events ({events.length})
            </TabsTrigger>
            <TabsTrigger value="listeners" className="text-xs">
              Listeners ({listeningEvents.length})
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs">
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="m-0 flex-1 flex flex-col overflow-hidden">
            {/* Events List */}
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events yet. Connect and emit/listen to events.
                </p>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className={cn(
                      'group flex gap-2 text-sm',
                      evt.type === 'emit' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className={cn('max-w-[80%] rounded p-2', getEventColor(evt.type))}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {evt.event}
                        </Badge>
                        <span className="text-[10px] opacity-60">
                          {evt.type === 'emit' ? '→' : '←'} {formatTime(evt.timestamp)}
                        </span>
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
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emit Event */}
            <div className="border-t border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {isConnected ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    'Disconnected'
                  )}
                </span>
                <Button variant="ghost" size="sm" onClick={clearEvents}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Event name"
                  className="w-32 h-9 text-sm"
                  disabled={!isConnected}
                />
                <Textarea
                  value={eventData}
                  onChange={(e) => setEventData(e.target.value)}
                  placeholder='{"message": "Hello!"}'
                  className="flex-1 min-h-[40px] max-h-[80px] font-mono text-sm resize-none"
                  disabled={!isConnected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      emitEvent();
                    }
                  }}
                />
                <Button
                  onClick={emitEvent}
                  disabled={!isConnected || !eventName.trim()}
                  className="h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="listeners" className="m-0 flex-1 overflow-auto p-3">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newListener}
                  onChange={(e) => setNewListener(e.target.value)}
                  placeholder="Event name to listen..."
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addListener()}
                />
                <Button size="sm" onClick={addListener} disabled={!newListener.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                {listeningEvents.map((evt) => (
                  <div
                    key={evt}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <span className="text-sm font-mono">{evt}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeListener(evt)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Add event names to listen for incoming events from the server.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="config" className="m-0 flex-1 overflow-auto p-3 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Path</label>
              <Input
                value={config.path || '/socket.io'}
                onChange={(e) => onUpdateTab({ sioConfig: { ...config, path: e.target.value } })}
                placeholder="/socket.io"
                className="h-8 text-sm font-mono"
                disabled={isConnected}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Query Parameters</label>
              <KeyValueEditor
                items={config.query || []}
                onChange={(query) => onUpdateTab({ sioConfig: { ...config, query } })}
                keyPlaceholder="Key"
                valuePlaceholder="Value"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Auth (sent on connect)</label>
              <Textarea
                value={config.auth ? JSON.stringify(config.auth, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const auth = e.target.value ? JSON.parse(e.target.value) : undefined;
                    onUpdateTab({ sioConfig: { ...config, auth } });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"token": "your-auth-token"}'
                className="min-h-[80px] font-mono text-sm"
                disabled={isConnected}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
