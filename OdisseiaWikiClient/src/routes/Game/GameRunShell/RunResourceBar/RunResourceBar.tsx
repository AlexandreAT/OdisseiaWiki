import { ResourceBarValue, ResourceFill, ResourceItem, ResourceLabels, ResourceTrack } from '../GameRunShell.style';

export type RunResourceTone = 'life' | 'mana' | 'stamina' | 'protection';

export interface RunResourceBarProps {
  label: string;
  value: number;
  max: number;
  tone: RunResourceTone;
}

export function RunResourceBar({ label, value, max, tone }: RunResourceBarProps) {
  const safeMax = Number.isFinite(max) ? Math.max(0, max) : 0;
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const percent = safeMax > 0 ? Math.min(100, (safeValue / safeMax) * 100) : 0;

  return <ResourceItem>
    <ResourceLabels><span>{label}</span><strong>{safeValue} / {safeMax}</strong></ResourceLabels>
    <ResourceTrack role="progressbar" aria-label={label} aria-valuemin={0}
      aria-valuemax={Math.max(1, safeMax)} aria-valuenow={Math.min(Math.max(1, safeMax), safeValue)}>
      <ResourceFill $tone={tone} $percent={percent} />
      <ResourceBarValue aria-hidden="true">{safeValue} / {safeMax}</ResourceBarValue>
    </ResourceTrack>
  </ResourceItem>;
}
