import { useEffect, useState } from 'react';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { ImageUploader } from '../../../components/Generic/ImageUploader/ImageUploader';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Select } from '../../../components/Generic/Select/Select';
import { CheckSelect } from '../../../components/Generic/CheckSelect/CheckSelect';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../components/Generic/TextArea/TextArea';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import type { CropPreset } from '../../../components/Generic/ImageUploader/types';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import type { GameModeAreaOption } from '../../../models/GameModeManagement';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { useManagementGame } from './useManagementGame';
import { ManagementGameEncounterCatalog } from './ManagementGameEncounterCatalog';
import { ManagementGamePowers } from './ManagementGamePowers';
import {
  GameAdminActions, GameAdminCard, GameAdminDraftActions, GameAdminFields, GameAdminFrame,
  GameAdminGrid, GameAdminHeader, GameAdminHint, GameAdminImage, GameAdminRoute, GameAdminRouteImageHeader, GameAdminSection,
  GameAdminWeightRow,
  GameAdminVersion, GameAdminDelete, GameAdminTabs,
} from './ManagementGame.style';

const areaCrop: CropPreset = { mode: 'single', aspectRatio: 16 / 9,
  shape: 'rectangle', displayShape: 'rectangle', label: 'Área (16:9)' };
const routeCrop: CropPreset = { mode: 'single', aspectRatio: 1,
  shape: 'circle', displayShape: 'circle', label: 'Rota (circular)' };
const nodeCountOptions = Array.from({ length: 22 }, (_, index) => ({
  value: index + 3, label: `${index + 3} nós`,
}));

interface Props { theme: 'dark' | 'light'; neon: 'on' | 'off'; mesaId?: number;
  onDirtyChange?: (dirty: boolean) => void }

export const ManagementGame = ({ theme, neon, mesaId, onDirtyChange }: Props) => {
  const state = useManagementGame(mesaId);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'ataque' | 'areas' | 'bases' | 'encontros' | 'poderes'>('areas');
  const [migrationSource, setMigrationSource] = useState<number | null>(null);
  const editor = state.editor;
  const formDirty = state.changed || Boolean(
    state.newGameName.trim() || state.newGameDescription.trim() || state.newGameBanner);
  useEffect(() => {
    onDirtyChange?.(formDirty);
    return () => onDirtyChange?.(false);
  }, [formDirty, onDirtyChange]);
  const editable = editor?.status === 'Rascunho' && !state.busy;
  const archivedVersions = state.systemVersions.filter((version) =>
    version.id !== state.selectedSystemVersion && !version.current);
  const sourceVersionId = archivedVersions.some((version) => version.id === migrationSource)
    ? migrationSource : archivedVersions[0]?.id;
  const sourceVersion = archivedVersions.find((version) => version.id === sourceVersionId);
  const targetVersion = state.systemVersions.find((version) => version.id === state.selectedSystemVersion);
  const canMigrate = !mesaId && editor?.codigoJogo === 'ROGUELIKE_MVP' && editor?.status === 'Publicado' && state.systemVersions.some((version) =>
    version.id === state.selectedSystemVersion && version.current) && archivedVersions.length > 0;
  const canAdapt = Boolean(mesaId && editor && state.systemVersions.some((version) =>
    version.current && version.id !== editor.idSistemaVersao));
  const canAdaptGlobal = Boolean(!mesaId && !editor && state.selectedGameCode &&
    state.systemVersions.some((version) => version.current && version.id === state.selectedSystemVersion) &&
    state.games.some((game) => game.codigo === state.selectedGameCode &&
      game.idSistemaVersao !== state.selectedSystemVersion));
  const versionPicker = <GameAdminVersion><Select theme={theme} neon={neon}
    label={mesaId ? 'Versão do Sistema deste jogo' : 'Versão do Sistema da ficha'} value={state.selectedSystemVersion ?? ''}
    options={state.systemVersions.map((version) => ({ value: version.id,
      label: `${version.number} · ${version.status}${version.current ? ' · atual' : ''}` }))}
    allowEmptyOption={false} disabled={Boolean(mesaId) || state.busy || state.changed}
    onChange={(event) => state.selectSystemVersion(Number(event.target.value))} />
  </GameAdminVersion>;

  if (state.loading) return <LoadingIndicator label="Carregando jogo" />;
  const gameSelector = <GameAdminSection>
    <h2>Jogos {mesaId ? 'desta mesa' : 'globais'}</h2>
    <GameAdminActions>
      <GameAdminVersion><Select theme={theme} neon={neon} label="Jogo" width="100%"
        value={state.selectedGameCode ?? ''} allowEmptyOption={state.games.length === 0}
        options={state.games.map((game) => ({ value: game.codigo, label: game.nome }))}
        disabled={state.busy || state.changed || state.games.length === 0}
        onChange={(event) => state.selectGame(event.target.value)} /></GameAdminVersion>
      <CyberButton theme={theme} neon={neon} text="Novo jogo" width="170px"
        disabled={state.busy} onClick={() => setCreateOpen(true)} />
    </GameAdminActions>
    {state.changed && <GameAdminHint>Salve as alterações antes de trocar de jogo.</GameAdminHint>}
  </GameAdminSection>;
  const createModal = createOpen && <Modal title="Criar jogo" theme={theme} neon={neon}
    width="660px" showFooter={false} onClose={() => !state.busy && setCreateOpen(false)}>
    <GameAdminSection>
      <ImageUploader theme={theme} neon={neon} cropPreset={areaCrop}
        label="Banner do jogo (16:9)" mobileSize="full"
        initialImage={state.newGameBanner ? normalizeImagePath(state.newGameBanner) : undefined}
        onImageCropped={(result) => { void state.uploadBanner(result.file); }}
        onRemove={() => state.setNewGameBanner(null)} />
      <InputText theme={theme} neon={neon} label="Nome do jogo" width="100%"
        value={state.newGameName} onChange={(event) => state.setNewGameName(event.target.value)} />
      <TextArea theme={theme} neon={neon} label="Descrição" fullWidth rows={3}
        value={state.newGameDescription}
        onChange={(event) => state.setNewGameDescription(event.target.value.slice(0, 500))} />
      <GameAdminActions><CyberButton theme={theme} neon={neon} text="Criar jogo" width="170px"
        disabled={state.busy || !state.newGameBanner || state.newGameName.trim().length < 2}
        onClick={() => { void state.createGame().then((ok) => {
          if (!ok) return;
          state.setNewGameName('');
          state.setNewGameDescription('');
          state.setNewGameBanner(null);
          setCreateOpen(false);
        }); }} /></GameAdminActions>
      {state.error && <p role="alert">{state.error}</p>}
    </GameAdminSection>
  </Modal>;
  if (!editor) return <GameAdminFrame neon={neon === 'on'}>
    {versionPicker}{gameSelector}{createModal}
    {canAdaptGlobal && <GameAdminSection>
      <h2>Atualizar jogo para o Sistema atual</h2>
      <GameAdminHint>Este jogo ainda não tem versão nesta publicação do Sistema. A adaptação cria um rascunho; revise e publique para liberar o jogo às fichas atualizadas.</GameAdminHint>
      <GameAdminActions><CyberButton theme={theme} neon={neon} text="Adaptar jogo"
        width="190px" disabled={state.busy} onClick={() => { void state.adaptGame(); }} /></GameAdminActions>
    </GameAdminSection>}
    {state.error && <p role="alert">{state.error}</p>}
    {state.games.length === 0 && <GameAdminHint>Crie o primeiro jogo para esta {mesaId ? 'mesa' : 'versão do Sistema'}.</GameAdminHint>}
  </GameAdminFrame>;

  return <GameAdminFrame neon={neon === 'on'}>
    {versionPicker}{gameSelector}{createModal}
    <GameAdminHeader>
      <div><h1>{editor.nomeJogo}</h1>
        <p>Modo {editor.numeroVersao} · {editor.status} · Sistema #{editor.idSistemaVersao}</p>
        {editor.descricaoJogo && <p>{editor.descricaoJogo}</p>}</div>
      <p>Runs iniciadas preservam a configuração publicada que escolheram.</p>
    </GameAdminHeader>
    {canAdapt && <GameAdminSection>
      <h2>Atualizar para o Sistema da Mesa</h2>
      <GameAdminHint>Esta aventura usa uma versão anterior. A adaptação cria um rascunho na versão atual e preserva as runs e publicações antigas.</GameAdminHint>
      <GameAdminActions><CyberButton theme={theme} neon={neon}
        text="Adaptar jogo" width="190px" disabled={state.busy || state.changed}
        onClick={() => { void state.adaptGame(); }} /></GameAdminActions>
    </GameAdminSection>}
    {canMigrate &&
      <GameAdminSection>
        <h2>Migrar jogo de outra versão</h2>
        <p>Cria um rascunho nesta versão do Sistema a partir do jogo anterior. Ajusta os resultados de ataque e os tipos de descanso; a versão antiga e as runs existentes não mudam.</p>
        <p>Origem: {sourceVersion?.number ?? '—'} → destino: {targetVersion?.number ?? '—'}. A origem permanece selecionável para futuras migrações; o jogo publicado acima pertence ao destino.</p>
        <GameAdminVersion><Select theme={theme} neon={neon} label="Versão de origem" width="100%"
          value={sourceVersionId ?? ''} allowEmptyOption={false} disabled={state.busy}
          options={archivedVersions.map((version) => ({ value: version.id, label: version.number }))}
          onChange={(event) => setMigrationSource(Number(event.target.value))} /></GameAdminVersion>
      </GameAdminSection>}
    {state.error && <p role="alert">{state.error}</p>}
    {state.notice && <p role="status">{state.notice}</p>}
    {editor.mapSchemaVersion < 5 && <GameAdminHint role="status">
      Esta versão ainda usa o mapa antigo. {editor.status === 'Rascunho'
        ? 'Salve e publique este rascunho'
        : 'Crie e publique um rascunho'} para usar o tamanho configurado de cada área nas próximas runs.
      As runs existentes preservam seus mapas.
    </GameAdminHint>}
    {editor.status === 'Publicado' ? <GameAdminDraftActions $paired={Boolean(canMigrate)}>
      <CyberButton theme={theme} neon={neon} disabled={state.busy}
        text="Criar rascunho" width="calc(100% - 15px)" onClick={() => void state.createDraft()} />
      {canMigrate && <CyberButton theme={theme} neon={neon} colorType="secondary"
        text="Migrar jogo" width="calc(100% - 15px)" disabled={state.busy || !sourceVersionId}
        onClick={() => { if (sourceVersionId) void state.cloneDraft(sourceVersionId); }} />}
    </GameAdminDraftActions> : <GameAdminActions>
        <CyberButton theme={theme} neon={neon} colorType="secondary" width="190px"
          disabled={!state.changed || state.busy} text="Salvar rascunho"
          onClick={() => void state.save()} />
        <CyberButton theme={theme} neon={neon} width="210px" disabled={state.busy}
          text="Publicar versão" onClick={() => void state.publish()} />
      </GameAdminActions>}

    <GameAdminTabs aria-label="Seções do gerenciamento do jogo">
      {([['geral', 'Geral'], ['ataque', 'Ataque'], ['areas', 'Áreas e rotas'], ['bases', 'Bases'],
        ['encontros', 'Personagens'], ['poderes', 'Poderes']] as const).map(([key, label]) =>
        <button key={key} type="button" aria-pressed={activeTab === key}
          onClick={() => setActiveTab(key)}>{label}</button>)}
    </GameAdminTabs>

    {activeTab === 'geral' && <GameAdminSection>
      <h2>Base</h2>
      <GameAdminWeightRow><label><input type="checkbox"
        checked={editor.repairProtectionAtBase !== false} disabled={!editable}
        onChange={(event) => state.updateRepairProtectionAtBase(event.target.checked)}
      />Consertar proteção ao entrar na Base</label></GameAdminWeightRow>
      <p>Restaura a proteção original dos itens carregados. O escudo não é restaurado pela Base.</p>
      <h2>Economia</h2>
      <p>Percentual descontado do valor de compra quando um item for vendido. O vendedor será implementado em uma etapa futura.</p>
      <GameAdminFields><InputText theme={theme} neon={neon}
        label="Desconto de venda do item" width="100%" type="number"
        value={editor.saleDiscountPercent ?? 0} disabled={!editable}
        onChange={(event) => state.updateSaleDiscount(Number(event.target.value))} /></GameAdminFields>
    </GameAdminSection>}

    {activeTab === 'poderes' && <ManagementGamePowers theme={theme} neon={neon}
      editable={!!editable} powers={editor.powerCatalog}
      onAdd={state.addPower} onUpdate={state.updatePower} onRemove={state.removePower}
      onUpload={state.uploadPowerImage} />}

    {activeTab === 'ataque' && <GameAdminSection>
      <h2>Ataque de reserva</h2>
      <p>Usado quando não houver ação equipada executável. O atributo vem da ficha do personagem; deixe vazio para rolar sem modificador.</p>
      <GameAdminFields>
        <InputText theme={theme} neon={neon} label="Nome" width="100%"
          value={editor.fallbackAction.name} disabled={!editable}
          onChange={(event) => state.updateFallback({ name: event.target.value })} />
        <InputText theme={theme} neon={neon} label="Dano base" width="100%" type="number"
          value={editor.fallbackAction.baseDamage} disabled={!editable}
          onChange={(event) => state.updateFallback({ baseDamage: Number(event.target.value) })} />
        <InputText theme={theme} neon={neon} label="Atributo (opcional)" width="100%"
          value={editor.fallbackAction.attributeCode ?? ''} disabled={!editable}
          onChange={(event) => state.updateFallback({ attributeCode: event.target.value || null })} />
      </GameAdminFields>
      <h3>Dano do personagem por resultado</h3>
      <p>Os resultados vêm da versão publicada do Sistema. O multiplicador e o bônus são aplicados ao dano de cada ataque.</p>
      <GameAdminGrid>{editor.attackOutcomeCodes.map((code) =>
        <GameAdminCard key={code} neon={neon === 'on'}><h4>{code}</h4><GameAdminFields>
          <InputText theme={theme} neon={neon} label="Multiplicador" width="100%" type="number"
            disabled={!editable} value={editor.playerDamageByResult[code]?.multiplier ?? 0}
            onChange={(event) => state.updatePlayerDamage(code,
              { multiplier: Number(event.target.value) })} />
          <InputText theme={theme} neon={neon} label="Bônus" width="100%" type="number"
            disabled={!editable} value={editor.playerDamageByResult[code]?.bonus ?? 0}
            onChange={(event) => state.updatePlayerDamage(code,
              { bonus: Number(event.target.value) })} />
        </GameAdminFields></GameAdminCard>)}</GameAdminGrid>
    </GameAdminSection>}

    {activeTab === 'areas' && <GameAdminSection>
      <h2>Áreas e rotas</h2>
      <p>Escolha de 3 a 24 nós jogáveis por área; o padrão é 18. Áreas secretas só aparecem quando uma passagem sorteada leva até elas.</p>
      <GameAdminGrid>{editor.areas.map((area, index) => <GameAdminCard key={area.code} neon={neon === 'on'}>
        <h3>{area.isSecret ? 'Área secreta' : `Fase ${editor.areas.slice(0, index + 1).filter((entry) => !entry.isSecret).length}`} · {area.name || 'Sem nome'}</h3>
        <GameAdminFields>
          {!area.isSecret && <InputText theme={theme} neon={neon} label="Ordem da fase" width="100%"
            type="number"
            value={editor.areas.slice(0, index + 1).filter((entry) => !entry.isSecret).length}
            disabled={!editable}
            onChange={(event) => state.moveArea(index, Number(event.target.value))} />}
          <InputText theme={theme} neon={neon} label="Nome da área" width="100%"
            value={area.name} disabled={!editable}
            onChange={(event) => state.updateArea(index, { name: event.target.value })} />
          <Select theme={theme} neon={neon} label="Nós jogáveis" width="100%" portal
            value={area.nodeCount ?? 18} disabled={!editable} allowEmptyOption={false}
            options={nodeCountOptions}
            onChange={(event) => state.updateArea(index, { nodeCount: Number(event.target.value) })} />
          <GameAdminWeightRow><label><input type="checkbox" checked={area.useBase !== false}
            disabled={!editable} onChange={(event) => state.updateArea(index, {
              useBase: event.target.checked,
              finalOption: !event.target.checked && area.finalOption === 'BASE' ? 'ALEATORIO' : area.finalOption,
            })} />Usar Base nesta área</label></GameAdminWeightRow>
          {area.isSecret && <GameAdminWeightRow><label><input type="checkbox"
            checked={area.isSecretFinal === true} disabled={!editable}
            onChange={(event) => state.updateArea(index, { isSecretFinal: event.target.checked })}
          />Área secreta final</label></GameAdminWeightRow>}
          {area.useBase !== false && <InputText theme={theme} neon={neon} label="Nome da Base" width="100%"
            value={area.baseName} disabled={!editable}
            onChange={(event) => state.updateArea(index, { baseName: event.target.value })} />}
          <Select theme={theme} neon={neon}
            label="Fim da área" width="100%" portal allowEmptyOption={false}
            value={area.finalOption || 'BASE'} disabled={!editable}
            options={[{ value: 'ALEATORIO', label: area.useBase === false ? 'Aleatório' : 'Aleatório (inclui a Base)' },
              ...(area.useBase === false ? [] : [{ value: 'BASE', label: area.baseName || 'Base' }]),
              ...area.options.map((option, optionIndex) => ({
                value: `ROTA:${optionIndex}`,
                label: `${optionIndex + 1}. ${['EVENTO', 'DESCANSO', 'ATALHO', 'CACADA', 'AREA_SECRETA'].includes(option.type)
                  ? option.label || option.type : editor.encounters[option.encounterCode]?.mapName || option.type}`,
              }))]}
            onChange={(event) => state.updateArea(index, { finalOption: event.target.value })} />
        </GameAdminFields>
        <GameAdminFields>
          <GameAdminImage><ImageUploader theme={theme} neon={neon} cropPreset={areaCrop}
            initialImage={normalizeImagePath(area.image ?? undefined)}
            label="Fundo da área" onImageCropped={(result) => { if (editable) void state.uploadAreaImage(index, result.file); }}
            onRemove={() => { if (editable) state.updateArea(index, { image: null }); }} /></GameAdminImage>
          {area.useBase !== false && <GameAdminImage><ImageUploader theme={theme} neon={neon} cropPreset={areaCrop}
            initialImage={normalizeImagePath(area.baseImage ?? undefined)}
            label="Imagem da Base" onImageCropped={(result) => { if (editable) void state.uploadAreaImage(index, result.file, 'base'); }}
            onRemove={() => { if (editable) state.updateArea(index, { baseImage: null }); }} /></GameAdminImage>}
        </GameAdminFields>
        <h4>Pool de encontros · {area.nodeCount ?? 18} nós jogáveis nesta área</h4>
        <GameAdminHint>As opções são sorteadas pelo peso e podem reaparecer, exceto quando marcadas como únicas. O último nó usa a escolha acima{area.useBase === false ? '.' : '; a Base ainda pode aparecer antes dele.'}</GameAdminHint>
        {area.options.map((option, optionIndex) => <GameAdminRoute key={`${area.code}-${optionIndex}`}>
          <Select theme={theme} neon={neon} label="Tipo de rota" width="100%" portal
            value={option.type} disabled={!editable} allowEmptyOption={false}
            options={[{ value: 'COMBATE', label: 'Combate' }, { value: 'ELITE', label: 'Elite' },
              { value: 'BOSS', label: 'Chefe' }, { value: 'DESCANSO', label: 'Descanso' },
              { value: 'EVENTO', label: 'Evento narrativo' },
              { value: 'ATALHO', label: 'Atalho' }, { value: 'CACADA', label: 'Caçada' },
              { value: 'AREA_SECRETA', label: 'Área secreta' }]}
            onChange={(event) => {
              const options = [...area.options];
              const type = event.target.value as GameModeAreaOption['type'];
              options[optionIndex] = { ...option, type,
                encounterCode: ['EVENTO', 'DESCANSO', 'ATALHO', 'CACADA', 'AREA_SECRETA'].includes(type) ? '' :
                  (editor.encounters[option.encounterCode] ? option.encounterCode : ''),
                encounterCodes: type === 'CACADA' ? option.encounterCodes ?? [] : [],
                secretAreaCode: type === 'AREA_SECRETA' ? option.secretAreaCode ?? '' : null,
                unique: type === 'AREA_SECRETA' ? true : option.unique,
                label: ['EVENTO', 'DESCANSO', 'ATALHO', 'CACADA', 'AREA_SECRETA'].includes(type)
                  ? option.label || (({ EVENTO: 'Evento', DESCANSO: 'Descanso', ATALHO: 'Atalho', CACADA: 'Caçada', AREA_SECRETA: 'Passagem secreta' } as Record<string, string>)[type] ?? type)
                  : option.label };
              state.updateArea(index, { options });
            }} />
          {['EVENTO', 'DESCANSO', 'ATALHO', 'CACADA', 'AREA_SECRETA'].includes(option.type) ? <>
            <InputText theme={theme} neon={neon} label="Nome da rota" width="100%"
              value={option.label ?? ''} disabled={!editable}
              onChange={(event) => {
                const options = [...area.options];
                options[optionIndex] = { ...option, label: event.target.value };
                state.updateArea(index, { options });
              }} />
            {option.type === 'EVENTO' && <InputText theme={theme} neon={neon}
              label="Texto do evento para o jogador" width="100%"
              value={option.description ?? ''} disabled={!editable}
              onChange={(event) => {
                const options = [...area.options];
                options[optionIndex] = { ...option, description: event.target.value };
                state.updateArea(index, { options });
              }} />}
            {option.type === 'EVENTO' && <InputText theme={theme} neon={neon}
              label="Tempo de jogo do evento (minutos)" width="100%" type="number"
              value={option.gameMinutes ?? 0} disabled={!editable}
              onChange={(event) => {
                const options = [...area.options];
                options[optionIndex] = { ...option,
                  gameMinutes: Math.min(1_000_000, Math.max(0, Math.trunc(Number(event.target.value) || 0))) };
                state.updateArea(index, { options });
              }} />}
            {option.type === 'CACADA' && (editable ? <CheckSelect
              theme={theme} neon={neon} label="Encontros possíveis" width="100%" compactPreview
              value={option.encounterCodes ?? []}
              options={Object.entries(editor.encounters).map(([encounterCode, encounter]) => ({
                value: encounterCode,
                label: `${encounter.mapName || encounterCode} · ${encounter.enemy.name} ×${encounter.enemy.quantity ?? 1}`,
              }))}
              onChange={(encounterCodes) => {
                const options = [...area.options];
                options[optionIndex] = { ...option, encounterCodes };
                state.updateArea(index, { options });
              }} /> : <GameAdminHint>{(option.encounterCodes ?? []).map((encounterCode) =>
              editor.encounters[encounterCode]?.mapName ?? encounterCode).join(', ')}</GameAdminHint>)}
            {option.type === 'AREA_SECRETA' && <Select theme={theme} neon={neon}
              label="Área secreta de destino" width="100%" portal
              value={option.secretAreaCode ?? ''} disabled={!editable}
              options={editor.areas.filter((entry) => entry.isSecret && entry.code !== area.code).map((entry) => ({
                value: entry.code, label: entry.name,
              }))}
              onChange={(event) => {
                const options = [...area.options];
                options[optionIndex] = { ...option, secretAreaCode: event.target.value };
                state.updateArea(index, { options });
              }} />}
          </> : <Select theme={theme} neon={neon} label="Encontro da rota" width="100%" portal
            value={option.encounterCode ?? ''} disabled={!editable}
            options={Object.entries(editor.encounters).map(([code, encounter]) => ({
              value: code, label: `${encounter.mapName || code} · ${encounter.enemy.name} ×${encounter.enemy.quantity ?? 1}`,
            }))}
            onChange={(event) => {
              const options = [...area.options];
              options[optionIndex] = { ...option, encounterCode: event.target.value };
              state.updateArea(index, { options });
            }} />}
          <GameAdminWeightRow>
            <InputText theme={theme} neon={neon} label="Peso no sorteio" width="100%"
              type="number" value={option.weight} disabled={!editable}
              onChange={(event) => {
                const options = [...area.options];
                options[optionIndex] = { ...option, weight: Number(event.target.value) };
                state.updateArea(index, { options });
              }} />
            <label><input type="checkbox" checked={option.unique ?? false} disabled={!editable}
              onChange={(event) => {
                const options = [...area.options];
                options[optionIndex] = { ...option, unique: event.target.checked };
                state.updateArea(index, { options });
              }} />Único</label>
          </GameAdminWeightRow>
          {(['EVENTO', 'DESCANSO', 'ATALHO', 'CACADA', 'AREA_SECRETA'].includes(option.type)) &&
            <GameAdminImage data-route-image>
              <GameAdminRouteImageHeader $neon={neon === 'on'}>
                <span>Imagem da opção</span>
                <GameAdminDelete type="button" disabled={!editable || area.options.length <= 1}
                  title={area.options.length <= 1 ? 'Cada área precisa de ao menos uma rota' : 'Excluir rota'}
                  aria-label={`Excluir rota ${optionIndex + 1} de ${area.name}`}
                  onClick={() => state.removeRoute(index, optionIndex)}><DeleteOutlineIcon /></GameAdminDelete>
              </GameAdminRouteImageHeader>
              <ImageUploader theme={theme} neon={neon}
              cropPreset={option.type === 'AREA_SECRETA' ? areaCrop : routeCrop}
              initialImage={normalizeImagePath(option.image ?? undefined)}
              label="Imagem da opção"
              onImageCropped={(result) => { if (editable) void state.uploadAreaImage(index, result.file, optionIndex); }}
              onRemove={() => { if (editable) {
                const options = [...area.options];
                options[optionIndex] = { ...option, image: null };
                state.updateArea(index, { options });
              } }} /></GameAdminImage>}
          {!['EVENTO', 'DESCANSO', 'ATALHO', 'CACADA', 'AREA_SECRETA'].includes(option.type) && <GameAdminDelete type="button" disabled={!editable || area.options.length <= 1}
            title={area.options.length <= 1 ? 'Cada área precisa de ao menos uma rota' : 'Excluir rota'}
            aria-label={`Excluir rota ${optionIndex + 1} de ${area.name}`}
            onClick={() => state.removeRoute(index, optionIndex)}>
            <DeleteOutlineIcon />
          </GameAdminDelete>}
        </GameAdminRoute>)}
        <GameAdminActions>
          <CyberButton theme={theme} neon={neon} text="Adicionar rota" width="165px"
            disabled={!editable || area.options.length >= 20}
            onClick={() => state.addRoute(index)} />
          <CyberButton theme={theme} neon={neon} colorType="secondary" text="Remover área"
            width="165px" disabled={!editable || (!area.isSecret &&
              editor.areas.filter((entry) => !entry.isSecret).length <= 1) ||
              editor.areas.some((entry) => entry.options.some((option) => option.secretAreaCode === area.code))}
            onClick={() => state.removeArea(index)} />
        </GameAdminActions>
      </GameAdminCard>)}</GameAdminGrid>
      <GameAdminActions><CyberButton theme={theme} neon={neon} text="Adicionar área" width="165px"
        disabled={!editable || editor.areas.filter((area) => !area.isSecret).length >= 5}
        onClick={state.addArea} />
        <CyberButton theme={theme} neon={neon} text="Área secreta" width="165px"
          disabled={!editable || editor.areas.filter((area) => area.isSecret).length >= 4}
          onClick={state.addSecretArea} /></GameAdminActions>
    </GameAdminSection>}

    {activeTab === 'bases' && <GameAdminSection>
      <h2>Descanso das Bases</h2>
      <p>Cada Base usa a recuperação do tipo escolhido na versão publicada do Sistema. A Base é considerada um local seguro para descansos que exigem guarda; fórmulas não executáveis ficam indisponíveis.</p>
      <GameAdminGrid>{editor.areas.map((area, index) => {
        if (area.useBase === false) return null;
        const selected = state.restOptions.find((rest) => rest.type === (area.baseRestType ?? 'SIMPLES'));
        return <GameAdminCard key={area.code} neon={neon === 'on'}>
          <h3>{area.name} · {area.baseName}</h3>
          <Select theme={theme} neon={neon} label="Tipo de descanso da Base" width="100%"
            portal allowEmptyOption={false} value={area.baseRestType ?? 'SIMPLES'}
            disabled={!editable || state.restOptions.every((rest) => !rest.executable)}
            options={state.restOptions.filter((rest) => rest.executable).map((rest) => ({
              value: rest.type, label: rest.name,
            }))}
            onChange={(event) => state.updateArea(index, { baseRestType: event.target.value })} />
          {selected ? <GameAdminHint>Vida {selected.life}{selected.percentage ? '%' : ''} · Mana {selected.mana}{selected.percentage ? '%' : ''} · Estamina {selected.stamina}{selected.percentage ? '%' : ''}{selected.requiresGuard ? ' · Base segura dispensa guarda' : ''}</GameAdminHint> :
            <GameAdminHint role="alert">Escolha um descanso executável desta versão do Sistema.</GameAdminHint>}
        </GameAdminCard>;
      })}</GameAdminGrid>
    </GameAdminSection>}

    {activeTab === 'encontros' && <GameAdminSection>
      <h2>Personagens e encontros</h2>
      <p>Crie os cards aqui e selecione os encontros nas rotas da área. A ficha da Wiki é copiada na publicação; personagens exclusivos vivem somente no jogo.</p>
      <ManagementGameEncounterCatalog editor={editor} mesaId={mesaId} npcs={state.npcs} editable={!!editable}
        theme={theme} neon={neon} addEncounter={state.addEncounter}
        updateEncounter={state.updateEncounter} updateEnemy={state.updateEnemy}
        selectNpc={state.selectNpc} removeEncounter={state.removeEncounter}
        uploadEnemyImage={state.uploadEnemyImage} />
    </GameAdminSection>}
  </GameAdminFrame>;
};
