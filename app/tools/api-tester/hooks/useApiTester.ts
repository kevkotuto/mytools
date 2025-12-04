'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ApiTesterState,
  Tab,
  ConnectionType,
  createDefaultTab,
  SavedAuth,
  SavedRequest,
  Environment,
  KeyValue,
  createKeyValue,
} from '../types';

const STORAGE_KEY = 'api-tester-state';

const getInitialState = (): ApiTesterState => {
  if (typeof window === 'undefined') {
    return {
      tabs: [createDefaultTab('rest')],
      activeTabId: '',
      savedAuths: [],
      savedRequests: [],
      folders: [],
      environments: [],
      activeEnvironmentId: null,
      history: [],
    };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Valider que les données sont correctes
      if (parsed.tabs && parsed.tabs.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }

  const firstTab = createDefaultTab('rest');
  return {
    tabs: [firstTab],
    activeTabId: firstTab.id,
    savedAuths: [],
    savedRequests: [],
    folders: [],
    environments: [],
    activeEnvironmentId: null,
    history: [],
  };
};

export function useApiTester() {
  const [state, setState] = useState<ApiTesterState>(getInitialState);
  const wsRefs = useRef<Map<string, WebSocket>>(new Map());
  const sseRefs = useRef<Map<string, EventSource>>(new Map());

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && state.activeTabId) {
      const toSave = {
        ...state,
        tabs: state.tabs.map(tab => ({
          ...tab,
          wsConnected: false,
          sioConnected: false,
          sseConnected: false,
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [state]);

  // Tab management
  const addTab = useCallback((type: ConnectionType = 'rest') => {
    const newTab = createDefaultTab(type);
    setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id,
    }));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState(prev => {
      const tabIndex = prev.tabs.findIndex(t => t.id === tabId);
      const newTabs = prev.tabs.filter(t => t.id !== tabId);

      if (newTabs.length === 0) {
        const newTab = createDefaultTab('rest');
        return { ...prev, tabs: [newTab], activeTabId: newTab.id };
      }

      let newActiveId = prev.activeTabId;
      if (prev.activeTabId === tabId) {
        newActiveId = newTabs[Math.min(tabIndex, newTabs.length - 1)].id;
      }

      return { ...prev, tabs: newTabs, activeTabId: newActiveId };
    });
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState(prev => ({ ...prev, activeTabId: tabId }));
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }));
  }, []);

  const duplicateTab = useCallback((tabId: string) => {
    setState(prev => {
      const tab = prev.tabs.find(t => t.id === tabId);
      if (!tab) return prev;

      const newTab: Tab = {
        ...JSON.parse(JSON.stringify(tab)),
        id: crypto.randomUUID(),
        name: `${tab.name} (copy)`,
        wsConnected: false,
        sioConnected: false,
        sseConnected: false,
      };

      return {
        ...prev,
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  }, []);

  // Active tab helper
  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];

  // Variable replacement
  const replaceVariables = useCallback((text: string): string => {
    const activeEnv = state.environments.find(e => e.id === state.activeEnvironmentId);
    if (!activeEnv) return text;

    let result = text;
    activeEnv.variables.forEach(v => {
      if (v.enabled) {
        result = result.replace(new RegExp(`{{${v.key}}}`, 'g'), v.value);
      }
    });
    return result;
  }, [state.environments, state.activeEnvironmentId]);

  // Auth management
  const saveAuth = useCallback((name: string, config: SavedAuth['config']) => {
    const newAuth: SavedAuth = {
      id: crypto.randomUUID(),
      name,
      config,
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      savedAuths: [...prev.savedAuths, newAuth],
    }));
  }, []);

  const deleteAuth = useCallback((authId: string) => {
    setState(prev => ({
      ...prev,
      savedAuths: prev.savedAuths.filter(a => a.id !== authId),
    }));
  }, []);

  // Request management
  const saveRequest = useCallback((name: string, tab: Tab) => {
    const newRequest: SavedRequest = {
      id: crypto.randomUUID(),
      name,
      tab: JSON.parse(JSON.stringify(tab)),
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      savedRequests: [...prev.savedRequests, newRequest],
    }));
  }, []);

  const deleteRequest = useCallback((requestId: string) => {
    setState(prev => ({
      ...prev,
      savedRequests: prev.savedRequests.filter(r => r.id !== requestId),
    }));
  }, []);

  const loadRequest = useCallback((request: SavedRequest) => {
    const newTab: Tab = {
      ...JSON.parse(JSON.stringify(request.tab)),
      id: crypto.randomUUID(),
      wsConnected: false,
      sioConnected: false,
      sseConnected: false,
    };
    setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id,
    }));
  }, []);

  // Environment management
  const addEnvironment = useCallback((name: string) => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name,
      variables: [createKeyValue('baseUrl', 'http://localhost:3000')],
      isActive: false,
    };
    setState(prev => ({
      ...prev,
      environments: [...prev.environments, newEnv],
    }));
  }, []);

  const updateEnvironment = useCallback((envId: string, updates: Partial<Environment>) => {
    setState(prev => ({
      ...prev,
      environments: prev.environments.map(env =>
        env.id === envId ? { ...env, ...updates } : env
      ),
    }));
  }, []);

  const setActiveEnvironment = useCallback((envId: string | null) => {
    setState(prev => ({ ...prev, activeEnvironmentId: envId }));
  }, []);

  const deleteEnvironment = useCallback((envId: string) => {
    setState(prev => ({
      ...prev,
      environments: prev.environments.filter(e => e.id !== envId),
      activeEnvironmentId: prev.activeEnvironmentId === envId ? null : prev.activeEnvironmentId,
    }));
  }, []);

  // History management
  const addToHistory = useCallback((tab: Tab) => {
    const historyItem: SavedRequest = {
      id: crypto.randomUUID(),
      name: tab.restRequest?.url || tab.wsConfig?.url || tab.sioConfig?.url || 'Request',
      tab: JSON.parse(JSON.stringify(tab)),
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      history: [historyItem, ...prev.history].slice(0, 100),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  // WebSocket refs pour fermeture propre
  const getWsRef = useCallback((tabId: string) => wsRefs.current.get(tabId), []);
  const setWsRef = useCallback((tabId: string, ws: WebSocket | null) => {
    if (ws) {
      wsRefs.current.set(tabId, ws);
    } else {
      wsRefs.current.delete(tabId);
    }
  }, []);

  // SSE refs
  const getSseRef = useCallback((tabId: string) => sseRefs.current.get(tabId), []);
  const setSseRef = useCallback((tabId: string, sse: EventSource | null) => {
    if (sse) {
      sseRefs.current.set(tabId, sse);
    } else {
      sseRefs.current.delete(tabId);
    }
  }, []);

  return {
    state,
    activeTab,
    // Tab actions
    addTab,
    closeTab,
    setActiveTab,
    updateTab,
    duplicateTab,
    // Variable replacement
    replaceVariables,
    // Auth actions
    saveAuth,
    deleteAuth,
    // Request actions
    saveRequest,
    deleteRequest,
    loadRequest,
    // Environment actions
    addEnvironment,
    updateEnvironment,
    setActiveEnvironment,
    deleteEnvironment,
    // History actions
    addToHistory,
    clearHistory,
    // Connection refs
    getWsRef,
    setWsRef,
    getSseRef,
    setSseRef,
  };
}

export type UseApiTesterReturn = ReturnType<typeof useApiTester>;
