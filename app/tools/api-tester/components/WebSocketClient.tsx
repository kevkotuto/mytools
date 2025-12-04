'use client';

import { useState, useRef, useEffect } from 'react';
import { Plug, PlugZap, Send, Trash2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tab, WebSocketMessage, createKeyValue } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { cn } from '@/lib/utils';

interface WebSocketClientProps {
  tab: Tab;
  onUpdateTab: (updates: Partial<Tab>) => void;
  replaceVariables: (text: string) => string;
  getWsRef: (tabId: string) => WebSocket | undefined;
  setWsRef: (tabId: string, ws: WebSocket | null) => void;
}

export function WebSocketClient({
  tab,
  onUpdateTab,
  replaceVariables,
  getWsRef,
  setWsRef,
}: WebSocketClientProps) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const config = tab.wsConfig!;
  const messages = tab.wsMessages || [];
  const isConnected = tab.wsConnected || false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connect = () => {
    try {
      const url = replaceVariables(config.url);
      const ws = new WebSocket(url, config.protocols);

      ws.onopen = () => {
        onUpdateTab({ wsConnected: true });
        addMessage('system', `Connected to ${url}`);
      };

      ws.onmessage = (event) => {
        addMessage('received', event.data);
      };

      ws.onclose = (event) => {
        onUpdateTab({ wsConnected: false });
        addMessage('system', `Disconnected: ${event.code} ${event.reason || ''}`);
        setWsRef(tab.id, null);
      };

      ws.onerror = () => {
        addMessage('system', 'Connection error');
      };

      setWsRef(tab.id, ws);
    } catch (error) {
      addMessage('system', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnect = () => {
    const ws = getWsRef(tab.id);
    if (ws) {
      ws.close();
      setWsRef(tab.id, null);
    }
  };

  const sendMessage = () => {
    const ws = getWsRef(tab.id);
    if (ws && message.trim()) {
      ws.send(replaceVariables(message));
      addMessage('sent', message);
      setMessage('');
    }
  };

  const addMessage = (type: 'sent' | 'received' | 'system', data: string) => {
    const newMessage: WebSocketMessage = {
      id: crypto.randomUUID(),
      type: type === 'system' ? 'received' : type,
      data: type === 'system' ? `[System] ${data}` : data,
      timestamp: Date.now(),
    };
    onUpdateTab({ wsMessages: [...messages, newMessage] });
  };

  const clearMessages = () => {
    onUpdateTab({ wsMessages: [] });
  };

  const copyMessage = (msg: WebSocketMessage) => {
    navigator.clipboard.writeText(msg.data);
    setCopied(msg.id);
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

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-500/20 text-green-600 border border-green-500/30">
          <Plug className="h-4 w-4" />
          <span className="text-sm font-bold">WS</span>
        </div>

        <Input
          value={config.url}
          onChange={(e) => onUpdateTab({ wsConfig: { ...config, url: e.target.value } })}
          placeholder="wss://example.com/socket"
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
              <PlugZap className="h-4 w-4 mr-2" />
              Disconnect
            </>
          ) : (
            <>
              <Plug className="h-4 w-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      </div>

      {/* Config & Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="messages" className="flex-1 flex flex-col">
          <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent px-3">
            <TabsTrigger value="messages" className="text-xs">
              Messages ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="headers" className="text-xs">
              Headers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="m-0 flex-1 flex flex-col overflow-hidden">
            {/* Messages List */}
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Connect and send a message.
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'group flex gap-2 text-sm',
                      msg.type === 'sent' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded p-2 relative',
                        msg.type === 'sent'
                          ? 'bg-primary text-primary-foreground'
                          : msg.data.startsWith('[System]')
                          ? 'bg-muted text-muted-foreground italic'
                          : 'bg-muted'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <pre className="font-mono text-xs whitespace-pre-wrap break-all flex-1">
                          {msg.data}
                        </pre>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyMessage(msg)}
                        >
                          {copied === msg.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] opacity-60 mt-1">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message */}
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
                <Button variant="ghost" size="sm" onClick={clearMessages}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder='{"event": "message", "data": "Hello!"}'
                  className="flex-1 min-h-[60px] font-mono text-sm resize-none"
                  disabled={!isConnected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!isConnected || !message.trim()}
                  className="h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Press Ctrl+Enter to send
              </p>
            </div>
          </TabsContent>

          <TabsContent value="headers" className="m-0 flex-1 overflow-auto p-3">
            <KeyValueEditor
              items={config.headers || []}
              onChange={(headers) => onUpdateTab({ wsConfig: { ...config, headers } })}
              keyPlaceholder="Header name"
              valuePlaceholder="Header value"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Note: Custom headers may not work in browsers due to WebSocket limitations.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
