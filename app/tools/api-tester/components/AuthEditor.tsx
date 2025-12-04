'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthConfig, AuthType, SavedAuth } from '../types';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface AuthEditorProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
  savedAuths: SavedAuth[];
  onSaveAuth: (name: string, config: AuthConfig) => void;
  onDeleteAuth: (id: string) => void;
  onLoadAuth: (config: AuthConfig) => void;
}

export function AuthEditor({
  auth,
  onChange,
  savedAuths,
  onSaveAuth,
  onDeleteAuth,
  onLoadAuth,
}: AuthEditorProps) {
  const [saveName, setSaveName] = useState('');

  const handleTypeChange = (type: AuthType) => {
    const newAuth: AuthConfig = { type };
    if (type === 'bearer') newAuth.bearer = { token: '' };
    if (type === 'basic') newAuth.basic = { username: '', password: '' };
    if (type === 'api-key') newAuth.apiKey = { key: '', value: '', addTo: 'header' };
    if (type === 'oauth2') newAuth.oauth2 = { accessToken: '', tokenType: 'Bearer' };
    onChange(newAuth);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
          <Select value={auth.type} onValueChange={(v) => handleTypeChange(v as AuthType)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Auth</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
              <SelectItem value="api-key">API Key</SelectItem>
              <SelectItem value="oauth2">OAuth 2.0</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {savedAuths.length > 0 && (
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Load Saved</Label>
            <Select onValueChange={(id) => {
              const saved = savedAuths.find(a => a.id === id);
              if (saved) onLoadAuth(saved.config);
            }}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select saved auth" />
              </SelectTrigger>
              <SelectContent>
                {savedAuths.map((saved) => (
                  <SelectItem key={saved.id} value={saved.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{saved.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({saved.config.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {auth.type === 'bearer' && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Token</Label>
          <Input
            value={auth.bearer?.token || ''}
            onChange={(e) => onChange({ ...auth, bearer: { token: e.target.value } })}
            placeholder="Enter bearer token"
            className="h-8 text-sm font-mono"
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Username</Label>
            <Input
              value={auth.basic?.username || ''}
              onChange={(e) =>
                onChange({
                  ...auth,
                  basic: { ...auth.basic!, username: e.target.value },
                })
              }
              placeholder="Username"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Password</Label>
            <Input
              type="password"
              value={auth.basic?.password || ''}
              onChange={(e) =>
                onChange({
                  ...auth,
                  basic: { ...auth.basic!, password: e.target.value },
                })
              }
              placeholder="Password"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {auth.type === 'api-key' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Key Name</Label>
              <Input
                value={auth.apiKey?.key || ''}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    apiKey: { ...auth.apiKey!, key: e.target.value },
                  })
                }
                placeholder="X-API-Key"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Value</Label>
              <Input
                value={auth.apiKey?.value || ''}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    apiKey: { ...auth.apiKey!, value: e.target.value },
                  })
                }
                placeholder="API Key Value"
                className="h-8 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Add to</Label>
            <Select
              value={auth.apiKey?.addTo || 'header'}
              onValueChange={(v) =>
                onChange({
                  ...auth,
                  apiKey: { ...auth.apiKey!, addTo: v as 'header' | 'query' },
                })
              }
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query Params</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {auth.type === 'oauth2' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Access Token</Label>
            <Input
              value={auth.oauth2?.accessToken || ''}
              onChange={(e) =>
                onChange({
                  ...auth,
                  oauth2: { ...auth.oauth2!, accessToken: e.target.value },
                })
              }
              placeholder="Access Token"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Token Type</Label>
            <Input
              value={auth.oauth2?.tokenType || 'Bearer'}
              onChange={(e) =>
                onChange({
                  ...auth,
                  oauth2: { ...auth.oauth2!, tokenType: e.target.value },
                })
              }
              placeholder="Bearer"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {auth.type !== 'none' && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Auth name..."
            className="h-8 text-sm flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (saveName.trim()) {
                onSaveAuth(saveName.trim(), auth);
                setSaveName('');
              }
            }}
            disabled={!saveName.trim()}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      )}

      {savedAuths.length > 0 && (
        <div className="pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Saved Credentials</Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {savedAuths.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
              >
                <div>
                  <span className="font-medium">{saved.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({saved.config.type})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDeleteAuth(saved.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
