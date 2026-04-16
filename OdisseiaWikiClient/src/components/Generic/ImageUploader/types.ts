export type CropShape = 'square' | 'circle' | 'rectangle';
export type UploaderMode = 'single' | 'gallery';

export interface CropPreset {
  mode: UploaderMode;
  aspectRatio: number | number[];
  shape: CropShape;
  displayShape?: CropShape;
  label?: string;
}

export interface CropperState {
  scale: number;
  x: number;
  y: number;
}

export interface CropResult {
  file: File;
  preview: string;
}

export interface ImageUploaderProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  cropPreset: CropPreset;
  onImageCropped: (result: CropResult) => void;
  initialImage?: string;
  onCancel?: () => void;
  accept?: string;
  label?: string;
}

export interface ImageCropperModalProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  isOpen: boolean;
  imageUrl: string;
  cropPreset: CropPreset;
  onConfirm: (result: CropResult) => void;
  onCancel: () => void;
}

export interface CropperControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}
