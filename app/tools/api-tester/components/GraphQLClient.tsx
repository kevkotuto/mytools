'use client';

import { useState } from 'react';
import { Play, Loader2, Braces } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Tab, RestResponse, SavedAuth } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { AuthEditor } from './AuthEditor';
import { ResponseViewer } from './ResponseViewer';

interface GraphQLClientProps {
  tab: Tab;
  onUpdateTab: (updates: Partial<Tab>) => void;
  savedAuths: SavedAuth[];
  onSaveAuth: (name: string, config: SavedAuth['config']) => void;
  onDeleteAuth: (id: string) => void;
  replaceVariables: (text: string) => string;
  onAddToHistory: (tab: Tab) => void;
}

export function GraphQLClient({
  tab,
  onUpdateTab,
  savedAuths,
  onSaveAuth,
  onDeleteAuth,
  replaceVariables,
  onAddToHistory,
}: GraphQLClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const request = tab.graphqlRequest!;

  const updateRequest = (updates: Partial<typeof request>) => {
    onUpdateTab({ graphqlRequest: { ...request, ...updates } });
  };

  const sendRequest = async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const url = replaceVariables(request.url);

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
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
      }

      // Parse variables
      let variables = {};
      try {
        if (request.variables.trim()) {
          variables = JSON.parse(replaceVariables(request.variables));
        }
      } catch {
        // Invalid JSON
      }

      const body = JSON.stringify({
        query: replaceVariables(request.query),
        variables,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await response.text();
      const endTime = performance.now();

      const graphqlResponse: RestResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Math.round(endTime - startTime),
        size: new Blob([responseBody]).size,
      };

      onUpdateTab({ graphqlResponse });
      onAddToHistory({ ...tab, graphqlResponse });
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
      onUpdateTab({ graphqlResponse: errorResponse });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-pink-500/20 text-pink-600 border border-pink-500/30">
          <Braces className="h-4 w-4" />
          <span className="text-sm font-bold">GQL</span>
        </div>

        <Input
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value })}
          placeholder="https://api.example.com/graphql"
          className="flex-1 h-9 font-mono text-sm"
        />

        <Button onClick={sendRequest} disabled={isLoading || !request.url} className="h-9">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="ml-2">Execute</span>
        </Button>
      </div>

      {/* Request Config */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="query" className="flex-1 flex flex-col">
          <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent px-3">
            <TabsTrigger value="query" className="text-xs">
              Query
            </TabsTrigger>
            <TabsTrigger value="variables" className="text-xs">
              Variables
            </TabsTrigger>
            <TabsTrigger value="headers" className="text-xs">
              Headers
              {request.headers.filter(h => h.enabled).length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  ({request.headers.filter(h => h.enabled).length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="auth" className="text-xs">
              Auth
              {request.auth.type !== 'none' && (
                <span className="ml-1 h-2 w-2 rounded-full bg-green-500" />
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-3">
            <TabsContent value="query" className="m-0 h-full">
              <Textarea
                value={request.query}
                onChange={(e) => updateRequest({ query: e.target.value })}
                placeholder={`query {
  users {
    id
    name
    email
  }
}`}
                className="min-h-[200px] h-full font-mono text-sm resize-none"
              />
            </TabsContent>

            <TabsContent value="variables" className="m-0">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Variables (JSON)
              </Label>
              <Textarea
                value={request.variables}
                onChange={(e) => updateRequest({ variables: e.target.value })}
                placeholder={`{
  "id": "123",
  "limit": 10
}`}
                className="min-h-[200px] font-mono text-sm"
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
          <ResponseViewer response={tab.graphqlResponse} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
