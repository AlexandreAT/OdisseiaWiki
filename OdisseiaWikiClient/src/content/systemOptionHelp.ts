import descriptions from './systemOptionHelp.pt-BR.json';

export const getSystemOptionDescription = (group: keyof typeof descriptions, value: string | number): string | undefined => {
  const entries: Record<string, string> = descriptions[group];
  return Object.prototype.hasOwnProperty.call(entries, String(value)) ? entries[String(value)] : undefined;
};

/** Opt in only for built-in choices. Never infer help from dynamic names or codes. */
export const describeSystemOptions = <T extends { value: string | number; label: string }>(
  group: keyof typeof descriptions, options: T[],
): Array<T & { description?: string }> => {
  return options.map((option) => ({ ...option, description: getSystemOptionDescription(group, option.value) }));
};
