'use client';

import { Plus, X, Globe, Plug, Radio, Braces, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tab, ConnectionType } from '../types';
import { cn } from '@/lib/utils';

interface TabsManagerProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onAddTab: (type: ConnectionType) => void;
  onDuplicateTab: (tabId: string) => void;
}

const connectionIcons: Record<ConnectionType, React.ReactNode> = {
  rest: <Globe className="h-3.5 w-3.5" />,
  websocket: <Plug className="h-3.5 w-3.5" />,
  socketio: <Radio className="h-3.5 w-3.5" />,
  graphql: <Braces className="h-3.5 w-3.5" />,
  sse: <Rss className="h-3.5 w-3.5" />,
};

const connectionColors: Record<ConnectionType, string> = {
  rest: 'text-blue-500',
  websocket: 'text-green-500',
  socketio: 'text-purple-500',
  graphql: 'text-pink-500',
  sse: 'text-orange-500',
};

const methodColors: Record<string, string> = {
  GET: 'text-green-500',
  POST: 'text-yellow-500',
  PUT: 'text-blue-500',
  PATCH: 'text-purple-500',
  DELETE: 'text-red-500',
  HEAD: 'text-gray-500',
  OPTIONS: 'text-cyan-500',
};

export function TabsManager({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onDuplicateTab,
}: TabsManagerProps) {
  const getTabLabel = (tab: Tab): string => {
    if (tab.name !== 'New Request') return tab.name;

    switch (tab.type) {
      case 'rest':
        return tab.restRequest?.url
          ? new URL(tab.restRequest.url).pathname.slice(0, 20) || '/'
          : 'New Request';
      case 'websocket':
        return tab.wsConfig?.url ? 'WebSocket' : 'New WebSocket';
      case 'socketio':
        return tab.sioConfig?.url ? 'Socket.IO' : 'New Socket.IO';
      case 'graphql':
        return tab.graphqlRequest?.url ? 'GraphQL' : 'New GraphQL';
      case 'sse':
        return tab.sseConfig?.url ? 'SSE' : 'New SSE';
      default:
        return 'New Request';
    }
  };

  const getStatusIndicator = (tab: Tab) => {
    if (tab.type === 'websocket' && tab.wsConnected) {
      return <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />;
    }
    if (tab.type === 'socketio' && tab.sioConnected) {
      return <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />;
    }
    if (tab.type === 'sse' && tab.sseConnected) {
      return <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />;
    }
    return null;
  };

  return (
    <div className="flex items-center border-b border-border bg-muted/30">
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer min-w-[120px] max-w-[200px]',
              'hover:bg-muted/50 transition-colors',
              activeTabId === tab.id && 'bg-background border-b-2 border-b-primary'
            )}
            onClick={() => onSelectTab(tab.id)}
            onDoubleClick={() => onDuplicateTab(tab.id)}
          >
            <span className={cn(connectionColors[tab.type])}>
              {connectionIcons[tab.type]}
            </span>

            {tab.type === 'rest' && tab.restRequest && (
              <span className={cn('text-[10px] font-bold', methodColors[tab.restRequest.method])}>
                {tab.restRequest.method}
              </span>
            )}

            <span className="text-xs truncate flex-1">{getTabLabel(tab)}</span>

            {getStatusIndicator(tab)}

            {tabs.length > 1 && (
              <button
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="m-1">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAddTab('rest')}>
            <Globe className="h-4 w-4 mr-2 text-blue-500" />
            REST Request
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTab('websocket')}>
            <Plug className="h-4 w-4 mr-2 text-green-500" />
            WebSocket
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTab('socketio')}>
            <Radio className="h-4 w-4 mr-2 text-purple-500" />
            Socket.IO
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTab('graphql')}>
            <Braces className="h-4 w-4 mr-2 text-pink-500" />
            GraphQL
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTab('sse')}>
            <Rss className="h-4 w-4 mr-2 text-orange-500" />
            Server-Sent Events
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
