/**
 * MOCK / DEMO DATA — Incidents
 * This data is used when:
 *  - Demo Mode is enabled
 *  - The backend is unavailable
 * This is clearly separated from real API data.
 * Components display this exactly as they would real backend data.
 */

import type { Incident } from '@/types/incident';

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'AE-2026-0041',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    cameraId: 'CAM-03',
    location: 'Thokar Niaz Baig Flyover',
    gps: { lat: 31.4697, lng: 74.2728 },
    severity: 'HIGH',
    confidence: 0.94,
    vehicles: [
      { type: 'car', confidence: 0.97 },
      { type: 'motorcycle', confidence: 0.91 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: true,
    opticalFlowScore: 87.4,
    description: 'High-speed rear collision detected. Two vehicles involved.',
  },
  {
    id: 'AE-2026-0040',
    timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    cameraId: 'CAM-01',
    location: 'Canal Bank Road Junction',
    gps: { lat: 31.5204, lng: 74.3587 },
    severity: 'MEDIUM',
    confidence: 0.82,
    vehicles: [
      { type: 'rickshaw', confidence: 0.88 },
      { type: 'car', confidence: 0.79 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: true,
    opticalFlowScore: 52.1,
    description: 'Side-impact collision at intersection.',
  },
  {
    id: 'AE-2026-0039',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    cameraId: 'CAM-02',
    location: 'Gulberg Main Boulevard',
    gps: { lat: 31.5110, lng: 74.3431 },
    severity: 'LOW',
    confidence: 0.71,
    vehicles: [
      { type: 'motorcycle', confidence: 0.74 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: true,
    opticalFlowScore: 28.3,
    description: 'Minor fender bender. Single motorcycle involved.',
  },
  {
    id: 'AE-2026-0038',
    timestamp: new Date(Date.now() - 1000 * 60 * 185).toISOString(),
    cameraId: 'CAM-04',
    location: 'DHA Phase 5 Gate',
    gps: { lat: 31.4746, lng: 74.4129 },
    severity: 'HIGH',
    confidence: 0.96,
    vehicles: [
      { type: 'truck', confidence: 0.98 },
      { type: 'car', confidence: 0.95 },
      { type: 'motorcycle', confidence: 0.89 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: true,
    opticalFlowScore: 95.2,
    description: 'Multi-vehicle pile-up. Truck involved. Emergency response dispatched.',
  },
  {
    id: 'AE-2026-0037',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    cameraId: 'CAM-01',
    location: 'Canal Bank Road Junction',
    gps: { lat: 31.5204, lng: 74.3587 },
    severity: 'MEDIUM',
    confidence: 0.78,
    vehicles: [
      { type: 'car', confidence: 0.81 },
      { type: 'van', confidence: 0.77 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: true,
    opticalFlowScore: 61.8,
  },
  {
    id: 'AE-2026-0036',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    cameraId: 'CAM-05',
    location: 'Johar Town Chowk',
    gps: { lat: 31.4697, lng: 74.2728 },
    severity: 'LOW',
    confidence: 0.69,
    vehicles: [
      { type: 'rickshaw', confidence: 0.72 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: false,
    opticalFlowScore: 19.4,
  },
  {
    id: 'AE-2026-0035',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    cameraId: 'CAM-02',
    location: 'Gulberg Main Boulevard',
    gps: { lat: 31.5110, lng: 74.3431 },
    severity: 'HIGH',
    confidence: 0.91,
    vehicles: [
      { type: 'bus', confidence: 0.93 },
      { type: 'motorcycle', confidence: 0.88 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: true,
    opticalFlowScore: 84.7,
    description: 'Bus-motorcycle collision. Emergency services notified.',
  },
  {
    id: 'AE-2026-0034',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    cameraId: 'CAM-03',
    location: 'Thokar Niaz Baig Flyover',
    gps: { lat: 31.4697, lng: 74.2728 },
    severity: 'MEDIUM',
    confidence: 0.83,
    vehicles: [
      { type: 'car', confidence: 0.86 },
      { type: 'car', confidence: 0.81 },
    ],
    alertStatus: 'SENT',
    blackboxAvailable: true,
    opticalFlowScore: 55.6,
  },
];

export const MOCK_STATS = {
  totalIncidentsToday: 4,
  highSeverityToday: 2,
  activeCameras: 5,
  offlineCameras: 1,
  avgConfidence: 0.84,
  alertsSentToday: 4,
};
