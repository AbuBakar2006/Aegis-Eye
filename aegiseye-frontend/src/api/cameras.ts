/**
 * AegisEye Cameras API Service
 *
 * NOTE: The backend does not currently expose a /api/cameras endpoint.
 * This service returns MOCK DATA until the backend developer adds this endpoint.
 * When the real endpoint is available, replace the mock implementation below
 * with a real apiClient.get() call — the components will not need to change.
 */

import type { Camera } from '@/types/camera';
import { MOCK_CAMERAS } from '@/data/mockCameras';

export const cameraService = {
  /**
   * Get all cameras.
   * MOCK: Returns demo data. Replace with apiClient.get<Camera[]>('/api/cameras') when ready.
   */
  async getCameras(): Promise<Camera[]> {
    // Simulate network delay for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_CAMERAS;
  },

  /**
   * Get a single camera by ID.
   */
  async getCameraById(id: string): Promise<Camera | undefined> {
    const cameras = await cameraService.getCameras();
    return cameras.find((c) => c.id === id);
  },
};
