'use client';

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tab, HttpMethod, RestResponse, SavedAuth, createKeyValue } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { AuthEditor } from './AuthEditor';
import { BodyEditor } from './BodyEditor';
import { ResponseViewer } from './ResponseViewer';
import { cn } from '@/lib/utils';

interface RestClientProps {
  tab: Tab;
  onUpdateTab: (updates: Partial<Tab>) => void;
  savedAuths: SavedAuth[];
  onSaveAuth: (name: string, config: SavedAuth['config']) => void;
  onDeleteAuth: (id: string) => void;
  replaceVariables: (text: string) => string;
  onAddToHistory: (tab: Tab) => void;
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-green-500/20 text-green-600 border-green-500/30',
  POST: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  PUT: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  PATCH: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  DELETE: 'bg-red-500/20 text-red-600 border-red-500/30',
  HEAD: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
  OPTIONS: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
};

export function RestClient({
  tab,
  onUpdateTab,
  savedAuths,
  onSaveAuth,
  onDeleteAuth,
  replaceVariables,
  onAddToHistory,
}: RestClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const request = tab.restRequest!;

  const updateRequest = (updates: Partial<typeof request>) => {
    onUpdateTab({ restRequest: { ...request, ...updates } });
  };

  const sendRequest = async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      let url = replaceVariables(request.url);

      // Add query params
      const enabledParams = request.params.filter(p => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach(p => searchParams.append(p.key, replaceVariables(p.value)));
        url += (url.includes('?') ? '&' : '?') + searchParams.toString();
      }

      // Add API key to query if needed
      if (request.auth.type === 'api-key' && request.auth.apiKey?.addTo === 'query') {
        const sep = url.includes('?') ? '&' : '?';
        url += `${sep}${request.auth.apiKey.key}=${replaceVariables(request.auth.apiKey.value)}`;
      }

      // Build headers
      const headers: Record<string, string> = {};
      request.headers
        .filter(h => h.enabled && h.key)
        .forEach(h => {
          headers[h.key] = replaceVariables(h.value);
        });

      // Add auth headers
      if (request.auth.type === 'bearer' && request.auth.bearer?.token) {
        headers['Authorization'] = `Bearer ${replaceVariables(request.auth.bearer.token)}`;
      } else if (request.auth.type === 'basic' && request.auth.basic) {
        const credentials = btoa(
          `${request.auth.basic.username}:${request.auth.basic.password}`
        );
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (request.auth.type === 'api-key' && request.auth.apiKey?.addTo === 'header') {
        headers[request.auth.apiKey.key] = replaceVariables(request.auth.apiKey.value);
      } else if (request.auth.type === 'oauth2' && request.auth.oauth2?.accessToken) {
        headers['Authorization'] = `${request.auth.oauth2.tokenType} ${replaceVariables(request.auth.oauth2.accessToken)}`;
      }

      // Build body
      let body: string | FormData | undefined;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (request.body.type === 'json' || request.body.type === 'graphql') {
          headers['Content-Type'] = 'application/json';
          body = replaceVariables(request.body.content);
        } else if (request.body.type === 'raw') {
          body = replaceVariables(request.body.content);
        } else if (request.body.type === 'form-data') {
          const formData = new FormData();
          request.body.formData?.filter(f => f.enabled && f.key).forEach(f => {
            formData.append(f.key, replaceVariables(f.value));
          });
          body = formData;
        } else if (request.body.type === 'x-www-form-urlencoded') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          const params = new URLSearchParams();
          request.body.formData?.filter(f => f.enabled && f.key).forEach(f => {
            params.append(f.key, replaceVariables(f.value));
          });
          body = params.toString();
        }
      }

      const response = await fetch(url, {
        method: request.method,
        headers,
        body,
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await response.text();
      const endTime = performance.now();

      const restResponse: RestResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Math.round(endTime - startTime),
        size: new Blob([responseBody]).size,
      };

      onUpdateTab({ restResponse });
      onAddToHistory({ ...tab, restResponse });
    } catch (error) {
      const endTime = performance.now();
      const errorResponse: RestResponse = {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: error instanceof Error ? error.message : 'Unknown error',
        time: Math.round(endTime - startTime),
        size: 0,
      };
      onUpdateTab({ restResponse: errorResponse });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Select
          value={request.method}
          onValueChange={(v) => updateRequest({ method: v as HttpMethod })}
        >
          <SelectTrigger className={cn('w-28 h-9 font-bold text-sm', methodColors[request.method])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as HttpMethod[]).map(
              (method) => (
                <SelectItem key={method} value={method} className="font-bold">
                  {method}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Input
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 h-9 font-mono text-sm"
          onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
        />

        <Button onClick={sendRequest} disabled={isLoading || !request.url} className="h-9">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="ml-2">Send</span>
        </Button>
      </div>

      {/* Request Config */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="params" className="flex-1 flex flex-col">
          <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent px-3">
            <TabsTrigger value="params" className="text-xs">
              Params
              {request.params.filter(p => p.enabled).length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({request.params.filter(p => p.enabled).length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="headers" className="text-xs">
              Headers
              {request.headers.filter(h => h.enabled).length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({request.headers.filter(h => h.enabled).length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="body" className="text-xs">
              Body
            </TabsTrigger>
            <TabsTrigger value="auth" className="text-xs">
              Auth
              {request.auth.type !== 'none' && (
                <span className="ml-1 h-2 w-2 rounded-full bg-green-500" />
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-3">
            <TabsContent value="params" className="m-0">
              <KeyValueEditor
                items={request.params}
                onChange={(params) => updateRequest({ params })}
                keyPlaceholder="Parameter name"
                valuePlaceholder="Parameter value"
              />
            </TabsContent>

            <TabsContent value="headers" className="m-0">
              <KeyValueEditor
                items={request.headers}
                onChange={(headers) => updateRequest({ headers })}
                keyPlaceholder="Header name"
                valuePlaceholder="Header value"
              />
            </TabsContent>

            <TabsContent value="body" className="m-0">
              <BodyEditor
                body={request.body}
                onChange={(body) => updateRequest({ body })}
              />
            </TabsContent>

            <TabsContent value="auth" className="m-0">
              <AuthEditor
                auth={request.auth}
                onChange={(auth) => updateRequest({ auth })}
                savedAuths={savedAuths}
                onSaveAuth={onSaveAuth}
                onDeleteAuth={onDeleteAuth}
                onLoadAuth={(config) => updateRequest({ auth: config })}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Response */}
        <div className="border-t border-border h-[45%] min-h-[200px]">
          <ResponseViewer response={tab.restResponse} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
