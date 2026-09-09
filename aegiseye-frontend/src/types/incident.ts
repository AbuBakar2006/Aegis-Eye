// TypeScript interfaces for Incident data
// These map to the backend API response from GET /api/incidents
// The adapter in api/incidents.ts handles field mapping from actual backend response

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertStatus = 'SENT' | 'PENDING' | 'FAILED' | 'NONE';

export interface Vehicle {
  type: string;          // e.g. 'car', 'rickshaw', 'motorcycle', 'truck'
  confidence: number;    // 0-1
  color?: string;
}

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

// Canonical frontend incident model
// Components use this — not raw backend response
export interface Incident {
  id: string;                    // e.g. "AE-2026-0012"
  timestamp: string;             // ISO 8601
  cameraId: string;              // e.g. "CAM-02"
  location: string;              // Human-readable location name
  gps?: GpsCoordinates;
  severity: Severity;
  confidence: number;            // Detection confidence 0-1
  vehicles: Vehicle[];
  clipUrl?: string;              // Blackbox clip URL from backend
  reportUrl?: string;            // PDF report URL from backend
  alertStatus: AlertStatus;
  blackboxAvailable: boolean;
  opticalFlowScore?: number;     // Raw optical flow value from backend severity engine
  description?: string;
}

// Raw API response shape from GET /api/incidents
// Adapt this when the backend developer confirms the actual schema
export interface ApiIncidentResponse {
  id?: string;
  incident_id?: string;
  timestamp?: string;
  created_at?: string;
  camera_id?: string;
  camera?: string;
  location?: string;
  severity?: string;
  confidence?: number;
  detection_confidence?: number;
  vehicles?: unknown[];
  vehicle_types?: string[];
  clip_url?: string;
  report_url?: string;
  alert_status?: string;
  blackbox_available?: boolean;
  [key: string]: unknown;
}
