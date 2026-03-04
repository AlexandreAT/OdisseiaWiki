import React, { useEffect, useState } from 'react'
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SaveIcon from '@mui/icons-material/Save';
import toast from 'react-hot-toast';
import { PersonagemJogador } from '../../../../models/PersonagemJogador';
import { useFormUserCharacter } from '../CharacterCreate/useFormUserCharacter';
import { FormController, FormEditController, NavegationButtons } from '../CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { createItemColumns, createSkillsColumns, createMagiasColumns } from '../CharacterCreate/tableColumnsConfig';
import { CharacterSystemForm } from '../../../Shared/CharacterForms/CharacterSystemForm';
import { CharacterRoleplayForm } from '../../../Shared/CharacterForms/CharacterRoleplayForm';
import { CharacterStepDots } from '../../../Shared/CharacterForms/CharacterStepDots';
import { FloatingActions, FloatingSaveButton, SyncIconBadge } from './CharacterEdit.style';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  personagem: PersonagemJogador;
  userId: number;
  onSave?: () => void;
}

export const CharacterEdit = ({ theme, neon, personagem, userId, onSave }: UserCharactersProps) => {
  const [editStep, setEditStep] = React.useState<1 | 2>(1);
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState('');
  const hasSnapshotInitializedRef = React.useRef(false);

    const {
        handleUpdate,
        userName,
    setUserName,
    race,
    setRace,
    city,
    setCity,
    avatarUrl,
    setAvatarUrl,
    setAvatarFile,
    galeriaUrls,
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
    listPersonagemRelacionado,
    setListPersonagemRelacionado,
        itens, setItens,
        skills, setSkills,
        magias, setMagias,
        statusBasico, setStatusBasico,
        listRaces, setListRaces,
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

    useEffect(() => {
      console.log("========= TESTE ============")
      setListRaces(listRaces.filter((r) => r.idraca === personagem.idraca || r.nome == "Android"));
    }, [loadingPersonagens])
        console.log("🚀 ~ CharacterEdit ~ listRaces:", listRaces)
    console.log("🚀 ~ CharacterEdit ~ selectedRace:", selectedRace)

    const raceImageUrl = React.useMemo(() => 
        selectedRace?.imagem ?? '/assets_dynamic/default.png',
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
    }, [personagem.idpersonagemJogador]);

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
      if (!userName.trim()) {
        toast.error('Nome é obrigatório.');
        return false;
      }

      if (!race || race === 0) {
        toast.error('Selecione uma raça válida.');
        return false;
      }

      if (!city || city === 0) {
        toast.error('Selecione uma cidade válida.');
        return false;
      }

      return true;
    }, [userName, race, city]);

    const handleSave = React.useCallback(async () => {
      if (!validateEdit()) return;

      const success = await handleUpdate();
      if (success) {
        setLastSavedSnapshot(snapshot);
      }
    }, [handleUpdate, snapshot, validateEdit]);

    const handleStepDotClick = React.useCallback((targetStep: 1 | 2) => {
      if (targetStep === editStep) return;
      setEditStep(targetStep);
    }, [editStep]);

    return (
        <FormController onSubmit={(e) => e.preventDefault()}> 
            <CharacterStepDots
              theme={theme}
              neon={neon}
              activeStep={editStep}
              onStepClick={handleStepDotClick}
            />

            <FormEditController>
              {editStep === 1 && (
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

              {editStep === 2 && (
                <CharacterRoleplayForm
                  raceChangeMode='current-or-android'
                  theme={theme}
                  neon={neon}
                  userName={userName}
                  setUserName={setUserName}
                  race={race}
                  setRace={setRace}
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
                />
              )}
            </FormEditController>
        
            <NavegationButtons>
              <CyberButton
                colorType="secondary"
                theme={theme}
                neon={neon}
                text={'Anterior'}
                width="200px"
                type="button"
                onClick={() => setEditStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2)))}
                disabled={isFirstStep}
              />

              <CyberButton
                theme={theme}
                neon={neon}
                text={'Salvar'}
                width="200px"
                type="button"
                onClick={handleSave}
              />

              <CyberButton
                theme={theme}
                neon={neon}
                text={isLastStep ? 'Atualizar' : 'Próximo'}
                width="200px"
                type="button"
                onClick={() => {
                  if (isLastStep) {
                    handleSave();
                    return;
                  }
                  setEditStep(2);
                }}
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
                onClick={handleSave}
                title="Salvar alterações"
              >
                <SaveIcon className="icon" />
              </FloatingSaveButton>
            </FloatingActions>
        </FormController>
    )
}