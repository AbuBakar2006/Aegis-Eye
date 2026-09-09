export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'error';

export interface SystemStatus {
  apiConnected: boolean;
  lastChecked: string;
  version?: string;
  activeCameras: number;
  totalIncidentsToday: number;
}
