const aliases: Record<string, string> = {
  DESCANSO_NORMAL_OU_LONGO: 'DESCANSO_NORMAL',
  APOS_A_DURACAO_CONFIGURADA: 'DURACAO',
};

export const CONDITION_RECOVERY_CODES = ['MANUAL', 'GATILHO_CESSOU', 'DURACAO',
  'DESCANSO_SIMPLES', 'DESCANSO_NORMAL', 'DESCANSO_LONGO', 'CURA', 'MAGIA'];

export const conditionRecoveryCodes = (value?: string | null): string[] => [...new Set(
  (value || 'MANUAL').split(';').map((entry) => {
    const code = entry.trim().toUpperCase().replace(/[ -]/g, '_');
    return aliases[code] ?? code;
  }).filter(Boolean),
)];

export const toggleConditionRecovery = (value: string | null | undefined, code: string, checked: boolean) => {
  // Old versions allowed narrative text. An explicit checkbox replaces that
  // narrative rule instead of combining it into an invalid executable code.
  const codes = conditionRecoveryCodes(value).filter((entry) =>
    CONDITION_RECOVERY_CODES.includes(entry) && entry !== 'MANUAL' && entry !== code);
  if (checked) codes.push(code);
  return codes.length ? codes.join(';') : 'MANUAL';
};
