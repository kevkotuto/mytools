'use client';

import { useApiTester } from './hooks/useApiTester';
import { TabsManager } from './components/TabsManager';
import { Sidebar } from './components/Sidebar';
import { RestClient } from './components/RestClient';
import { WebSocketClient } from './components/WebSocketClient';
import { SocketIOClient } from './components/SocketIOClient';
import { SSEClient } from './components/SSEClient';
import { GraphQLClient } from './components/GraphQLClient';

export default function ApiTesterPage() {
  const {
    state,
    activeTab,
    addTab,
    closeTab,
    setActiveTab,
    updateTab,
    duplicateTab,
    replaceVariables,
    saveAuth,
    deleteAuth,
    saveRequest,
    deleteRequest,
    loadRequest,
    addEnvironment,
    updateEnvironment,
    setActiveEnvironment,
    deleteEnvironment,
    addToHistory,
    clearHistory,
    getWsRef,
    setWsRef,
    getSseRef,
    setSseRef,
  } = useApiTester();

  const renderClient = () => {
    if (!activeTab) return null;

    switch (activeTab.type) {
      case 'rest':
        return (
          <RestClient
            tab={activeTab}
            onUpdateTab={(updates) => updateTab(activeTab.id, updates)}
            savedAuths={state.savedAuths}
            onSaveAuth={saveAuth}
            onDeleteAuth={deleteAuth}
            replaceVariables={replaceVariables}
            onAddToHistory={addToHistory}
          />
        );
      case 'websocket':
        return (
          <WebSocketClient
            tab={activeTab}
            onUpdateTab={(updates) => updateTab(activeTab.id, updates)}
            replaceVariables={replaceVariables}
            getWsRef={getWsRef}
            setWsRef={setWsRef}
          />
        );
      case 'socketio':
        return (
          <SocketIOClient
            tab={activeTab}
            onUpdateTab={(updates) => updateTab(activeTab.id, updates)}
            replaceVariables={replaceVariables}
          />
        );
      case 'sse':
        return (
          <SSEClient
            tab={activeTab}
            onUpdateTab={(updates) => updateTab(activeTab.id, updates)}
            replaceVariables={replaceVariables}
            getSseRef={getSseRef}
            setSseRef={setSseRef}
          />
        );
      case 'graphql':
        return (
          <GraphQLClient
            tab={activeTab}
            onUpdateTab={(updates) => updateTab(activeTab.id, updates)}
            savedAuths={state.savedAuths}
            onSaveAuth={saveAuth}
            onDeleteAuth={deleteAuth}
            replaceVariables={replaceVariables}
            onAddToHistory={addToHistory}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-2 flex items-center gap-3">
        <h1 className="text-lg font-bold">API Tester</h1>
        <span className="text-xs text-muted-foreground">
          REST • WebSocket • Socket.IO • GraphQL • SSE
        </span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          history={state.history}
          savedRequests={state.savedRequests}
          environments={state.environments}
          activeEnvironmentId={state.activeEnvironmentId}
          onLoadRequest={loadRequest}
          onDeleteRequest={deleteRequest}
          onClearHistory={clearHistory}
          onSaveCurrentRequest={saveRequest}
          currentTab={activeTab}
          onAddEnvironment={addEnvironment}
          onUpdateEnvironment={updateEnvironment}
          onDeleteEnvironment={deleteEnvironment}
          onSetActiveEnvironment={setActiveEnvironment}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <TabsManager
            tabs={state.tabs}
            activeTabId={state.activeTabId}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
            onAddTab={addTab}
            onDuplicateTab={duplicateTab}
          />

          {/* Client Area */}
          <div className="flex-1 overflow-hidden">{renderClient()}</div>
        </div>
      </div>
    </div>
  );
}
