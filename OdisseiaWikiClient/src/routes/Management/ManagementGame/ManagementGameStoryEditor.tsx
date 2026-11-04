import { useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { TextArea } from '../../../components/Generic/TextArea/TextArea';
import { Select } from '../../../components/Generic/Select/Select';
import { CheckSelect } from '../../../components/Generic/CheckSelect/CheckSelect';
import { CheckBox } from '../../../components/Generic/CheckBox/CheckBox';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { HelpHeading } from '../../../components/Generic/HelpHeading/HelpHeading';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { ImageUploader } from '../../../components/Generic/ImageUploader/ImageUploader';
import type { GameModeArea, GameModeAreaOption, GameModeEncounter } from '../../../models/GameModeManagement';
import { emptyStoryCost, emptyStoryOutcome } from '../../../utils/gameStory';
import { gameConfigurationHelp as help } from '../../../content/gameConfigurationHelp';
import { obterConfiguracaoSobrevivenciaSistemaRpg } from '../../../services/sistemasRpgService';
import { saveAsset } from '../../../services/assetsService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { GameAdminActions, GameAdminFields, GameAdminHint } from './ManagementGame.style';
import { Offers, VendorCatalogTrigger } from './ManagementGameVendorOffers/ManagementGameVendorOffers.style';
import { ManagementGameNpcServices } from './ManagementGameNpcServices';
import { ManagementGameVendorOffers } from './ManagementGameVendorOffers';
import { StoryCostEditor, StoryOutcomeEditor } from './ManagementGameStoryEffects';
import { useGameItemCatalog } from './useGameItemCatalog';
import { StoryEditorActions, StoryEditorBody } from './ManagementGameStoryEditor.style';

interface Props {
  option: GameModeAreaOption; onChange: (option: GameModeAreaOption) => void; areas: GameModeArea[];
  encounters: Record<string, GameModeEncounter>; systemVersionId: number; mesaId?: number;
  theme: 'dark' | 'light'; neon: 'on' | 'off'; editable: boolean;
}
const resultTypes = [
  ['COMBATE', 'Combate'], ['ELITE', 'Elite'], ['BOSS', 'Chefe'], ['EVENTO', 'Evento'], ['DESCANSO', 'Descanso'],
  ['CACADA', 'Caçada'], ['NPC', 'NPC'], ['VENDEDOR', 'Mercador'], ['ATALHO', 'Atalho'], ['AREA_SECRETA', 'Área secreta'], ['MISSAO', 'Missão'],
] as const;

export function ManagementGameStoryEditor(props: Props) {
  const { option, onChange, areas, encounters, systemVersionId, mesaId, theme, neon, editable } = props;
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [conditions, setConditions] = useState<{ codigo: string; nome: string }[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const catalogue = useGameItemCatalog(mesaId, systemVersionId, open);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setRulesLoading(true); setError(null); setConditions([]);
    void obterConfiguracaoSobrevivenciaSistemaRpg(systemVersionId, { signal: controller.signal })
      .then(rules => { if (!controller.signal.aborted) setConditions(rules.condicoes); })
      .catch(reason => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason, 'Não foi possível carregar as condições do Sistema.')); })
      .finally(() => { if (!controller.signal.aborted) setRulesLoading(false); });
    return () => controller.abort();
  }, [open, systemVersionId]);
  const canEdit = editable && !uploading;
  const appearance = { theme, neon, editable: canEdit };
  const effectsProps = { ...appearance, items: catalogue.items, conditions };
  const choices = option.choices ?? [], results = option.surpriseOptions ?? [];
  const compact = option.type === 'SURPRESA' && results.length === 0;
  const mission = option.mission ?? { areaCode: '', canDecline: true, cost: emptyStoryCost(), reward: emptyStoryOutcome() };
  const title = option.type === 'SURPRESA' ? 'Possíveis encontros' : option.type === 'MISSAO' ? 'Objetivo e recompensa da missão' : 'Escolhas do evento';
  const updateResult = (index: number, next: GameModeAreaOption) => onChange({ ...option,
    surpriseOptions: results.map((entry, at) => at === index ? next : entry) });
  return <>
    <VendorCatalogTrigger type="button" onClick={() => setOpen(true)} $neon={neon === 'on'} aria-haspopup="dialog">
      <AccountTreeOutlinedIcon aria-hidden /><span><strong>{title}</strong><small>{option.type === 'SURPRESA' ? `${results.length} ${results.length === 1 ? 'encontro possível' : 'encontros possíveis'}`
        : option.type === 'MISSAO' ? areas.find(area => area.code === mission.areaCode)?.name ?? 'Escolher área e recompensa'
          : `${choices.length} escolhas configuradas`}</small></span><ExpandMoreIcon aria-hidden />
    </VendorCatalogTrigger>
    {open && <Modal title={title} theme={theme} neon={neon} width={compact ? '620px' : '1100px'} showFooter={false} onClose={() => { if (!uploading) setOpen(false); }}>
      <StoryEditorBody $compact={compact}>
        {(catalogue.error || error) && <p role="alert">{catalogue.error || error}</p>}
        {(catalogue.loading || rulesLoading || uploading) && <LoadingIndicator compact label={uploading ? 'Enviando imagem' : 'Consultando regras e itens'} />}
        {option.type === 'EVENTO' && <>
          <HelpHeading label="Escolhas do evento" level="h4" theme={theme} neon={neon} help={help.storyChoices} />
          {!choices.length && <GameAdminHint>Sem escolhas, este evento apenas avança o caminho e o tempo configurado.</GameAdminHint>}
          {choices.map((choice, index) => <details key={choice.code}><summary>{index + 1}. {choice.label || 'Nova escolha'}</summary><Offers>
            <InputText label="Nome da escolha" theme={theme} neon={neon} width="100%" value={choice.label} disabled={!canEdit}
              onChange={event => onChange({ ...option, choices: choices.map((entry, at) => at === index ? { ...entry, label: event.target.value } : entry) })} />
            <TextArea label="Descrição da escolha" theme={theme} neon={neon} width="100%" value={choice.description ?? ''} disabled={!canEdit}
              onChange={event => onChange({ ...option, choices: choices.map((entry, at) => at === index ? { ...entry, description: event.target.value } : entry) })} />
            <TextArea label="Texto após a escolha" theme={theme} neon={neon} width="100%" value={choice.resultText ?? ''} disabled={!canEdit}
              onChange={event => onChange({ ...option, choices: choices.map((entry, at) => at === index ? { ...entry, resultText: event.target.value } : entry) })} />
            <StoryCostEditor {...appearance} value={choice.cost} onChange={cost => onChange({ ...option, choices: choices.map((entry, at) => at === index ? { ...entry, cost } : entry) })} />
            <StoryOutcomeEditor {...effectsProps} value={choice.outcome} onChange={outcome => onChange({ ...option, choices: choices.map((entry, at) => at === index ? { ...entry, outcome } : entry) })} />
            <GameAdminActions><CyberButton text="Remover escolha" theme={theme} neon={neon} colorType="secondary" disabled={!canEdit}
              onClick={() => onChange({ ...option, choices: choices.filter((_, at) => at !== index) })} /></GameAdminActions>
          </Offers></details>)}
        </>}
        {option.type === 'MISSAO' && <>
          <Select label="Área da missão" theme={theme} neon={neon} width="100%" portal value={mission.areaCode} disabled={!canEdit}
            help={help.missionTarget} options={areas.filter(area => area.isSecret && !area.isSecretFinal).map(area => ({ value: area.code, label: area.name }))}
            onChange={event => onChange({ ...option, mission: { ...mission, areaCode: event.target.value } })} />
          <CheckBox label="Permitir recusar" neon={neon} checked={mission.canDecline} disabled={!canEdit} help={help.missionDecline}
            onChange={canDecline => onChange({ ...option, mission: { ...mission, canDecline } })} />
          <StoryCostEditor {...appearance} value={mission.cost} onChange={cost => onChange({ ...option, mission: { ...mission, cost } })} />
          <StoryOutcomeEditor {...effectsProps} value={mission.reward} onChange={reward => onChange({ ...option, mission: { ...mission, reward } })} />
        </>}
        {option.type === 'SURPRESA' && <>
          <HelpHeading label="Possíveis encontros" level="h4" theme={theme} neon={neon} help={help.surpriseResults} />
          {compact && <GameAdminHint>Adicione os possíveis encontros deste ponto. O jogador só descobre o que encontrará depois de escolher esse caminho.</GameAdminHint>}
          {results.map((result, index) => <details key={index}><summary>{index + 1}. {result.label || result.type}</summary><Offers>
            <GameAdminFields>
              <Select label="Tipo do resultado" theme={theme} neon={neon} width="100%" portal value={result.type} disabled={!canEdit} allowEmptyOption={false}
                options={resultTypes.map(([value, label]) => ({ value, label }))} onChange={event => updateResult(index, { type: event.target.value as GameModeAreaOption['type'],
                  encounterCode: '', weight: result.weight, label: 'Resultado', npcType: 'MERCADOR', npcCode: crypto.randomUUID() })} />
              <InputText label="Peso no sorteio" type="number" theme={theme} neon={neon} width="100%" min={1} max={100} value={result.weight}
                help={help.routeWeight} disabled={!canEdit} onChange={event => updateResult(index, { ...result, weight: Number(event.target.value) })} />
            </GameAdminFields>
            <InputText label="Nome do resultado" theme={theme} neon={neon} width="100%" value={result.label ?? ''} disabled={!canEdit}
              onChange={event => updateResult(index, { ...result, label: event.target.value })} />
            <TextArea label="Descrição do resultado" theme={theme} neon={neon} width="100%" value={result.description ?? ''} disabled={!canEdit}
              onChange={event => updateResult(index, { ...result, description: event.target.value })} />
            {['COMBATE', 'ELITE', 'BOSS'].includes(result.type) && <Select label="Encontro" theme={theme} neon={neon} width="100%" portal value={result.encounterCode} disabled={!canEdit}
              options={Object.entries(encounters).map(([value, encounter]) => ({ value, label: encounter.mapName }))}
              onChange={event => updateResult(index, { ...result, encounterCode: event.target.value })} />}
            {result.type === 'CACADA' && <CheckSelect label="Encontros possíveis" theme={theme} neon={neon} width="100%" disabled={!canEdit}
              value={result.encounterCodes ?? []} options={Object.entries(encounters).map(([value, encounter]) => ({ value, label: encounter.mapName }))}
              onChange={encounterCodes => updateResult(index, { ...result, encounterCodes })} />}
            {result.type === 'AREA_SECRETA' && <Select label="Área secreta" theme={theme} neon={neon} width="100%" portal value={result.secretAreaCode ?? ''} disabled={!canEdit}
              options={areas.filter(area => area.isSecret).map(area => ({ value: area.code, label: area.name }))}
              onChange={event => updateResult(index, { ...result, secretAreaCode: event.target.value })} />}
            {result.type === 'NPC' && <>
              <Select label="Serviço do NPC" theme={theme} neon={neon} width="100%" portal disabled={!canEdit} value={result.npcType ?? 'MERCADOR'} allowEmptyOption={false}
                options={[{ value: 'MERCADOR', label: 'Mercador' }, { value: 'MEDICO', label: 'Médico' },
                  { value: 'SABIO', label: 'Sábio' }, { value: 'ENGENHEIRO', label: 'Engenheiro' }]}
                onChange={event => updateResult(index, { ...result, npcType: event.target.value as GameModeAreaOption['npcType'], offers: [], upgrade: null, repairPricePer10Percent: null })} />
              <CheckBox label="Bloqueado até ser libertado" neon={neon} checked={result.npcLocked ?? false} disabled={!canEdit} help={help.npcLocked}
                onChange={npcLocked => updateResult(index, { ...result, npcLocked })} />
              {['SABIO', 'ENGENHEIRO'].includes(result.npcType ?? '') && <ManagementGameNpcServices {...appearance} option={result}
                onChange={next => updateResult(index, next)} systemVersionId={systemVersionId} mesaId={mesaId} />}
            </>}
            {(result.type === 'VENDEDOR' || result.type === 'NPC' && result.npcType === 'MERCADOR') && <ManagementGameVendorOffers {...appearance}
              offers={result.offers ?? []} offerCount={result.offerCount ?? 3} onChange={offers => updateResult(index, { ...result, offers })}
              onOfferCountChange={offerCount => updateResult(index, { ...result, offerCount })} mesaId={mesaId} systemVersionId={systemVersionId} />}
            {['EVENTO', 'MISSAO'].includes(result.type) && <ManagementGameStoryEditor {...props} editable={canEdit} option={result} onChange={next => updateResult(index, next)} />}
            {!['COMBATE', 'ELITE', 'BOSS'].includes(result.type) && <ImageUploader label="Imagem do resultado" theme={theme} neon={neon}
              initialImage={normalizeImagePath(result.image ?? undefined)} cropPreset={{ mode: 'single', aspectRatio: 1, shape: 'circle', displayShape: 'circle', label: 'Resultado' }}
              onRemove={() => { if (canEdit) updateResult(index, { ...result, image: null }); }} onImageCropped={cropped => {
                if (!canEdit) return;
                setUploading(true); setError(null);
                void saveAsset({ imageFile: cropped.file, type: 'jogo', entityName: 'surpresa', mesaId })
                  .then(asset => updateResult(index, { ...result, image: asset.path }))
                  .catch(reason => setError(getApiErrorMessage(reason, 'Não foi possível enviar a imagem.'))).finally(() => setUploading(false));
              }} />}
            <GameAdminActions><CyberButton text="Remover resultado" theme={theme} neon={neon} colorType="secondary" disabled={!canEdit}
              onClick={() => onChange({ ...option, surpriseOptions: results.filter((_, at) => at !== index) })} /></GameAdminActions>
          </Offers></details>)}
        </>}
        <StoryEditorActions>
          {option.type === 'EVENTO' && <CyberButton text="Adicionar escolha" theme={theme} neon={neon} colorType="secondary" disabled={!canEdit || choices.length >= 6}
            onClick={() => onChange({ ...option, choices: [...choices, { code: crypto.randomUUID(), label: `Escolha ${choices.length + 1}`,
              cost: emptyStoryCost(), outcome: emptyStoryOutcome() }] })} />}
          {option.type === 'SURPRESA' && <CyberButton text="Adicionar resultado" theme={theme} neon={neon} colorType="secondary" disabled={!canEdit || results.length >= 10}
            onClick={() => onChange({ ...option, surpriseOptions: [...results, { type: 'COMBATE', label: 'Novo resultado', encounterCode: '', weight: 1 }] })} />}
          <CyberButton text="Concluir" theme={theme} neon={neon} disabled={uploading} onClick={() => setOpen(false)} />
        </StoryEditorActions>
      </StoryEditorBody>
    </Modal>}
  </>;
}
