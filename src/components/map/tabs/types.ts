import type React from 'react';

export type Tab = 'home' | 'my' | 'all' | 'profile' | 'settings' | 'auth';
export type SettingsView = 'main' | 'about' | 'feedback' | 'profile';
export type SheetMode = 'tabs' | 'marker' | 'rubric' | null;

export type UserProfile = {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string | null;
  /** Backend role: user | admin | premium */
  role?: string;
};

export type TrustProgress = {
  confirmed: number;
  useful: number;
  reputationScore: number;
  level: string;
};

export type IncidentSummary = {
  id: number;
  userId: number;
  title: string;
  category: string;
  status: string;
  address?: string;
};

export type IncidentForMapAction = IncidentSummary & {
  lat: number;
  lng: number;
};

export type IncidentWithDistance = IncidentForMapAction & {
  distanceLabel: string;
};

export type IncidentDetailsMap = Record<number, { tags: string[] }>;

export type ProfileTabComponent = React.ComponentType<{
  userId: number;
  onAvatarChange?: (url: string | null) => void;
  onOpenMyReports?: () => void;
  onOpenSettings?: () => void;
}>;
