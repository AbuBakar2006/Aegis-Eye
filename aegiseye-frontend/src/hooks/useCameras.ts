import { useQuery } from '@tanstack/react-query';
import { cameraService } from '@/api/cameras';
import { useAppStore } from '@/store/appStore';
import { MOCK_CAMERAS } from '@/data/mockCameras';
import type { Camera } from '@/types/camera';

export function useCameras() {
  const demoMode = useAppStore((s) => s.demoMode);

  return useQuery<Camera[]>({
    queryKey: ['cameras', demoMode],
    queryFn: async () => {
      if (demoMode) {
        return MOCK_CAMERAS;
      }
      return cameraService.getCameras();
    },
    refetchInterval: demoMode ? false : 10000,
    retry: demoMode ? false : 2,
    staleTime: 5000,
  });
}
