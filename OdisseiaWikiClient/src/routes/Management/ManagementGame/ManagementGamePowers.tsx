import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { ImageUploader } from '../../../components/Generic/ImageUploader/ImageUploader';
import type { CropPreset } from '../../../components/Generic/ImageUploader/types';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { Select } from '../../../components/Generic/Select/Select';
import { TextArea } from '../../../components/Generic/TextArea/TextArea';
import type { GameModePowerOption } from '../../../models/GameModeManagement';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import {
  GameAdminActions, GameAdminCard, GameAdminDelete, GameAdminEncounterHeader,
  GameAdminFields, GameAdminGrid, GameAdminHint, GameAdminSection,
} from './ManagementGame.style';
import { GameAdminPowerCopy, GameAdminPowerDescription, GameAdminPowerMedia } from './ManagementGamePowers.style';

const powerCrop: CropPreset = { mode: 'single', aspectRatio: 1,
  shape: 'rectangle', displayShape: 'rectangle', label: 'Poder (quadrado)' };

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  editable: boolean;
  powers: GameModePowerOption[];
  onAdd: (type: GameModePowerOption['type']) => void;
  onUpdate: (id: string, update: Partial<GameModePowerOption>) => void;
  onRemove: (id: string) => void;
  onUpload: (id: string, file: File) => Promise<void>;
}

export const ManagementGamePowers = ({ theme, neon, editable, powers,
  onAdd, onUpdate, onRemove, onUpload }: Props) => <GameAdminSection>
  <h2>Skills e ultimates</h2>
  <GameAdminHint>Cadastre opções pré-feitas para uma futura escolha ao evoluir. Por enquanto elas são apenas conteúdo: não gastam pontos, não aparecem para o jogador e não executam efeitos no combate.</GameAdminHint>
  {editable && <GameAdminActions>
    <CyberButton theme={theme} neon={neon} text="Adicionar skill" width="180px"
      disabled={powers.length >= 40} onClick={() => onAdd('SKILL')} />
    <CyberButton theme={theme} neon={neon} colorType="secondary" text="Adicionar ultimate" width="200px"
      disabled={powers.length >= 40} onClick={() => onAdd('ULTIMATE')} />
  </GameAdminActions>}
  {powers.length === 0 && <GameAdminHint>Nenhuma opção cadastrada nesta versão do jogo.</GameAdminHint>}
  <GameAdminGrid>{powers.map((power) => <GameAdminCard key={power.id} neon={neon === 'on'}>
    <GameAdminEncounterHeader>
      <div><h3>{power.name || (power.type === 'ULTIMATE' ? 'Nova ultimate' : 'Nova skill')}</h3>
        <small>{power.type === 'ULTIMATE' ? 'Ultimate' : 'Skill'} · conteúdo não executável</small></div>
      {editable && <GameAdminDelete type="button" aria-label={`Remover ${power.name || 'poder'}`}
        onClick={() => onRemove(power.id)}><DeleteOutlineIcon /></GameAdminDelete>}
    </GameAdminEncounterHeader>
    <GameAdminFields>
      <Select theme={theme} neon={neon} label="Tipo" width="100%" allowEmptyOption={false}
        value={power.type} disabled={!editable}
        options={[{ value: 'SKILL', label: 'Skill' }, { value: 'ULTIMATE', label: 'Ultimate' }]}
        onChange={(event) => onUpdate(power.id, { type: event.target.value as GameModePowerOption['type'] })} />
      <InputText theme={theme} neon={neon} label="Nível mínimo futuro" width="100%" type="number"
        value={power.minLevel} disabled={!editable}
        onChange={(event) => onUpdate(power.id, { minLevel: Number(event.target.value) })} />
      <InputText theme={theme} neon={neon} label="Nome" width="100%" value={power.name}
        disabled={!editable} onChange={(event) => onUpdate(power.id, { name: event.target.value })} />
    </GameAdminFields>
    <GameAdminPowerDescription>
      {editable ? <TextArea theme={theme} neon={neon} label="Apresentação" value={power.description ?? ''}
        fullWidth rows={3} onChange={(event) => onUpdate(power.id, { description: event.target.value || null })} />
        : <GameAdminPowerCopy><small>Apresentação</small><p>{power.description || 'Não informada.'}</p></GameAdminPowerCopy>}
    </GameAdminPowerDescription>
    <GameAdminPowerDescription>
      {editable ? <TextArea theme={theme} neon={neon} label="Requisitos futuros (texto)"
        value={power.requirements ?? ''} fullWidth rows={2}
        onChange={(event) => onUpdate(power.id, { requirements: event.target.value || null })} />
        : <GameAdminPowerCopy><small>Requisitos futuros</small><p>{power.requirements || 'Não informados.'}</p></GameAdminPowerCopy>}
    </GameAdminPowerDescription>
    {(editable || power.image) && <GameAdminPowerMedia>
      {editable ? <ImageUploader theme={theme} neon={neon} cropPreset={powerCrop}
        initialImage={normalizeImagePath(power.image ?? undefined)} label="Imagem do poder"
        onImageCropped={(result) => { void onUpload(power.id, result.file); }}
        onRemove={() => onUpdate(power.id, { image: null })} />
        : power.image && <img src={normalizeImagePath(power.image) || undefined} alt="" />}
    </GameAdminPowerMedia>}
  </GameAdminCard>)}</GameAdminGrid>
</GameAdminSection>;
