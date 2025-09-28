export interface CharacterFormData {
  name: string;
  race?: number;
  city?: number;
}

export interface CharacterFormErrors {
  name?: string;
  race?: string;
}