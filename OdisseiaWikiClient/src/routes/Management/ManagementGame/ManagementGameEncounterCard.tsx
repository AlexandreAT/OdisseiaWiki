import { useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { ImageUploader } from '../../../components/Generic/ImageUploader/ImageUploader';
import { Search } from '../../../components/Generic/Search/Search';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { CardImage } from '../ManagementWiki/WikiForms/FormBuscarConteúdo/ResultCard/ResultCard.style';
import type { GameModeEncounter, GameModeEnemy, GameModeNpcOption } from '../../../models/GameModeManagement';
import {
  GameAdminDelete, GameAdminEncounterForm, GameAdminFields, GameAdminHint, GameAdminImage,
  GameAdminInlineActions, GameAdminNpcAction, GameAdminNpcActions,
  GameAdminNpcSearch, GameAdminEncounterHeader,
} from './ManagementGame.style';

interface Props {
  code: string;
  encounter: GameModeEncounter;
  npcs: GameModeNpcOption[];
  outcomeCodes: string[];
  usageCount: number;
  canRemove: boolean;
  editable: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  updateEncounter: (code: string, update: Partial<GameModeEncounter>) => void;
  updateEnemy: (code: string, update: Partial<GameModeEnemy>) => void;
  selectNpc: (code: string, npc: GameModeNpcOption | null) => void;
  removeEncounter: (code: string) => void;
  uploadEnemyImage: (code: string, file: File) => Promise<void>;
}

const npcLabel = (npc: GameModeNpcOption) => `${npc.name} · #${npc.id}${npc.variantId ? ` · ${npc.variantId}` : ''}`;
const actionLabel = (action: GameModeNpcOption['actions'][number]) =>
  `${action.name} · ${action.tipo.toLowerCase()} · ${action.idInstancia}${action.declaredRoll ? ` · ${action.declaredRoll}` : ''}${action.executable ? '' : ' · indisponível'}`;

export const ManagementGameEncounterCard = ({ code, encounter, npcs, outcomeCodes,
  usageCount, canRemove, editable, theme, neon, updateEncounter, updateEnemy,
  selectNpc, removeEncounter, uploadEnemyImage }: Props) => {
  const [npcQuery, setNpcQuery] = useState('');
  const [actionQuery, setActionQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [manualAttributes, setManualAttributes] = useState(() =>
    Object.entries(encounter.enemy.attributes ?? {}).map(([name, value]) => `${name}=${value}`).join(', '));
  const enemy = encounter.enemy;
  const npc = npcs.find((item) => item.id === enemy.npcId &&
    item.variantId === (enemy.variantId ?? null));
  const availableActions = npc?.actions.filter((action) =>
    !enemy.actions?.some((selected) => selected.tipo === action.tipo &&
      selected.idInstancia === action.idInstancia)) ?? [];

  const moveAction = (index: number, nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= enemy.actions.length) return;
    const actions = [...enemy.actions];
    [actions[index], actions[nextIndex]] = [actions[nextIndex], actions[index]];
    updateEnemy(code, { actions });
  };

  return <GameAdminEncounterForm>
    <GameAdminEncounterHeader>
      <div><h3>{encounter.mapName || code}</h3><small>{code} · {usageCount} {usageCount === 1 ? 'rota' : 'rotas'}</small></div>
      <GameAdminDelete type="button" disabled={!editable || !canRemove || usageCount > 0}
        title={usageCount > 0 ? 'Retire o encontro das rotas antes de excluí-lo' :
          !canRemove ? 'Mantenha ao menos um encontro' : 'Excluir encontro'}
        aria-label={`Excluir ${encounter.mapName || code}`}
        onClick={() => removeEncounter(code)}><DeleteOutlineIcon /></GameAdminDelete>
    </GameAdminEncounterHeader>
    {!enemy.npcId && <GameAdminImage>{editable ? <ImageUploader theme={theme} neon={neon}
      cropPreset={{ mode: 'single', aspectRatio: 1, shape: 'circle', displayShape: 'circle', label: 'Retrato (1:1)' }}
      initialImage={normalizeImagePath(enemy.image ?? undefined)} label="Imagem do personagem"
      onImageCropped={(result) => { void uploadEnemyImage(code, result.file); }}
      onRemove={() => updateEnemy(code, { image: null })} /> :
      <CardImage $type="Personagem" src={normalizeImagePath(enemy.image ?? undefined)}
        alt={`Imagem de ${enemy.name}`} />}</GameAdminImage>}
    <GameAdminFields>
      <InputText theme={theme} neon={neon} label="Nome no mapa" width="100%"
        value={encounter.mapName} disabled={!editable}
        onChange={(event) => updateEncounter(code, { mapName: event.target.value })} />
      <InputText theme={theme} neon={neon} label="XP ao vencer" width="100%"
        type="number" value={encounter.xpReward ?? 0} disabled={!editable}
        error={!Number.isInteger(encounter.xpReward ?? 0) || (encounter.xpReward ?? 0) < 0 || (encounter.xpReward ?? 0) > 1000000}
        errorMessage="Defina de 0 a 1.000.000 XP por vitória."
        onChange={(event) => updateEncounter(code, { xpReward: Number(event.target.value) })} />
      <InputText theme={theme} neon={neon} label="Quantidade de inimigos" width="100%"
        type="number" value={enemy.quantity ?? 1} disabled={!editable}
        onChange={(event) => updateEnemy(code, { quantity: Number(event.target.value) })} />
    </GameAdminFields>
    <GameAdminNpcSearch><Search theme={theme} neon={neon} label="Buscar NPC da Wiki" width="100%"
      value={npcQuery || (npc ? npcLabel(npc) : '')} disabled={!editable}
      suggestions={npcs.map(npcLabel)} maxSuggestions={20} portal
      onChange={(event) => setNpcQuery(event.target.value)}
      onSelectSuggestion={(value) => {
        const selected = npcs.find((item) => npcLabel(item) === value);
        if (selected) { selectNpc(code, selected); setNpcQuery(''); setActionQuery(''); setActionError(null); }
      }} /></GameAdminNpcSearch>
    {enemy.npcId && <GameAdminInlineActions>
      <GameAdminHint>Dados e ações vindos da ficha de {enemy.name}.</GameAdminHint>
      <GameAdminDelete type="button" disabled={!editable} title="Remover NPC"
        aria-label={`Remover NPC de ${encounter.mapName}`}
        onClick={() => { selectNpc(code, null); setNpcQuery(''); }}><DeleteOutlineIcon /></GameAdminDelete>
    </GameAdminInlineActions>}
    <GameAdminFields>
      <InputText theme={theme} neon={neon} label="Nome do inimigo" width="100%"
        value={enemy.name} disabled={!editable || !!enemy.npcId}
        onChange={(event) => updateEnemy(code, { name: event.target.value })} />
      {([['maxVida', 'Vida'], ['maxMana', 'Mana'], ['maxEstamina', 'Estamina'],
        ['defesa', 'Defesa']] as const).map(([field, label]) =>
        <InputText key={field} theme={theme} neon={neon} label={label} width="100%"
          type="number" value={enemy[field]} disabled={!editable || !!enemy.npcId}
          onChange={(event) => updateEnemy(code, { [field]: Number(event.target.value) })} />)}
    </GameAdminFields>
    {enemy.npcId ? <GameAdminNpcActions>
      <h4>Ações do NPC · ordem de uso</h4>
      <GameAdminHint>Selecione até três ações da ficha. Dano, custo, munição e cooldown seguem as regras do Sistema desta versão.</GameAdminHint>
      {npc && availableActions.length > 0 && enemy.actions.length < 3 &&
        <Search theme={theme} neon={neon} label="Buscar item, prótese, skill ou magia"
          width="100%" value={actionQuery} disabled={!editable} portal maxSuggestions={20}
          suggestions={availableActions.map(actionLabel)}
          onChange={(event) => setActionQuery(event.target.value)}
          onSelectSuggestion={(value) => {
            const selected = availableActions.find((item) => actionLabel(item) === value);
            if (selected && !selected.executable) {
              setActionError(selected.unavailableReason ??
                'Esta ação precisa de teste D20 e dano executáveis para entrar no combate automático.');
              setActionQuery('');
            } else if (selected) {
              updateEnemy(code, { actions: [...enemy.actions,
                { tipo: selected.tipo, idInstancia: selected.idInstancia }] });
              setActionQuery('');
              setActionError(null);
            }
          }} />}
      {actionError && <GameAdminHint role="alert">{actionError}</GameAdminHint>}
      {npc && npc.actions.every((action) => !action.executable) &&
        <GameAdminHint role="alert">{npc.actions[0]?.unavailableReason ??
          'Este NPC não possui ação de ataque D20 executável na versão selecionada do Sistema.'}</GameAdminHint>}
      {enemy.actions.map((selected, index) => {
        const action = npc?.actions.find((item) => item.tipo === selected.tipo &&
          item.idInstancia === selected.idInstancia);
        return <GameAdminNpcAction key={`${selected.tipo}:${selected.idInstancia}`}>
          <div><strong>{index + 1}. {action?.name ?? selected.idInstancia}</strong>
            <span>{selected.tipo} · Dano {action?.damage ?? '—'} · Mana {action?.manaCost ?? 0} · Estamina {action?.staminaCost ?? 0} · Cooldown {action?.cooldownTurns ?? 0} · Munição {action?.ammoPerUse ?? 0}</span></div>
          <GameAdminInlineActions>
            <button type="button" title="Subir ação" aria-label="Subir ação" disabled={!editable || index === 0}
              onClick={() => moveAction(index, index - 1)}><ArrowUpwardIcon /></button>
            <button type="button" title="Descer ação" aria-label="Descer ação"
              disabled={!editable || index === enemy.actions.length - 1}
              onClick={() => moveAction(index, index + 1)}><ArrowDownwardIcon /></button>
            <GameAdminDelete type="button" title="Remover ação" aria-label="Remover ação"
              disabled={!editable} onClick={() => updateEnemy(code,
                { actions: enemy.actions.filter((_, actionIndex) => actionIndex !== index) })}>
              <DeleteOutlineIcon />
            </GameAdminDelete>
          </GameAdminInlineActions>
        </GameAdminNpcAction>;
      })}
      {enemy.actions.length === 0 && <GameAdminHint>Selecione ao menos uma ação para publicar o NPC.</GameAdminHint>}
    </GameAdminNpcActions> : <>
      <GameAdminHint>Inimigo manual: configure atributos, custos e dano. Para usar a ficha real, selecione um NPC acima.</GameAdminHint>
      <GameAdminFields>
        <InputText theme={theme} neon={neon} label="Custo de mana" width="100%" type="number"
          value={enemy.custoManaAtaque} disabled={!editable}
          onChange={(event) => updateEnemy(code, { custoManaAtaque: Number(event.target.value) })} />
        <InputText theme={theme} neon={neon} label="Custo de estamina" width="100%" type="number"
          value={enemy.custoEstaminaAtaque} disabled={!editable}
          onChange={(event) => updateEnemy(code, { custoEstaminaAtaque: Number(event.target.value) })} />
        <InputText theme={theme} neon={neon} label="Atributo do ataque (opcional)" width="100%"
          value={enemy.attackAttributeCode ?? ''} disabled={!editable}
          onChange={(event) => updateEnemy(code, { attackAttributeCode: event.target.value || null })} />
      </GameAdminFields>
      <h4>Dano por resultado</h4>
      <GameAdminFields>{outcomeCodes.map((result) => <InputText key={result}
        theme={theme} neon={neon} label={result} width="100%" type="number"
        value={encounter.damageByResult[result] ?? 0} disabled={!editable}
        onChange={(event) => updateEncounter(code, { damageByResult: {
          ...encounter.damageByResult, [result]: Number(event.target.value),
        } })} />)}</GameAdminFields>
      <InputText theme={theme} neon={neon} label="Atributos (código=valor, separados por vírgula)"
        width="100%" value={manualAttributes} disabled={!editable}
        onChange={(event) => {
          const text = event.target.value;
          setManualAttributes(text);
          const attributes = Object.fromEntries(text.split(',').map((part) => part.trim().split('='))
            .filter(([name, value]) => !!name && value !== undefined &&
              Number.isInteger(Number(value)))
            .map(([name, value]) => [name.trim(), Number(value)]));
          updateEnemy(code, { attributes });
        }} />
    </>}
  </GameAdminEncounterForm>;
};
