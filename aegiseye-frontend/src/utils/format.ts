import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { Severity } from '@/types/incident';

export function formatTimestamp(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy HH:mm:ss');
  } catch {
    return iso;
  }
}

export function formatTimeAgo(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatShortTime(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm:ss');
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

export function formatGps(lat: number, lng: number): string {
  return `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`;
}

export function severityColor(severity: Severity): string {
  switch (severity) {
    case 'HIGH':
      return 'text-red-400';
    case 'MEDIUM':
      return 'text-orange-400';
    case 'LOW':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}

export function severityBgColor(severity: Severity): string {
  switch (severity) {
    case 'HIGH':
      return 'bg-red-500/20 border-red-500/40';
    case 'MEDIUM':
      return 'bg-orange-500/20 border-orange-500/40';
    case 'LOW':
      return 'bg-yellow-500/20 border-yellow-500/40';
    default:
      return 'bg-gray-500/20 border-gray-500/40';
  }
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function vehicleTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    car: '🚗',
    motorcycle: '🏍️',
    truck: '🚛',
    bus: '🚌',
    rickshaw: '🛺',
    van: '🚐',
    bicycle: '🚲',
    unknown: '🚘',
  };
  return icons[type.toLowerCase()] ?? icons.unknown;
}
