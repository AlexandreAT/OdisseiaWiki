import { useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { Select } from '../../../components/Generic/Select/Select';
import { Search } from '../../../components/Generic/Search/Search';
import { CheckBox } from '../../../components/Generic/CheckBox/CheckBox';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { HelpHeading } from '../../../components/Generic/HelpHeading/HelpHeading';
import { gameConfigurationHelp as help } from '../../../content/gameConfigurationHelp';
import type { GameStoryCost, GameStoryOutcome } from '../../../models/GameStory';
import type { GameLootOption } from '../../../services/gameModeManagementService';
import { GameAdminActions, GameAdminFields } from './ManagementGame.style';
import { Offers, OfferRow, OfferRowHeader } from './ManagementGameVendorOffers/ManagementGameVendorOffers.style';

interface Appearance { theme: 'dark' | 'light'; neon: 'on' | 'off'; editable: boolean }

export function StoryCostEditor({ value, onChange, ...appearance }: Appearance & {
  value: GameStoryCost; onChange: (value: GameStoryCost) => void;
}) {
  return <details><summary>Custo da escolha</summary><Offers>
    <HelpHeading label="Custo" level="h4" theme={appearance.theme} neon={appearance.neon} help={help.storyCost} />
    <GameAdminFields>{(['currency', 'life', 'mana', 'stamina'] as const).map((key, index) =>
      <InputText key={key} label={['Moedas', 'Vida', 'Mana', 'Estamina'][index]} type="number" width="100%"
        theme={appearance.theme} neon={appearance.neon} disabled={!appearance.editable} min={0}
        max={key === 'currency' ? 1_000_000_000 : 1_000_000} value={value[key]}
        onChange={event => onChange({ ...value, [key]: Number(event.target.value) })} />)}</GameAdminFields>
  </Offers></details>;
}

export function StoryOutcomeEditor({ value, onChange, items, conditions, ...appearance }: Appearance & {
  value: GameStoryOutcome; onChange: (value: GameStoryOutcome) => void; items: GameLootOption[];
  conditions: { codigo: string; nome: string }[];
}) {
  const { theme, neon, editable } = appearance;
  const [query, setQuery] = useState('');
  const candidates = items.filter(item => !value.items.some(reward => reward.itemId === item.id));
  const label = (item: GameLootOption) => `${item.name} · ${item.type} · #${item.id}`;
  return <details><summary>Efeitos e recompensas</summary><Offers>
    <HelpHeading label="Efeitos e recompensas" level="h4" theme={theme} neon={neon} help={help.storyOutcome} />
    <GameAdminFields>{(['currency', 'xp', 'life', 'mana', 'stamina', 'gameMinutes'] as const).map((key, index) =>
      <InputText key={key} label={['Moedas recebidas', 'XP recebido', 'Vida (+/−)', 'Mana (+/−)', 'Estamina (+/−)', 'Tempo de jogo (minutos)'][index]}
        type="number" width="100%" theme={theme} neon={neon} disabled={!editable} value={value[key]}
        min={['life', 'mana', 'stamina'].includes(key) ? value.percentage ? -100 : -1_000_000 : 0}
        max={key === 'currency' ? 1_000_000_000 : ['life', 'mana', 'stamina'].includes(key) && value.percentage ? 100 : 1_000_000}
        onChange={event => onChange({ ...value, [key]: Number(event.target.value) })} />)}</GameAdminFields>
    <CheckBox label="Recursos em percentual" neon={neon} checked={value.percentage} disabled={!editable}
      help={help.storyPercentage} onChange={percentage => onChange({ ...value, percentage })} />
    <Search label="Adicionar item ou prótese à recompensa" theme={theme} neon={neon} width="100%" portal
      help={help.storyItems} disabled={!editable || value.items.length >= 20} value={query}
      suggestions={candidates.map(label)} onChange={event => setQuery(event.target.value)} onSelectSuggestion={suggestion => {
        const item = candidates.find(item => label(item) === suggestion);
        if (!item) return;
        onChange({ ...value, items: [...value.items, { itemId: item.id, quantity: 1,
          snapshot: { nome: item.name, tipo: item.type, imagem: item.image } }] }); setQuery('');
      }} />
    {value.items.map((reward, index) => <OfferRow key={reward.itemId}>
      <OfferRowHeader><strong>{String(reward.snapshot?.nome ?? reward.itemId)}</strong>
        <button type="button" disabled={!editable} aria-label={`Remover recompensa ${index + 1}`}
          onClick={() => onChange({ ...value, items: value.items.filter((_, at) => at !== index) })}><DeleteOutlineIcon /></button></OfferRowHeader>
      <InputText label="Quantidade" type="number" theme={theme} neon={neon} width="100%" value={reward.quantity}
        min={1} max={reward.snapshot?.tipo === 'implante' ? 1 : 999} disabled={!editable}
        onChange={event => onChange({ ...value, items: value.items.map((item, at) => at === index ? { ...item, quantity: Number(event.target.value) } : item) })} />
    </OfferRow>)}
    <HelpHeading label="Condições aplicadas" level="h4" theme={theme} neon={neon} help={help.storyCondition} />
    {value.conditions.map((condition, index) => <OfferRow key={index}><Offers>
      <Select label="Condição" theme={theme} neon={neon} width="100%" portal value={condition.code} disabled={!editable}
        options={conditions.map(rule => ({ value: rule.codigo, label: rule.nome }))}
        onChange={event => onChange({ ...value, conditions: value.conditions.map((entry, at) => at === index ? { ...entry, code: event.target.value } : entry) })} />
      <GameAdminFields>
        <InputText label="Duração (opcional)" type="number" min={1} max={1_000_000} width="100%" theme={theme} neon={neon}
          value={condition.duration ?? ''} disabled={!editable} onChange={event => onChange({ ...value, conditions: value.conditions.map((entry, at) => at === index
            ? { ...entry, duration: event.target.value === '' ? null : Number(event.target.value) } : entry) })} />
        <Select label="Duração em" width="100%" theme={theme} neon={neon} portal value={condition.durationUnit ?? ''} disabled={!editable}
          options={[{ value: 'Turno', label: 'Turnos' }, { value: 'Hora', label: 'Horas' }]}
          onChange={event => onChange({ ...value, conditions: value.conditions.map((entry, at) => at === index
            ? { ...entry, durationUnit: (event.target.value || null) as 'Turno' | 'Hora' | null } : entry) })} />
        <InputText label="Valor (opcional)" type="number" width="100%" theme={theme} neon={neon} value={condition.value ?? ''} disabled={!editable}
          onChange={event => onChange({ ...value, conditions: value.conditions.map((entry, at) => at === index
            ? { ...entry, value: event.target.value === '' ? null : Number(event.target.value) } : entry) })} />
      </GameAdminFields>
      <GameAdminActions><CyberButton text="Remover condição" theme={theme} neon={neon} colorType="secondary" disabled={!editable}
        onClick={() => onChange({ ...value, conditions: value.conditions.filter((_, at) => at !== index) })} /></GameAdminActions>
    </Offers></OfferRow>)}
    <GameAdminActions><CyberButton text="Adicionar condição" theme={theme} neon={neon}
      disabled={!editable || !conditions.length || value.conditions.length >= 20}
      onClick={() => onChange({ ...value, conditions: [...value.conditions, { code: conditions[0].codigo }] })} /></GameAdminActions>
  </Offers></details>;
}
