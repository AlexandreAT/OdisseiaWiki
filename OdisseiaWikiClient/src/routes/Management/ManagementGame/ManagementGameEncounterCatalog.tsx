import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import RedeemIcon from '@mui/icons-material/Redeem';
import { ManagementGameLootEditor } from './ManagementGameLootEditor';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { Search } from '../../../components/Generic/Search/Search';
import type { GameModeEditor, GameModeEncounter, GameModeNpcOption } from '../../../models/GameModeManagement';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import {
  CardContent, CardHeader, CardImage, CardMedia, CardTitle,
  EntityBadge, ManagementMetadata, MetadataChip,
} from '../ManagementWiki/WikiForms/FormBuscarConteúdo/ResultCard/ResultCard.style';
import { ManagementGameEncounterCard } from './ManagementGameEncounterCard';
import {
  GameAdminAddCard, GameAdminCardStats, GameAdminCatalog,
  GameAdminEnemyCard, GameAdminGear, GameAdminHint,
} from './ManagementGame.style';

interface Props {
  editor: GameModeEditor;
  mesaId?: number;
  npcs: GameModeNpcOption[];
  editable: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  addEncounter: (npc?: GameModeNpcOption) => string | null;
  updateEncounter: (code: string, update: Partial<GameModeEncounter>) => void;
  updateEnemy: (code: string, update: Partial<GameModeEncounter['enemy']>) => void;
  selectNpc: (code: string, npc: GameModeNpcOption | null) => void;
  removeEncounter: (code: string) => void;
  uploadEnemyImage: (code: string, file: File) => Promise<void>;
}

const npcLabel = (npc: GameModeNpcOption) =>
  `${npc.name} · #${npc.id}${npc.variantId ? ` · ${npc.variantId}` : ''}`;

const wasConfigured = (encounter: GameModeEncounter) => encounter.configured !== false;

export function ManagementGameEncounterCatalog({ editor, mesaId, npcs, editable, theme, neon,
  addEncounter, updateEncounter, updateEnemy, selectNpc, removeEncounter,
  uploadEnemyImage }: Props) {
  const [query, setQuery] = useState('');
  const [lootCode, setLootCode] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [openedCodes, setOpenedCodes] = useState<Set<string>>(() => new Set());
  const entries = Object.entries(editor.encounters);
  const active = activeCode ? editor.encounters[activeCode] : null;

  const open = (code: string) => {
    setOpenedCodes((previous) => new Set(previous).add(code));
    if (editable) updateEncounter(code, { configured: true });
    setActiveCode(code);
  };

  return <>
    <Search theme={theme} neon={neon} label="Buscar personagem da Wiki para o jogo"
      width="100%" value={query} disabled={!editable || entries.length >= 80}
      suggestions={npcs.map(npcLabel)} maxSuggestions={20} portal
      onChange={(event) => setQuery(event.target.value)}
      onSelectSuggestion={(value) => {
        const npc = npcs.find((candidate) => npcLabel(candidate) === value);
        if (npc) { addEncounter(npc); setQuery(''); }
      }} />
    <GameAdminHint>Selecione um NPC para criar seu card com os dados da ficha. O mesmo personagem pode participar de encontros diferentes. Use + para um inimigo exclusivo do jogo.</GameAdminHint>
    <GameAdminCatalog>
      {entries.map(([code, encounter]) => {
        const enemy = encounter.enemy;
        const uses = editor.areas.reduce((total, area) => total + area.options
          .filter((option) => option.encounterCode === code || option.encounterCodes?.includes(code)).length, 0);
        const pulse = !openedCodes.has(code) && !wasConfigured(encounter);
        return <GameAdminEnemyCard key={code} theme={theme} neon={neon} $type="Personagem">
          <GameAdminGear type="button" $pulse={false} style={{ right: 56 }} title="Configurar loot"
            aria-label={`Loot de ${enemy.name}`} onClick={() => setLootCode(code)}><RedeemIcon /></GameAdminGear>
          <GameAdminGear type="button" $pulse={pulse} aria-label={`Configurar ${encounter.mapName || enemy.name}`}
            title="Configurar encontro" onClick={() => open(code)}><SettingsIcon /></GameAdminGear>
          <CardMedia $type="Personagem"><CardImage $type="Personagem"
            src={normalizeImagePath(enemy.image ?? undefined)} alt={`Imagem de ${enemy.name}`} /></CardMedia>
          <CardHeader><CardTitle theme={theme} neon={neon} title={enemy.name}>{enemy.name}</CardTitle>
            <EntityBadge $type="Personagem">{enemy.npcId ? 'WIKI' : 'JOGO'}</EntityBadge></CardHeader>
          <CardContent>
            <ManagementMetadata>
              <MetadataChip $active>{encounter.mapName || code}</MetadataChip>
              <MetadataChip $active={uses > 0}>{uses} {uses === 1 ? 'rota' : 'rotas'}</MetadataChip>
            </ManagementMetadata>
            <GameAdminCardStats>
              <span>Vida <strong>{enemy.maxVida}</strong></span>
              <span>Mana <strong>{enemy.maxMana}</strong></span>
              <span>Estamina <strong>{enemy.maxEstamina}</strong></span>
              <span>Defesa <strong>{enemy.defesa}</strong></span>
              <span>Quantidade <strong>{enemy.quantity ?? 1}</strong></span>
              <span>XP <strong>{encounter.xpReward ?? 0}</strong></span>
            </GameAdminCardStats>
          </CardContent>
        </GameAdminEnemyCard>;
      })}
      <GameAdminAddCard type="button" disabled={!editable || entries.length >= 80}
        onClick={() => { const code = addEncounter(); if (code) open(code); }}>
        <AddIcon /><span>Novo personagem do jogo</span>
      </GameAdminAddCard>
    </GameAdminCatalog>
    {lootCode && editor.encounters[lootCode] && <Modal theme={theme} neon={neon} width="680px"
      title={`Loot · ${editor.encounters[lootCode].enemy.name}`} showFooter={false} onClose={() => setLootCode(null)}>
      <ManagementGameLootEditor encounter={editor.encounters[lootCode]} editable={editable} theme={theme} neon={neon}
        mesaId={mesaId} systemVersionId={editor.idSistemaVersao}
        onChange={(update) => updateEncounter(lootCode, update)} />
    </Modal>}
    {activeCode && active && <Modal theme={theme} neon={neon} width="760px"
      title={`Configurar · ${active.mapName || active.enemy.name}`}
      mobileInset={false} showFooter={false} onClose={() => setActiveCode(null)}>
      <ManagementGameEncounterCard code={activeCode} encounter={active}
        npcs={npcs} outcomeCodes={editor.attackOutcomeCodes} editable={editable}
        theme={theme} neon={neon}
        usageCount={editor.areas.reduce((total, area) => total + area.options
          .filter((option) => option.encounterCode === activeCode || option.encounterCodes?.includes(activeCode)).length, 0)}
        canRemove={entries.length > 1} updateEncounter={updateEncounter} updateEnemy={updateEnemy}
        selectNpc={selectNpc} uploadEnemyImage={uploadEnemyImage}
        removeEncounter={(code) => { removeEncounter(code); setActiveCode(null); }} />
    </Modal>}
  </>;
}
