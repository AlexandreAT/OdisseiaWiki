/** Keep wrapped floating labels above the value without moving horizontal controls. */
export const trackFieldHelpLabel = (container: HTMLElement) => {
  const label = container.querySelector<HTMLElement>(':scope > label > [data-field-label]');
  if (!label) return;

  let previous = -1;
  const measure = () => {
    const lineHeight = Number.parseFloat(window.getComputedStyle(label).lineHeight);
    if (!Number.isFinite(lineHeight)) return;
    // offsetHeight ignores the scale animation of the surrounding modal.
    const extra = Math.max(0, Math.round(label.offsetHeight - lineHeight));
    if (extra === previous) return;
    previous = extra;
    container.style.setProperty('--field-help-label-extra', `${extra}px`);
    container.toggleAttribute('data-field-label-wrapped', extra > 0);
  };

  measure();
  // Respond to narrow screens, font loading, label changes and floating-label focus transitions.
  const observer = new ResizeObserver(measure);
  observer.observe(label);
  return () => {
    observer.disconnect();
    container.style.removeProperty('--field-help-label-extra');
    container.removeAttribute('data-field-label-wrapped');
  };
};
