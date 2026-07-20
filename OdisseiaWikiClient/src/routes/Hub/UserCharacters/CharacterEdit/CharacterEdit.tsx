import React from 'react'
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { PersonagemJogador } from '../../../../models/PersonagemJogador';
import { useFormUserCharacter } from '../CharacterCreate/useFormUserCharacter';
import { FormController, FormEditController, NavegationButtons } from '../CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { createItemColumns, createSkillsColumns, createMagiasColumns } from '../CharacterCreate/tableColumnsConfig';
import { CharacterSystemForm } from '../../../Shared/CharacterForms/CharacterSystemForm';
import { CharacterRoleplayForm } from '../../../Shared/CharacterForms/CharacterRoleplayForm';
import { CharacterStepDots } from '../../../Shared/CharacterForms/CharacterStepDots';
import { deletarPersonagemJogador } from '../../../../services/personagemJogadorService';
import { getApiErrorMessage } from '../../../../utils/apiError';
import {
  CharacterEditActions,
  CharacterOptionButton,
  FloatingActions,
  FloatingSaveButton,
  SyncIconBadge,
} from './CharacterEdit.style';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  personagem: PersonagemJogador;
  userId: number;
  initialStep?: 1 | 2;
  onSave?: () => void | Promise<void>;
  onBack: () => void;
}

export const CharacterEdit = ({ theme, neon, personagem, userId, initialStep = 1, onSave, onBack }: UserCharactersProps) => {
  const [editStep, setEditStep] = React.useState<1 | 2>(initialStep);
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [raceError, setRaceError] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const hasSnapshotInitializedRef = React.useRef(false);
  const saveInFlightRef = React.useRef(false);

    const {
        handleUpdate,
        isSubmitting,
        userName,
    setUserName,
    race,
    handleRaceChange,
    city,
    setCity,
    avatarUrl,
    setAvatarUrl,
    setAvatarFile,
    galeriaUrls,
    galeriaShapes,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    history,
    setHistory,
    costumes,
    setCostumes,
    extraInformation,
    setExtraInformation,
    nanites,
    setNanites,
    alignment,
    setAlignment,
    traits,
    setTraits,
    idpassiva,
    setIdpassiva,
    ultimate,
    setUltimate,
    listPersonagemRelacionado,
    setListPersonagemRelacionado,
        itens, setItens,
        skills, setSkills,
        magias, setMagias,
        statusBasico, setStatusBasico,
        listRaces,
    listCities,
    loadingRaces,
    loadingCities,
    selectedRace,
    personagens,
    allPersonagens,
    searchTerm,
    loadingPersonagens,
    searchPersonagens,
        xp, setXp,
        level, setLevel,
        atributosPrincipais, setAtributosPrincipais,
        atributosSecundarios, setAtributosSecundarios,
        defesas, setDefesas,
        listItens, handleSelectItem,
    } = useFormUserCharacter(userId, onSave, personagem);

    // Debug logs and temporary race-filter removed

    const raceImageUrl = React.useMemo(() => 
        selectedRace?.imagem ?? '',
        [selectedRace]
    );

    const itemColumns = React.useMemo(() => createItemColumns(theme, neon), [theme, neon]);
    const skillsColumns = React.useMemo(() => createSkillsColumns(theme, neon), [theme, neon]);
    const magiasColumns = React.useMemo(() => createMagiasColumns(theme, neon), [theme, neon]);

    const snapshot = React.useMemo(() => JSON.stringify({
      userName,
      race,
      city,
      avatarUrl,
      galeriaUrls,
      galeriaShapes,
      history,
      costumes,
      extraInformation,
      nanites,
      alignment,
      traits,
      listPersonagemRelacionado,
      statusBasico,
      xp,
      level,
      atributosPrincipais,
      atributosSecundarios,
      defesas,
      itens,
      skills,
      magias,
    }), [
      userName,
      race,
      city,
      avatarUrl,
      galeriaUrls,
      galeriaShapes,
      history,
      costumes,
      extraInformation,
      nanites,
      alignment,
      traits,
      listPersonagemRelacionado,
      statusBasico,
      xp,
      level,
      atributosPrincipais,
      atributosSecundarios,
      defesas,
      itens,
      skills,
      magias,
    ]);

    React.useEffect(() => {
      hasSnapshotInitializedRef.current = false;
      setLastSavedSnapshot('');
      setEditStep(initialStep);
    }, [personagem.idpersonagemJogador, initialStep]);

    React.useEffect(() => {
      if (hasSnapshotInitializedRef.current) return;
      if (!userName || race === undefined) return;

      hasSnapshotInitializedRef.current = true;
      setLastSavedSnapshot(snapshot);
    }, [snapshot, userName, race]);

    const isSynced = lastSavedSnapshot !== '' && snapshot === lastSavedSnapshot;

    const isFirstStep = editStep === 1;
    const isLastStep = editStep === 2;

    const validateEdit = React.useCallback(() => {
      const hasNameError = !userName.trim();
      const hasRaceError = !race || race === 0;

      setNameError(hasNameError);
      setRaceError(hasRaceError);

      if (hasNameError || hasRaceError) {
        setEditStep(1);
        toast.error('Corrija os campos obrigatórios destacados.');
        return false;
      }

      return true;
    }, [userName, race]);

    const handleSave = React.useCallback(async (goBackAfterSave = false) => {
      if (!validateEdit()) return;
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;

      try {
        const success = await handleUpdate();
        if (success) {
          setLastSavedSnapshot(snapshot);
          if (goBackAfterSave) onBack();
        }
      } finally {
        saveInFlightRef.current = false;
      }
    }, [handleUpdate, onBack, snapshot, validateEdit]);

    const handleStepDotClick = React.useCallback((targetStep: 1 | 2) => {
      if (targetStep === editStep) return;
      setEditStep(targetStep);
    }, [editStep]);

    const handleDelete = React.useCallback(async () => {
      setIsDeleting(true);
      try {
        await deletarPersonagemJogador(personagem.idpersonagemJogador);
        await onSave?.();
        toast.success('Personagem excluído com sucesso.');
        setDeleteDialogOpen(false);
        onBack();
      } catch (requestError: unknown) {
        toast.error(getApiErrorMessage(requestError, 'Não foi possível excluir o personagem.'));
      } finally {
        setIsDeleting(false);
      }
    }, [onBack, onSave, personagem.idpersonagemJogador]);

    return (
        <FormController marginTop="0px" onSubmit={(e) => e.preventDefault()}>
            <CharacterEditActions aria-label="Opções do personagem">
              <CharacterOptionButton
                type="button"
                $variant="danger"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isSubmitting || isDeleting}
              >
                <DeleteOutlineIcon />
                <span>Excluir</span>
              </CharacterOptionButton>
              <CharacterOptionButton
                type="button"
                disabled
                title="Configuração de visibilidade disponível em breve"
              >
                <TuneIcon />
                <span>Dados visíveis</span>
              </CharacterOptionButton>
              <CharacterOptionButton
                type="button"
                disabled
                title="Configuração de visibilidade disponível em breve"
              >
                <VisibilityOutlinedIcon />
                <span>Personagem visível</span>
              </CharacterOptionButton>
            </CharacterEditActions>

            <CharacterStepDots
              theme={theme}
              neon={neon}
              activeStep={editStep}
              onStepClick={handleStepDotClick}
            />

            <FormEditController>
              {editStep === 2 && (
                <CharacterSystemForm
                  theme={theme}
                  neon={neon}
                  allowMaxStatusEditing
                  userName={userName}
                  selectedRace={selectedRace}
                  raceImageUrl={raceImageUrl}
                  avatarUrl={avatarUrl}
                  xp={xp}
                  setXp={setXp}
                  level={level}
                  setLevel={setLevel}
                  statusBasico={statusBasico}
                  setStatusBasico={setStatusBasico}
                  atributosPrincipais={atributosPrincipais}
                  setAtributosPrincipais={setAtributosPrincipais}
                  atributosSecundarios={atributosSecundarios}
                  setAtributosSecundarios={setAtributosSecundarios}
                  defesas={defesas}
                  setDefesas={setDefesas}
                  itens={itens}
                  setItens={setItens}
                  skills={skills}
                  setSkills={setSkills}
                  magias={magias}
                  setMagias={setMagias}
                  listItens={listItens}
                  handleSelectItem={handleSelectItem}
                  itemColumns={itemColumns}
                  skillsColumns={skillsColumns}
                  magiasColumns={magiasColumns}
                />
              )}

              {editStep === 1 && (
                <CharacterRoleplayForm
                  raceChangeMode='current-or-android'
                  theme={theme}
                  neon={neon}
                  userName={userName}
                  setUserName={setUserName}
                  race={race}
                  setRace={handleRaceChange}
                  city={city}
                  setCity={setCity}
                  selectedRace={selectedRace}
                  listRaces={listRaces}
                  listCities={listCities}
                  loadingRaces={loadingRaces}
                  loadingCities={loadingCities}
                  avatarUrl={avatarUrl}
                  setAvatarUrl={setAvatarUrl}
                  setAvatarFile={setAvatarFile}
                  galeriaUrls={galeriaUrls}
                  galeriaShapes={galeriaShapes}
                  onAddGaleria={handleGaleriaUpload}
                  onRemoveGaleria={handleRemoveGaleriaImage}
                  history={history}
                  setHistory={setHistory}
                  alignment={alignment}
                  setAlignment={setAlignment}
                  traits={traits}
                  setTraits={setTraits}
                  nanites={nanites}
                  setNanites={setNanites}
                  idpassiva={idpassiva}
                  setIdpassiva={setIdpassiva}
                  ultimate={ultimate}
                  setUltimate={setUltimate}
                  costumes={costumes}
                  setCostumes={setCostumes}
                  extraInformation={extraInformation}
                  setExtraInformation={setExtraInformation}
                  listPersonagemRelacionado={listPersonagemRelacionado}
                  setListPersonagemRelacionado={setListPersonagemRelacionado}
                  personagens={personagens}
                  allPersonagens={allPersonagens}
                  searchTerm={searchTerm}
                  loadingPersonagens={loadingPersonagens}
                  searchPersonagens={searchPersonagens}
                  nameError={nameError}
                  nameErrorMessage="Nome é obrigatório."
                  onNameFocus={() => setNameError(false)}
                  raceError={raceError}
                  raceErrorMessage="Selecione uma raça válida."
                  onRaceFocus={() => setRaceError(false)}
                />
              )}
            </FormEditController>
        
            <NavegationButtons>
              <CyberButton
                colorType="secondary"
                theme={theme}
                neon={neon}
                text="Anterior"
                width="200px"
                type="button"
                onClick={() => setEditStep(1)}
                disabled={isFirstStep || isSubmitting}
              />

              <CyberButton
                theme={theme}
                neon={neon}
                text={'Salvar'}
                width="200px"
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSubmitting}
                loading={isSubmitting}
              />

              <CyberButton
                theme={theme}
                neon={neon}
                text={isLastStep ? 'Atualizar' : 'Próximo'}
                width="200px"
                type="button"
                onClick={() => {
                  if (isLastStep) {
                    handleSave(false);
                    return;
                  }
                  setEditStep(2);
                }}
                disabled={isSubmitting}
                loading={isLastStep && isSubmitting}
              />
            </NavegationButtons>

            <FloatingActions>
              <SyncIconBadge
                theme={theme}
                neon={neon}
                synced={isSynced}
                title={isSynced ? 'Tudo salvo na ficha' : 'Existem alterações não salvas'}
              >
                {isSynced ? <CloudDoneIcon className="icon" /> : <CloudOffIcon className="icon" />}
              </SyncIconBadge>
              <FloatingSaveButton
                type="button"
                theme={theme}
                neon={neon}
                onClick={() => handleSave(false)}
                disabled={isSubmitting}
                title="Salvar alterações"
              >
                <SaveIcon className="icon" />
              </FloatingSaveButton>
            </FloatingActions>
            <ConfirmDialog
              open={deleteDialogOpen}
              title="Excluir personagem"
              message={`Tem certeza de que deseja excluir ${personagem.nome}? Esta ação também removerá as imagens vinculadas e não poderá ser desfeita.`}
              confirmText="Excluir"
              onConfirm={handleDelete}
              onCancel={() => setDeleteDialogOpen(false)}
              isLoading={isDeleting}
            />
        </FormController>
    )
}
