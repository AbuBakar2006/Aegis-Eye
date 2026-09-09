export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'ALERT' | 'MAINTENANCE';

export type StreamFormat = 'mjpeg' | 'hls' | 'webrtc' | 'rtsp' | 'static';

export interface Camera {
  id: string;                  // e.g. "CAM-01"
  name: string;                // Display name
  location: string;
  status: CameraStatus;
  streamUrl?: string;          // URL provided by backend for live feed
  streamFormat?: StreamFormat; // How to render the stream
  fps?: number;
  resolution?: string;         // e.g. "1920x1080"
  lastSeen?: string;           // ISO 8601 timestamp
  activeIncident?: string;     // Incident ID if currently in alert state
  detectionEnabled: boolean;
  overlayInfo?: CameraOverlay;
}

export interface CameraOverlay {
  vehiclesDetected: number;
  confidence?: number;
  isProcessing: boolean;
  lastDetectionAt?: string;
}

// Raw API response (mock — update when backend exposes /api/cameras)
export interface ApiCameraResponse {
  id?: string;
  camera_id?: string;
  name?: string;
  location?: string;
  status?: string;
  stream_url?: string;
  stream_format?: string;
  fps?: number;
  [key: string]: unknown;
}
