/**
 * useIncidents hook
 * Wraps the incidents API with React Query for caching, loading, and error states.
 * Automatically uses mock data when Demo Mode is enabled.
 */

import { useQuery } from '@tanstack/react-query';
import { incidentService } from '@/api/incidents';
import { useAppStore } from '@/store/appStore';
import { MOCK_INCIDENTS } from '@/data/mockIncidents';
import type { Incident } from '@/types/incident';

export function useIncidents() {
  const demoMode = useAppStore((s) => s.demoMode);

  return useQuery<Incident[]>({
    queryKey: ['incidents', demoMode],
    queryFn: async () => {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 600));
        return MOCK_INCIDENTS;
      }
      return incidentService.getIncidents();
    },
    refetchInterval: demoMode ? false : 15000, // Live refresh every 15s when connected
    retry: demoMode ? false : 2,
    staleTime: 10000,
  });
}

export function useIncident(id: string) {
  const demoMode = useAppStore((s) => s.demoMode);

  return useQuery<Incident | undefined>({
    queryKey: ['incident', id, demoMode],
    queryFn: async () => {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 300));
        return MOCK_INCIDENTS.find((i) => i.id === id);
      }
      const all = await incidentService.getIncidents();
      return all.find((i) => i.id === id);
    },
    enabled: !!id,
    retry: demoMode ? false : 2,
  });
}
