import styled, { css, keyframes } from 'styled-components';
import type { FieldHelpTone } from './FieldHelp.types';

const helpColors: Record<FieldHelpTone, string> = {
  accent: 'var(--help-accent)', positive: 'var(--clearneonGreen)',
  warning: 'var(--neonYellow)', gold: 'var(--deepneonYellow)',
  danger: 'var(--clearneonRed)', muted: 'var(--grey)',
};

const appear = keyframes`
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

export const HelpAnchor = styled.span<{ $inline?: boolean }>`
  position: ${({ $inline }) => $inline ? 'relative' : 'absolute'};
  top: 0;
  right: 0;
  z-index: 3;
  display: inline-flex;
  flex: 0 0 auto;
  vertical-align: middle;
  ${({ $inline }) => $inline && 'margin-left: 8px;'}
`;

// Help remains usable inside a disabled/read-only fieldset.
export const HelpButton = styled.span<{ $dark: boolean; $neon: boolean; $inline?: boolean; $small?: boolean }>`
  display: inline-flex;
  width: ${({ $small, $inline }) => $small ? '20px' : $inline ? '25px' : '32px'};
  height: ${({ $small, $inline }) => $small ? '20px' : $inline ? '25px' : '32px'};
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--grey)'};
  border-radius: ${({ $inline }) => $inline ? '5px' : '0 7px 0 7px'};
  padding: 0;
  background: ${({ $dark }) => $dark ? 'rgba(0, 10, 22, 0.94)' : 'rgba(245, 250, 255, 0.96)'};
  color: ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--grey)'} !important;
  cursor: pointer;
  transition: color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  svg { width: ${({ $small }) => $small ? '14px' : '18px'}; height: ${({ $small }) => $small ? '14px' : '18px'}; color: inherit !important; fill: currentColor; }
  &:hover, &:focus-visible, &[aria-expanded='true'] {
    color: var(--clearneonBlue) !important;
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 8px rgba(0, 204, 255, 0.32);
    outline: none;
  }
`;

export const HelpPopover = styled.aside<{
  $dark: boolean; $neon: boolean; $top: number; $left: number; $width: number; $height: number; $open: boolean;
  $below: boolean; $arrowLeft: number; $compact?: boolean;
}>`
  --help-accent: ${({ $dark }) => $dark ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: ${({ $width }) => $width}px;
  max-height: ${({ $height }) => $height}px;
  z-index: 110000;
  overflow: visible;
  box-sizing: border-box;
  border: 1px solid ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--grey)'};
  border-radius: 7px;
  padding: 0;
  background: ${({ $dark }) => $dark ? 'rgba(1, 10, 24, 0.98)' : 'rgba(248, 252, 255, 0.99)'};
  color: ${({ $dark, $compact }) => $dark ? $compact ? 'var(--lightGrey)' : 'var(--whitesmoke)' : 'var(--deepgrey)'} !important;
  box-shadow: ${({ $neon }) => $neon ? '0 0 16px rgba(0, 204, 255, 0.22)' : '0 10px 30px rgba(0, 0, 0, 0.22)'};
  font-family: 'Lato', sans-serif;
  font-size: ${({ $compact }) => $compact ? '11px' : '12px'};
  line-height: 1.55;
  animation: ${appear} 150ms ease both;
  opacity: ${({ $open }) => $open ? 1 : 0};
  transition: opacity 120ms ease, transform 120ms ease;
  ${({ $open }) => !$open && css`animation: none; transform: translateY(-4px); pointer-events: none;`}
  &::before {
    content: '';
    position: absolute;
    left: ${({ $arrowLeft }) => $arrowLeft}px;
    ${({ $below }) => $below ? 'top: -5px;' : 'bottom: -5px;'}
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
    background: inherit;
    border: inherit;
    ${({ $below }) => $below ? 'border-right: 0; border-bottom: 0;' : 'border-top: 0; border-left: 0;'}
    pointer-events: none;
  }
  p { margin: 0; color: inherit !important; white-space: pre-line; }
  dl { margin: 10px 0 0; }
  dt { margin-top: 7px; font-weight: 600; color: inherit !important; }
  dd { margin: 2px 0 0; color: inherit !important; }
  :root[data-motion='reduced'] & { animation: none; transition: none; }
`;

export const HelpPopoverScroll = styled.div<{ $height: number }>`
  position: relative;
  max-height: ${({ $height }) => Math.max(1, $height - 2)}px;
  padding: 14px 16px;
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: inherit;
  scrollbar-width: thin;
  scrollbar-color: var(--help-accent) transparent;
`;

export const HelpTitle = styled.strong<{ $tone: FieldHelpTone }>`
  && {
    display: block;
    margin: 0 0 10px;
    color: ${({ $tone }) => helpColors[$tone]} !important;
    font-family: 'DO Futuristic', sans-serif !important;
    font-size: 12px;
    font-weight: 100;
    line-height: 1.45;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
`;

export const HelpCode = styled.code<{ $tone: FieldHelpTone }>`
  border: 1px solid rgba(0, 204, 255, 0.24);
  border-radius: 3px;
  padding: 1px 4px;
  color: ${({ $tone }) => helpColors[$tone]} !important;
  background: rgba(0, 119, 180, 0.12);
  font: inherit;
  overflow-wrap: anywhere;
  box-decoration-break: clone;
`;

export const HelpEmphasis = styled.b<{ $tone: FieldHelpTone }>`
  color: ${({ $tone }) => helpColors[$tone]} !important;
  font-weight: 700;
`;

export const HelpItems = styled.ul<{ $plain: boolean }>`
  margin: 8px 0 0;
  padding-left: ${({ $plain }) => $plain ? 0 : '20px'};
  list-style: ${({ $plain }) => $plain ? 'none' : 'disc'};
  li { color: inherit !important; }
  li + li { margin-top: 8px; }
  & + [data-help-footer] { margin-top: 10px; }
`;

// Help overlays the corner; only the floating label wraps around it.
// Values, select arrows and search icons retain their original horizontal layout.
export const fieldHelpSpacing = css<{
  theme?: 'dark' | 'light'; neon?: 'on' | 'off'; typeStyle?: 'primary' | 'secondary';
}>`
  --field-help-active-border: ${({ theme, neon, typeStyle }) => neon === 'on' ? '#fff'
    : (theme === 'dark') === (typeStyle !== 'secondary') ? 'var(--clearneonBlue)' : 'var(--clearneonPink)'};
  &[data-validation-error='true'] { --field-help-active-border: var(--clearneonRed); }

  /* The help tile covers this part of the field outline. Continue only the
     outer edges through it, using CSS state (no focus listeners/rerenders). */
  &:has(> label > input:focus, > label > textarea:focus,
    > label > button:focus-visible, > label > button[aria-expanded='true'],
    > label > [data-field-active='true']) > [data-field-help] > [role='button'] {
    border-top: 2px solid var(--field-help-active-border);
    border-right: 2px solid var(--field-help-active-border);
  }

  &:has(> [data-field-help]) > label > [data-field-label] {
    right: 38px;
    margin-right: 0;
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.3;
  }
  &[data-field-label-wrapped] {
    min-height: calc(54.2px + var(--field-help-label-extra, 0px));
  }
  &[data-field-label-wrapped] > label > input,
  &[data-field-label-wrapped] > label > textarea,
  &[data-field-label-wrapped] > label > button,
  &[data-field-label-wrapped] > label > [data-field-value] {
    padding-top: calc(25px + var(--field-help-label-extra, 0px));
    min-height: calc(54.2px + var(--field-help-label-extra, 0px));
  }
`;
