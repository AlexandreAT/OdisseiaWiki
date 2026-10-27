import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';

export interface HolographicPreviewMedia {
  name: string;
  src?: string;
  icon?: ReactNode;
  /** Plain text, safely escaped; long descriptions scroll inside the projection. */
  description?: string;
  /** Optional read-only information panel, replacing the image without changing the hologram shell. */
  content?: ReactNode;
}

export interface HolographicPreviewAppearance {
  /** Any CSS color, including a site palette variable. */
  color?: string;
  neon?: boolean;
  /** Maximum square size in pixels; always constrained to the viewport. Default: 360. */
  size?: number;
  background?: string;
  textColor?: string;
  imageFit?: 'contain' | 'cover';
}

export type HolographicPreviewProviderProps = PropsWithChildren<HolographicPreviewAppearance & {
  hoverCloseDelay?: number;
  onOpenChange?: (open: boolean) => void;
}>;

export interface HolographicPreviewTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  media: HolographicPreviewMedia;
  /** Overrides the surrounding provider's defaults for this image only. */
  appearance?: HolographicPreviewAppearance;
  activation?: 'hover-click' | 'click';
}

/** Convenient isolated preview; use a shared provider and triggers for lists. */
export interface HolographicPreviewProps extends HolographicPreviewTriggerProps {
  hoverCloseDelay?: number;
  onOpenChange?: (open: boolean) => void;
}
