'use client';

import { useState } from 'react';
import {
  History,
  FolderOpen,
  Settings2,
  ChevronRight,
  Trash2,
  Play,
  Plus,
  X,
  Check,
  Globe,
  Plug,
  Radio,
  Braces,
  Rss,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SavedRequest, Environment, ConnectionType, Tab } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { cn } from '@/lib/utils';

interface SidebarProps {
  history: SavedRequest[];
  savedRequests: SavedRequest[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  onLoadRequest: (request: SavedRequest) => void;
  onDeleteRequest: (id: string) => void;
  onClearHistory: () => void;
  onSaveCurrentRequest: (name: string, tab: Tab) => void;
  currentTab: Tab;
  onAddEnvironment: (name: string) => void;
  onUpdateEnvironment: (id: string, updates: Partial<Environment>) => void;
  onDeleteEnvironment: (id: string) => void;
  onSetActiveEnvironment: (id: string | null) => void;
}

const connectionIcons: Record<ConnectionType, React.ReactNode> = {
  rest: <Globe className="h-3 w-3" />,
  websocket: <Plug className="h-3 w-3" />,
  socketio: <Radio className="h-3 w-3" />,
  graphql: <Braces className="h-3 w-3" />,
  sse: <Rss className="h-3 w-3" />,
};

const methodColors: Record<string, string> = {
  GET: 'text-green-500',
  POST: 'text-yellow-500',
  PUT: 'text-blue-500',
  PATCH: 'text-purple-500',
  DELETE: 'text-red-500',
};

export function Sidebar({
  history,
  savedRequests,
  environments,
  activeEnvironmentId,
  onLoadRequest,
  onDeleteRequest,
  onClearHistory,
  onSaveCurrentRequest,
  currentTab,
  onAddEnvironment,
  onUpdateEnvironment,
  onDeleteEnvironment,
  onSetActiveEnvironment,
}: SidebarProps) {
  const [historyOpen, setHistoryOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [envOpen, setEnvOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [newEnvName, setNewEnvName] = useState('');
  const [editingEnv, setEditingEnv] = useState<string | null>(null);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('fr-FR');
  };

  const getRequestLabel = (request: SavedRequest) => {
    const tab = request.tab;
    if (tab.type === 'rest' && tab.restRequest) {
      try {
        return new URL(tab.restRequest.url).pathname || '/';
      } catch {
        return tab.restRequest.url;
      }
    }
    return request.name;
  };

  return (
    <div className="w-64 border-r border-border flex flex-col bg-muted/20">
      {/* Environment Selector */}
      <div className="p-2 border-b border-border">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Settings2 className="h-4 w-4 mr-2" />
              {activeEnvironmentId
                ? environments.find(e => e.id === activeEnvironmentId)?.name || 'Environment'
                : 'No Environment'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Environments</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Add new environment */}
              <div className="flex gap-2">
                <Input
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="New environment name..."
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (newEnvName.trim()) {
                      onAddEnvironment(newEnvName.trim());
                      setNewEnvName('');
                    }
                  }}
                  disabled={!newEnvName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Environment list */}
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {/* No environment option */}
                <div
                  className={cn(
                    'p-2 rounded cursor-pointer border',
                    !activeEnvironmentId
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-muted'
                  )}
                  onClick={() => onSetActiveEnvironment(null)}
                >
                  <span className="text-sm">No Environment</span>
                </div>

                {environments.map((env) => (
                  <div
                    key={env.id}
                    className={cn(
                      'p-2 rounded border',
                      activeEnvironmentId === env.id
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent hover:bg-muted'
                    )}
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => onSetActiveEnvironment(env.id)}
                    >
                      <span className="text-sm font-medium">{env.name}</span>
                      <div className="flex items-center gap-1">
                        {activeEnvironmentId === env.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEnv(editingEnv === env.id ? null : env.id);
                          }}
                        >
                          <Settings2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEnvironment(env.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {editingEnv === env.id && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <KeyValueEditor
                          items={env.variables}
                          onChange={(variables) =>
                            onUpdateEnvironment(env.id, { variables })
                          }
                          keyPlaceholder="Variable name"
                          valuePlaceholder="Value"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Use {'{{variableName}}'} in your requests
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections */}
      <Collapsible open={collectionsOpen} onOpenChange={setCollectionsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', collectionsOpen && 'rotate-90')}
            />
            <FolderOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Collections</span>
          </div>
          <span className="text-xs text-muted-foreground">{savedRequests.length}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-2 pb-2">
            {/* Save current */}
            <div className="flex gap-1 mb-2">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Save current as..."
                className="h-7 text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (saveName.trim()) {
                    onSaveCurrentRequest(saveName.trim(), currentTab);
                    setSaveName('');
                  }
                }}
                disabled={!saveName.trim()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Saved requests */}
            <div className="space-y-1 max-h-48 overflow-auto">
              {savedRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No saved requests
                </p>
              ) : (
                savedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="group flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                    onClick={() => onLoadRequest(request)}
                  >
                    {connectionIcons[request.tab.type]}
                    {request.tab.type === 'rest' && request.tab.restRequest && (
                      <span
                        className={cn(
                          'text-[10px] font-bold',
                          methodColors[request.tab.restRequest.method]
                        )}
                      >
                        {request.tab.restRequest.method}
                      </span>
                    )}
                    <span className="text-xs truncate flex-1">{request.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRequest(request.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* History */}
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', historyOpen && 'rotate-90')}
            />
            <History className="h-4 w-4" />
            <span className="text-sm font-medium">History</span>
          </div>
          <span className="text-xs text-muted-foreground">{history.length}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-2 pb-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mb-2 h-7 text-xs"
                onClick={onClearHistory}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear History
              </Button>
            )}

            <div className="space-y-1 max-h-64 overflow-auto">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No history yet
                </p>
              ) : (
                history.map((request) => (
                  <div
                    key={request.id}
                    className="group flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                    onClick={() => onLoadRequest(request)}
                  >
                    {connectionIcons[request.tab.type]}
                    {request.tab.type === 'rest' && request.tab.restRequest && (
                      <span
                        className={cn(
                          'text-[10px] font-bold',
                          methodColors[request.tab.restRequest.method]
                        )}
                      >
                        {request.tab.restRequest.method}
                      </span>
                    )}
                    <span className="text-xs truncate flex-1">{getRequestLabel(request)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(request.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Info */}
      <div className="p-2 border-t border-border text-[10px] text-muted-foreground">
        <p>Tip: Double-click tab to duplicate</p>
        <p>Use {'{{var}}'} for environment variables</p>
      </div>
    </div>
  );
}
