// Types pour l'API Tester

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type ConnectionType = 'rest' | 'websocket' | 'socketio' | 'graphql' | 'sse';
export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2';
export type BodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface AuthConfig {
  type: AuthType;
  bearer?: { token: string };
  basic?: { username: string; password: string };
  apiKey?: { key: string; value: string; addTo: 'header' | 'query' };
  oauth2?: { accessToken: string; tokenType: string };
}

export interface RequestBody {
  type: BodyType;
  content: string;
  formData?: KeyValue[];
}

export interface RestRequest {
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: RequestBody;
  auth: AuthConfig;
}

export interface RestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export interface WebSocketMessage {
  id: string;
  type: 'sent' | 'received';
  data: string;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  headers?: KeyValue[];
}

export interface SocketIOConfig {
  url: string;
  path?: string;
  transports?: ('websocket' | 'polling')[];
  auth?: Record<string, string>;
  query?: KeyValue[];
}

export interface SocketIOEvent {
  id: string;
  type: 'emit' | 'receive' | 'connect' | 'disconnect' | 'error';
  event: string;
  data: string;
  timestamp: number;
}

export interface SSEConfig {
  url: string;
  headers?: KeyValue[];
  withCredentials?: boolean;
}

export interface SSEEvent {
  id: string;
  type: string;
  data: string;
  timestamp: number;
}

export interface GraphQLRequest {
  url: string;
  query: string;
  variables: string;
  headers: KeyValue[];
  auth: AuthConfig;
}

export interface Tab {
  id: string;
  name: string;
  type: ConnectionType;
  // REST
  restRequest?: RestRequest;
  restResponse?: RestResponse | null;
  // WebSocket
  wsConfig?: WebSocketConfig;
  wsMessages?: WebSocketMessage[];
  wsConnected?: boolean;
  // Socket.IO
  sioConfig?: SocketIOConfig;
  sioEvents?: SocketIOEvent[];
  sioConnected?: boolean;
  sioListeningEvents?: string[];
  // SSE
  sseConfig?: SSEConfig;
  sseEvents?: SSEEvent[];
  sseConnected?: boolean;
  // GraphQL
  graphqlRequest?: GraphQLRequest;
  graphqlResponse?: RestResponse | null;
  // Meta
  isLoading?: boolean;
}

export interface SavedAuth {
  id: string;
  name: string;
  config: AuthConfig;
  createdAt: number;
}

export interface SavedRequest {
  id: string;
  name: string;
  tab: Tab;
  createdAt: number;
  folderId?: string;
}

export interface RequestFolder {
  id: string;
  name: string;
  requests: SavedRequest[];
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
  isActive: boolean;
}

export interface ApiTesterState {
  tabs: Tab[];
  activeTabId: string;
  savedAuths: SavedAuth[];
  savedRequests: SavedRequest[];
  folders: RequestFolder[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  history: SavedRequest[];
}

// Fonctions utilitaires pour créer des valeurs par défaut
export const createDefaultRestRequest = (): RestRequest => ({
  method: 'GET',
  url: '',
  headers: [],
  params: [],
  body: { type: 'none', content: '' },
  auth: { type: 'none' },
});

export const createDefaultTab = (type: ConnectionType = 'rest'): Tab => {
  const id = crypto.randomUUID();
  const base = { id, name: 'New Request', type };

  switch (type) {
    case 'rest':
      return { ...base, restRequest: createDefaultRestRequest(), restResponse: null };
    case 'websocket':
      return { ...base, wsConfig: { url: '' }, wsMessages: [], wsConnected: false };
    case 'socketio':
      return {
        ...base,
        sioConfig: { url: '', transports: ['websocket', 'polling'] },
        sioEvents: [],
        sioConnected: false,
        sioListeningEvents: [],
      };
    case 'sse':
      return { ...base, sseConfig: { url: '' }, sseEvents: [], sseConnected: false };
    case 'graphql':
      return {
        ...base,
        graphqlRequest: {
          url: '',
          query: '',
          variables: '{}',
          headers: [],
          auth: { type: 'none' },
        },
        graphqlResponse: null,
      };
    default:
      return { ...base, restRequest: createDefaultRestRequest(), restResponse: null };
  }
};

export const createKeyValue = (key = '', value = ''): KeyValue => ({
  id: crypto.randomUUID(),
  key,
  value,
  enabled: true,
});
