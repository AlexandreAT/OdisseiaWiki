import type { GameRunDto } from '../../../models/GameRun';
import { useState, type ReactNode } from 'react';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { ConsumableAction, ConsumableRestoration, LoadoutItemActions } from './RunLoadout.style';
import type { RunInventoryEntry } from './runInventoryEntries';
import { isUsableConsumable } from './runConsumableUtils';

interface Props {
  entry: RunInventoryEntry;
  run: GameRunDto;
  disabled: boolean;
  using: boolean;
  theme: 'light' | 'dark';
  neon: 'on' | 'off';
  onUse: (quantity: number) => void;
  dropButton?: ReactNode;
}

export function RunConsumableAction({ entry, run, disabled, using, theme, neon, onUse, dropButton }: Props) {
  const [quantity, setQuantity] = useState(1);
  if (!isUsableConsumable(entry)) return null;
  const requiresCombat = entry.conditions.some((condition) => condition.gatilho === 'AO_USAR' &&
    condition.alvo !== undefined && condition.alvo !== 'USUARIO');
  if (requiresCombat) return <ConsumableAction>
    <small>Este item afeta outros combatentes. Equipe-o nas ações para usá-lo no seu turno.</small>
    {dropButton && <LoadoutItemActions>{dropButton}</LoadoutItemActions>}
  </ConsumableAction>;
  const count = Math.min(100, Math.max(1, entry.quantity, 1));
  const selected = Math.min(quantity, count);
  const status = run.estadoAtual.status.status;
  const hasMissingResource = entry.restore.vida > 0 && status.vida < status.vidaMaxima ||
    entry.restore.mana > 0 && status.mana < status.manaMaxima ||
    entry.restore.estamina > 0 && status.estamina < status.estaminaMaxima;
  const activeConditions = (run.estadoAtual.status as typeof run.estadoAtual.status & {
    condicoesJogo?: { rule?: { recovery?: string } }[];
  }).condicoesJogo ?? [];
  const clearsCondition = entry.restore.vida > 0 && activeConditions.some((condition) =>
    condition.rule?.recovery?.split(';').some((code) => code.trim().toUpperCase() === 'CURA'));

  const resources = [
    { label: 'Vida', current: status.vida, maximum: status.vidaMaxima, effect: entry.restore.vida },
    { label: 'Mana', current: status.mana, maximum: status.manaMaxima, effect: entry.restore.mana },
    { label: 'Estamina', current: status.estamina, maximum: status.estaminaMaxima, effect: entry.restore.estamina },
  ].filter((resource) => resource.effect > 0);

  return <ConsumableAction>
    <ConsumableRestoration aria-label="Efeitos de cura">
      {resources.map(({ label, current, maximum, effect }) => <span key={label}>
        {label} {current} + {effect * selected} = {Math.min(maximum, current + effect * selected)}
      </span>)}
      {entry.useConditions.map((name) => <span key={name}>Condição: {name}</span>)}
      {clearsCondition && <span>Remove condições curáveis pelo Sistema</span>}
    </ConsumableRestoration>
    {entry.quantity > 1 && <label>Quantidade a usar
      <input type="number" min={1} max={count} value={selected} disabled={disabled || using}
        onChange={(event) => setQuantity(Math.min(count, Math.max(1, Number(event.target.value) || 1)))} />
    </label>}
    <LoadoutItemActions>
      <CyberButton theme={theme} neon={neon} width="calc(100% - 15px)" height="40px"
        text={using ? 'Usando...' : selected > 1 ? `Usar ${selected} itens` : 'Usar item'} loading={using}
        disabled={disabled || using || entry.quantity < 1 ||
          (!hasMissingResource && entry.useConditions.length === 0 && !clearsCondition)}
        onClick={() => onUse(selected)} />
      {dropButton}
    </LoadoutItemActions>
    {!hasMissingResource && entry.useConditions.length === 0 && !clearsCondition &&
      <small>Os recursos afetados já estão no limite.</small>}
  </ConsumableAction>;
}
