/**
 * AegisEye Incidents API Service
 * Wraps the backend endpoints:
 *   GET /api/incidents           — list all incidents
 *   GET /api/incidents/{id}/clip  — download blackbox clip
 *   GET /api/incidents/{id}/report — download PDF report
 */

import { apiClient } from './client';
import type { Incident, ApiIncidentResponse, Severity, AlertStatus, Vehicle } from '@/types/incident';

/**
 * Adapter — maps raw backend response to canonical Incident type.
 * When the backend developer updates the API, only this function needs to change.
 */
function adaptIncident(raw: ApiIncidentResponse): Incident {
  const severity = ((raw.severity as string) || 'MEDIUM').toUpperCase() as Severity;
  const alertStatus = ((raw.alert_status as string) || 'NONE').toUpperCase() as AlertStatus;

  // Handle vehicle types in multiple possible formats
  let vehicles: Vehicle[] = [];
  if (Array.isArray(raw.vehicles)) {
    vehicles = (raw.vehicles as ApiIncidentResponse[]).map((v) => {
      if (typeof v === 'string') return { type: v, confidence: 1 };
      if (typeof v === 'object' && v !== null) {
        const vo = v as Record<string, unknown>;
        return {
          type: (vo.type || vo.vehicle_type || vo.class || 'unknown') as string,
          confidence: (vo.confidence ?? vo.score ?? 1) as number,
          color: vo.color as string | undefined,
        };
      }
      return { type: 'unknown', confidence: 1 };
    });
  } else if (Array.isArray(raw.vehicle_types)) {
    vehicles = raw.vehicle_types.map((t) => ({ type: t, confidence: 1 }));
  }

  return {
    id: (raw.id || raw.incident_id || 'UNKNOWN') as string,
    timestamp: (raw.timestamp || raw.created_at || new Date().toISOString()) as string,
    cameraId: (raw.camera_id || raw.camera || 'CAM-?') as string,
    location: (raw.location || 'Unknown Location') as string,
    gps: raw.gps as Incident['gps'] | undefined,
    severity,
    confidence: (raw.confidence || raw.detection_confidence || 0) as number,
    vehicles,
    clipUrl: raw.clip_url as string | undefined,
    reportUrl: raw.report_url as string | undefined,
    alertStatus,
    blackboxAvailable: (raw.blackbox_available ?? !!raw.clip_url) as boolean,
    opticalFlowScore: raw.optical_flow_score as number | undefined,
    description: raw.description as string | undefined,
  };
}

export const incidentService = {
  /**
   * Fetch all incidents from the backend.
   * GET /api/incidents
   */
  async getIncidents(): Promise<Incident[]> {
    const raw = await apiClient.get<ApiIncidentResponse[]>('/api/incidents');
    return Array.isArray(raw) ? raw.map(adaptIncident) : [];
  },

  /**
   * Get the URL for a clip download.
   * GET /api/incidents/{id}/clip
   */
  getClipUrl(incidentId: string): string {
    return apiClient.buildUrl(`/api/incidents/${incidentId}/clip`);
  },

  /**
   * Get the URL for a PDF report download.
   * GET /api/incidents/{id}/report
   */
  getReportUrl(incidentId: string): string {
    return apiClient.buildUrl(`/api/incidents/${incidentId}/report`);
  },

  /**
   * Trigger a browser download for the clip.
   */
  async downloadClip(incidentId: string): Promise<void> {
    const blob = await apiClient.getBlob(`/api/incidents/${incidentId}/clip`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${incidentId}_clip.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Trigger a browser download for the PDF report.
   */
  async downloadReport(incidentId: string): Promise<void> {
    const blob = await apiClient.getBlob(`/api/incidents/${incidentId}/report`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${incidentId}_report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
