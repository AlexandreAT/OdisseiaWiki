import React from 'react'
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { PersonagemJogador } from '../../../../models/PersonagemJogador';
import { useFormUserCharacter } from '../CharacterCreate/useFormUserCharacter';
import { FormController, FormEditController } from '../CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { MultiStepNavigation } from '../../../../components/Generic/MultiStepNavigation';
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
import { SystemRuntimeIndicator } from '../../../../components/Generic/SystemRuntimeIndicator';
import { CharacterVisibilityModal } from '../../../../components/CharacterVisibility';
import { atualizarVisibilidadeGeralPersonagem } from '../../../../services/personagemVisibilidadeService';
import {
  GameplayActionCenter,
  GameplaySheetActionDialog,
  type GameplayActionCenterInitialAction,
  type GameplaySheetActionSource,
} from '../../../../components/Gameplay';
import { useGameplayEngine } from '../../../../hooks/useGameplayEngine';
import { useGameplayFavorites } from '../../../../hooks/useGameplayFavorites';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  personagem: PersonagemJogador;
  userId: number;
  initialStep?: 1 | 2;
  onSave?: () => void | Promise<void>;
  onBack: () => void;
}

const persistedGameplayIds = (value: unknown) => {
  let entries: unknown = value;
  if (typeof value === 'string') {
    try {
      entries = JSON.parse(value);
    } catch {
      entries = [];
    }
  }

  return new Set(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => (
        entry && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string'
          ? (entry as { id: string }).id.trim()
          : ''
      ))
      .filter(Boolean),
  );
};

export const CharacterEdit = ({ theme, neon, personagem, userId, initialStep = 1, onSave, onBack }: UserCharactersProps) => {
  const [editStep, setEditStep] = React.useState<1 | 2>(initialStep);
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [raceError, setRaceError] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = React.useState(false);
  const [isUpdatingGlobalVisibility, setIsUpdatingGlobalVisibility] = React.useState(false);
  const [sheetActionSource, setSheetActionSource] = React.useState<GameplaySheetActionSource | null>(null);
  const [actionCenterOpen, setActionCenterOpen] = React.useState(false);
  const [actionCenterInitial, setActionCenterInitial] = React.useState<GameplayActionCenterInitialAction | null>(null);
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
        selectedMesa,
        runtimeContext, runtimeLoading, runtimeError,
        visivel,
        setVisivel,
    } = useFormUserCharacter(userId, onSave, personagem);

    const gameplay = useGameplayEngine({
      idMesa: Number(personagem.idmesa) || undefined,
      enabled: Boolean(personagem.idmesa),
      // A ficha pode ser aberta fora da Mesa: a engine decide entre evento
      // oficial e simula\u00e7\u00e3o ao consultar a sess\u00e3o ativa.
      mesaAoVivo: Boolean(personagem.idmesa),
    });
    const gameplayFavorites = useGameplayFavorites(personagem.idpersonagemJogador, Boolean(personagem.idmesa));
    const sheetFavoriteType = sheetActionSource?.item?.tipo === 'implante' ? 'PROTESE' : sheetActionSource?.type;
    const sheetFavorite = gameplayFavorites.favorites.find((item) => item.tipoOrigem === sheetFavoriteType
      && item.idOrigem === sheetActionSource?.id) ?? null;

    // Debug logs and temporary race-filter removed

    const raceImageUrl = React.useMemo(() => 
        selectedRace?.imagem ?? '',
        [selectedRace]
    );

    const itemColumns = React.useMemo(() => createItemColumns(theme, neon), [theme, neon]);
    const skillsColumns = React.useMemo(
      () => createSkillsColumns(theme, neon, runtimeContext),
      [theme, neon, runtimeContext],
    );
    const magiasColumns = React.useMemo(
      () => createMagiasColumns(theme, neon, runtimeContext),
      [theme, neon, runtimeContext],
    );

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
      const hasNameError = !userName.trim() || userName.trim().length > 100;
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
      if (!validateEdit()) return false;
      if (saveInFlightRef.current) return false;
      saveInFlightRef.current = true;

      try {
        const success = await handleUpdate();
        if (success) {
          setLastSavedSnapshot(snapshot);
          if (goBackAfterSave) onBack();
        }
        return success;
      } finally {
        saveInFlightRef.current = false;
      }
    }, [handleUpdate, onBack, snapshot, validateEdit]);

    const persistedSourceIds = React.useMemo(() => {
      const inventoryIds = persistedGameplayIds(personagem.inventarioJson);
      return {
        ITEM: inventoryIds,
        PROTESE: inventoryIds,
        SKILL: persistedGameplayIds(personagem.skills),
        MAGIA: persistedGameplayIds(personagem.magia),
      };
    }, [personagem.inventarioJson, personagem.magia, personagem.skills]);

    const openGameplayAction = React.useCallback(async (source: GameplaySheetActionSource) => {
      if (!isSynced) {
        toast.error('Salve as alterações da ficha antes de rolar uma ação.');
        return;
      }

      // Fichas antigas não possuíam IDs estáveis. O formulário os prepara
      // ao carregar; salve-os antes da primeira ação para o backend resolver
      // exatamente o item, skill ou magia selecionado.
      if (!persistedSourceIds[source.type].has(source.id)) {
        const saved = await handleSave(false);
        if (!saved) return;
      }

      setSheetActionSource(source);
    }, [handleSave, isSynced, persistedSourceIds]);

    const openGameplayCenter = React.useCallback((action: GameplayActionCenterInitialAction | null = null) => {
      if (!isSynced) {
        toast.error('Salve as alterações da ficha antes de fazer uma rolagem.');
        return;
      }
      setActionCenterInitial(action);
      setActionCenterOpen(true);
    }, [isSynced]);

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

    const handleGlobalVisibilityToggle = React.useCallback(async () => {
      if (isUpdatingGlobalVisibility) return;

      const nextVisibility = !visivel;
      setIsUpdatingGlobalVisibility(true);

      try {
        const savedVisibility = await atualizarVisibilidadeGeralPersonagem(
          'jogador',
          personagem.idpersonagemJogador,
          nextVisibility,
        );
        setVisivel(savedVisibility);
        toast.success(
          savedVisibility
            ? 'Personagem visível para outros usuários.'
            : 'Personagem oculto para outros usuários.',
        );
      } catch (requestError: unknown) {
        toast.error(getApiErrorMessage(
          requestError,
          'Não foi possível atualizar a visibilidade do personagem.',
        ));
      } finally {
        setIsUpdatingGlobalVisibility(false);
      }
    }, [isUpdatingGlobalVisibility, personagem.idpersonagemJogador, setVisivel, visivel]);

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
                onClick={() => setVisibilityModalOpen(true)}
                disabled={isSubmitting || isUpdatingGlobalVisibility}
                title="Configurar os dados visíveis da ficha"
              >
                <TuneIcon />
                <span>Dados visíveis</span>
              </CharacterOptionButton>
              <CharacterOptionButton
                type="button"
                onClick={() => void handleGlobalVisibilityToggle()}
                disabled={isSubmitting || isUpdatingGlobalVisibility}
                aria-pressed={visivel}
                title={visivel ? 'Ocultar personagem para outros usuários' : 'Exibir personagem para outros usuários'}
              >
                {visivel ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                <span>{visivel ? 'Personagem visível' : 'Personagem oculto'}</span>
              </CharacterOptionButton>
            </CharacterEditActions>

            <CharacterStepDots
              theme={theme}
              neon={neon}
              activeStep={editStep}
              onStepClick={handleStepDotClick}
            />

            <MultiStepNavigation
              position="top"
              theme={theme}
              neon={neon}
              previous={{
                label: 'Anterior',
                onClick: () => setEditStep(1),
                disabled: isFirstStep || isSubmitting,
                colorType: 'secondary',
              }}
              save={{
                label: 'Salvar',
                onClick: () => handleSave(true),
                disabled: isSubmitting,
                loading: isSubmitting,
              }}
              next={{
                label: 'Próximo',
                onClick: () => setEditStep(2),
                disabled: isSubmitting || isLastStep,
              }}
            />

            {selectedMesa && (
              <SystemRuntimeIndicator
                contexto={runtimeContext}
                loading={runtimeLoading}
                error={runtimeError}
                mesaNome={personagem.mesaNome}
                mesaAoVivo={Boolean(gameplay.session)}
              />
            )}

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
                  runtimeContext={runtimeContext}
                  comparisonSource="Jogador"
                  comparisonId={personagem.idpersonagemJogador}
                  comparisonTableId={selectedMesa}
                  comparisonTableName={personagem.mesaNome}
                  onGameplayAction={(source) => void openGameplayAction(source)}
                  onGameplayAttributeAction={(attributeCode, group) => openGameplayCenter({
                    type: 'attribute',
                    attributeCode,
                    group,
                  })}
                  onGameplayXpAction={() => openGameplayCenter({ type: 'xp' })}
                  onGameplayGeneralAction={() => openGameplayCenter()}
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
                  nameErrorMessage={!userName.trim() ? 'Nome é obrigatório.' : 'O nome deve ter no máximo 100 caracteres.'}
                  onNameFocus={() => setNameError(false)}
                  raceError={raceError}
                  raceErrorMessage="Selecione uma raça válida."
                  onRaceFocus={() => setRaceError(false)}
                />
              )}
            </FormEditController>
        
            <MultiStepNavigation
              position="bottom"
              theme={theme}
              neon={neon}
              previous={{
                label: 'Anterior',
                onClick: () => setEditStep(1),
                disabled: isFirstStep || isSubmitting,
                colorType: 'secondary',
              }}
              save={{
                label: 'Salvar',
                onClick: () => handleSave(true),
                disabled: isSubmitting,
                loading: isSubmitting,
              }}
              next={{
                label: 'Próximo',
                onClick: () => setEditStep(2),
                disabled: isSubmitting || isLastStep,
              }}
            />

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
            <CharacterVisibilityModal
              open={visibilityModalOpen}
              characterId={personagem.idpersonagemJogador}
              characterType="jogador"
              characterName={userName || personagem.nome}
              theme={theme}
              neon={neon}
              onClose={() => setVisibilityModalOpen(false)}
            />
            <GameplaySheetActionDialog
              open={Boolean(sheetActionSource)}
              source={sheetActionSource}
              character={{ personagem }}
              theme={theme}
              neon={neon}
              submitting={gameplay.submitting}
              onClose={() => setSheetActionSource(null)}
              onRoll={gameplay.roll}
              onApplyEffect={gameplay.applyEffect}
              onEffectApplied={gameplay.refresh}
              favorite={sheetFavorite}
              favoriteSaving={gameplayFavorites.saving}
              onSaveFavorite={gameplayFavorites.save}
              onRemoveFavorite={gameplayFavorites.remove}
            />
            <GameplayActionCenter
              open={actionCenterOpen}
              onClose={() => {
                setActionCenterOpen(false);
                setActionCenterInitial(null);
              }}
              initialCharacterId={personagem.idpersonagemJogador}
              initialAction={actionCenterInitial}
              directInitialAction={actionCenterInitial?.type === 'attribute'}
              characters={[{ personagem }]}
              session={gameplay.session}
              mesaAoVivo={Boolean(personagem.idmesa)}
              events={gameplay.events}
              loading={gameplay.loading}
              loadingMore={gameplay.loadingMore}
              submitting={gameplay.submitting}
              error={gameplay.error}
              hasMore={gameplay.hasMore}
              theme={theme}
              neon={neon}
              onRoll={gameplay.roll}
              onApplyEffect={gameplay.applyEffect}
              onGetActionCatalog={gameplay.getActionCatalog}
              onRecordManual={gameplay.recordManual}
              onLoadMore={gameplay.loadMore}
              onRefresh={gameplay.refresh}
              favorites={gameplayFavorites.favorites}
              favoriteSaving={gameplayFavorites.saving}
              onSaveFavorite={gameplayFavorites.save}
              onRemoveFavorite={gameplayFavorites.remove}
            />
        </FormController>
    )
}
