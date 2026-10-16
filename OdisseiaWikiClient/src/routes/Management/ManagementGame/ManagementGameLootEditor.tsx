import { useEffect, useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Search } from '../../../components/Generic/Search/Search';
import { InputText } from '../../../components/Generic/InputText/InputText';
import type { GameModeEncounter } from '../../../models/GameModeManagement';
import { getGameLootOptions, type GameLootOption } from '../../../services/gameModeManagementService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { GameAdminHint } from './ManagementGame.style';
import styled from 'styled-components';

const Rows = styled.div`
  display: grid; gap: 22px; padding: 8px 2px 20px;
  article { display: grid; grid-template-columns: minmax(0, 1fr) 130px 32px; align-items: center; gap: 16px; }
  article strong { overflow-wrap: anywhere; color: var(--clearneonBlue); }
  button { border: 0; background: none; color: var(--neonRed); cursor: pointer; padding: 4px; }
  @media (max-width: 480px) { article { grid-template-columns: minmax(0, 1fr) 95px 28px; gap: 10px; } }
`;

export function ManagementGameLootEditor({ encounter, onChange, theme, neon, editable }: {
  encounter: GameModeEncounter; onChange: (update: Partial<GameModeEncounter>) => void;
  theme: 'light' | 'dark'; neon: 'on' | 'off'; editable: boolean;
}) {
  const [items, setItems] = useState<GameLootOption[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getGameLootOptions().then((value) => { if (active) setItems(value); })
      .catch((reason: unknown) => { if (active) setError(getApiErrorMessage(reason, 'Não foi possível carregar o catálogo de loot.')); });
    return () => { active = false; };
  }, []);
  const loot = encounter.loot ?? [];
  const available = items.filter((item) => !loot.some((entry) => entry.itemId === item.id));
  const label = (item: GameLootOption) => `${item.name} · ${item.type} · #${item.id}`;
  return <Rows>
    <InputText theme={theme} neon={neon} type="number" label="Itens sorteados por vitória"
      value={encounter.lootCount ?? 0} disabled={!editable}
      onChange={(event) => onChange({ lootCount: Number(event.target.value) })} />
    <GameAdminHint>Peso menor = mais raro. Na metade superior do dado, os menores pesos dobram. Cada sorteio entrega uma unidade; um item pode ser sorteado novamente. O loot pertence somente à run.</GameAdminHint>
    {error && <p role="alert">{error}</p>}
    <Search theme={theme} neon={neon} label="Buscar item ou prótese" value={query} width="100%" portal
      disabled={!editable || loot.length >= 100} suggestions={available.map(label)} maxSuggestions={12}
      onChange={(event) => setQuery(event.target.value)} onSelectSuggestion={(value) => {
        const item = available.find((candidate) => label(candidate) === value);
        if (item) { onChange({ loot: [...loot, { itemId: item.id, weight: 1,
          snapshot: { nome: item.name, imagem: item.image ?? undefined, tipo: item.type } }],
          lootCount: Math.max(1, encounter.lootCount ?? 0) }); setQuery(''); }
      }} />
    {loot.map((entry, index) => <article key={entry.itemId}>
      <strong>{items.find((item) => item.id === entry.itemId)?.name ?? entry.snapshot?.nome ?? entry.itemId}</strong>
      <InputText theme={theme} neon={neon} type="number" label="Peso" value={entry.weight}
        disabled={!editable} onChange={(event) => onChange({ loot: loot.map((item, i) => i === index ? { ...item, weight: Number(event.target.value) } : item) })} />
      <button type="button" disabled={!editable} aria-label="Remover loot"
        onClick={() => onChange({ loot: loot.filter((_, i) => i !== index),
          ...(loot.length === 1 ? { lootCount: 0 } : {}) })}><DeleteOutlineIcon /></button>
    </article>)}
  </Rows>;
}
