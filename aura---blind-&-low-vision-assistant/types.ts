
export interface PersonProfile {
  id: string;
  name: string;
  relationship: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  description: string;
}

export enum AppState {
  SETUP = 'SETUP',
  LIVE = 'LIVE'
}
