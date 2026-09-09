/**
 * MOCK / DEMO DATA — Cameras
 * Used until the backend exposes /api/cameras.
 * Replace cameraService.getCameras() implementation in api/cameras.ts
 * when the real endpoint is available.
 */

import type { Camera } from '@/types/camera';

export const MOCK_CAMERAS: Camera[] = [
  {
    id: 'CAM-01',
    name: 'Canal Bank Junction',
    location: 'Canal Bank Road Junction, Lahore',
    status: 'ONLINE',
    streamUrl: undefined, // Will be provided by backend
    streamFormat: 'mjpeg',
    fps: 25,
    resolution: '1920x1080',
    lastSeen: new Date().toISOString(),
    detectionEnabled: true,
    overlayInfo: {
      vehiclesDetected: 3,
      confidence: 0.89,
      isProcessing: true,
      lastDetectionAt: new Date(Date.now() - 3000).toISOString(),
    },
  },
  {
    id: 'CAM-02',
    name: 'Gulberg Boulevard',
    location: 'Gulberg Main Boulevard, Lahore',
    status: 'ONLINE',
    streamUrl: undefined,
    streamFormat: 'mjpeg',
    fps: 25,
    resolution: '1920x1080',
    lastSeen: new Date().toISOString(),
    detectionEnabled: true,
    overlayInfo: {
      vehiclesDetected: 7,
      confidence: 0.92,
      isProcessing: true,
    },
  },
  {
    id: 'CAM-03',
    name: 'Thokar Niaz Baig',
    location: 'Thokar Niaz Baig Flyover, Lahore',
    status: 'ALERT',
    streamUrl: undefined,
    streamFormat: 'mjpeg',
    fps: 25,
    resolution: '1920x1080',
    lastSeen: new Date().toISOString(),
    detectionEnabled: true,
    activeIncident: 'AE-2026-0041',
    overlayInfo: {
      vehiclesDetected: 2,
      confidence: 0.94,
      isProcessing: true,
      lastDetectionAt: new Date(Date.now() - 8 * 60000).toISOString(),
    },
  },
  {
    id: 'CAM-04',
    name: 'DHA Phase 5',
    location: 'DHA Phase 5 Main Gate, Lahore',
    status: 'ONLINE',
    streamUrl: undefined,
    streamFormat: 'mjpeg',
    fps: 30,
    resolution: '2560x1440',
    lastSeen: new Date().toISOString(),
    detectionEnabled: true,
    overlayInfo: {
      vehiclesDetected: 1,
      confidence: 0.78,
      isProcessing: true,
    },
  },
  {
    id: 'CAM-05',
    name: 'Johar Town Chowk',
    location: 'Johar Town Main Chowk, Lahore',
    status: 'ONLINE',
    streamUrl: undefined,
    streamFormat: 'mjpeg',
    fps: 25,
    resolution: '1920x1080',
    lastSeen: new Date().toISOString(),
    detectionEnabled: true,
    overlayInfo: {
      vehiclesDetected: 5,
      confidence: 0.85,
      isProcessing: true,
    },
  },
  {
    id: 'CAM-06',
    name: 'Liberty Market',
    location: 'Liberty Market Roundabout, Lahore',
    status: 'OFFLINE',
    streamUrl: undefined,
    fps: 0,
    resolution: '1920x1080',
    lastSeen: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    detectionEnabled: false,
    overlayInfo: {
      vehiclesDetected: 0,
      isProcessing: false,
    },
  },
];
