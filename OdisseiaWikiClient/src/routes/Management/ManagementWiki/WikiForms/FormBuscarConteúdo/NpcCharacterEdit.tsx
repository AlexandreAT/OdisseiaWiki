import React from 'react';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SaveIcon from '@mui/icons-material/Save';
import toast from 'react-hot-toast';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { CharacterRoleplayForm } from '../../../../Shared/CharacterForms/CharacterRoleplayForm';
import { CharacterStepDots } from '../../../../Shared/CharacterForms/CharacterStepDots';
import { CharacterSystemForm } from '../../../../Shared/CharacterForms/CharacterSystemForm';
import { createItemColumns, createMagiasColumns, createSkillsColumns } from '../../../../Hub/UserCharacters/CharacterCreate/tableColumnsConfig';
import { generateId } from '../../../../Hub/UserCharacters/CharacterCreate/helpers';
import { FloatingActions, FloatingSaveButton, SyncIconBadge } from '../../../../Hub/UserCharacters/CharacterEdit/CharacterEdit.style';
import { FormController, FormEditController, NavegationButtons } from '../../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { saveAsset } from '../../../../../services/assetsService';
import { atualizarPersonagem, getPersonagemById, getPersonagens, PersonagemPayload, PersonagemUpdatePayload } from '../../../../../services/personagensService';
import { normalizeToJSONContent, prepareForAPI } from '../../../../../utils/richTextHelpers';
import { useFormCharacter } from '../FormCriarConteúdo/FormCharacter/useFormCharacter';

interface NpcCharacterEditProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  characterId: string;
  onBack: () => void;
  onSave?: () => void;
}

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value === undefined || value === null) return fallback;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
};

const resolvePersonagemPayload = (
  response: PersonagemPayload | { sucesso?: boolean; personagem?: PersonagemPayload } | null | undefined
): PersonagemPayload | null => {
  if (!response) return null;

  if ('personagem' in response) {
    return response.personagem ?? null;
  }

  if ('idpersonagem' in response) {
    return response;
  }

  return null;
};

const tryParseRichText = (value: any) => {
  let current = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (typeof current !== 'string') return current;

    const trimmed = current.trim();
    if (!trimmed) return current;

    const looksLikeJsonObjectOrArray =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));

    const looksLikeQuotedJsonString = trimmed.startsWith('"') && trimmed.endsWith('"');

    if (!looksLikeJsonObjectOrArray && !looksLikeQuotedJsonString) {
      return current;
    }

    try {
      current = JSON.parse(trimmed);
    } catch {
      return current;
    }
  }

  return current;
};

const serializeRichText = (value: any): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const extractErrorMessage = (error: any): string => {
  const responseData = error?.response?.data;

  if (!responseData) return 'Erro ao atualizar personagem.';
  if (typeof responseData === 'string') return responseData;

  if (typeof responseData === 'object') {
    if (typeof responseData.title === 'string' && responseData.title.trim()) {
      return responseData.title;
    }

    if (typeof responseData.mensagemErro === 'string' && responseData.mensagemErro.trim()) {
      return responseData.mensagemErro;
    }

    if (responseData.errors && typeof responseData.errors === 'object') {
      const firstErrorArray = Object.values(responseData.errors).find(
        (value) => Array.isArray(value) && value.length > 0
      ) as string[] | undefined;

      if (firstErrorArray?.[0]) {
        return firstErrorArray[0];
      }
    }
  }

  return 'Erro ao atualizar personagem.';
};

export const NpcCharacterEdit: React.FC<NpcCharacterEditProps> = ({
  theme,
  neon,
  characterId,
  onBack,
  onSave,
}) => {
  const [editStep, setEditStep] = React.useState<1 | 2>(1);
  const [isLoadingCharacter, setIsLoadingCharacter] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadingError, setLoadingError] = React.useState<string | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState('');
  const hasSnapshotInitializedRef = React.useRef(false);

  const {
    userName,
    setUserName,
    race,
    setRace,
    city,
    setCity,
    avatarUrl,
    setAvatarUrl,
    setAvatarFile,
    history,
    setHistory,
    costumes,
    setCostumes,
    nanites,
    setNanites,
    alignment,
    setAlignment,
    traits,
    setTraits,
    tags,
    setTags,
    visivel,
    setVisivel,
    itens,
    setItens,
    skills,
    setSkills,
    magias,
    setMagias,
    listPersonagemRelacionado,
    setListPersonagemRelacionado,
    statusBasico,
    setStatusBasico,
    listCities,
    loadingCities,
    listRaces,
    loadingRaces,
    selectedRace,
    personagens,
    allPersonagens,
    searchTerm,
    loadingPersonagens,
    searchPersonagens,
    xp,
    setXp,
    level,
    setLevel,
    atributosPrincipais,
    setAtributosPrincipais,
    atributosSecundarios,
    setAtributosSecundarios,
    defesas,
    setDefesas,
    listItens,
    handleSelectItem,
    avatarFile,
  } = useFormCharacter({ applyRaceDefaults: false });

  const [extraInformation, setExtraInformation] = React.useState('');
  const [galeriaUrls, setGaleriaUrls] = React.useState<string[]>([]);

  const raceImageUrl = React.useMemo(
    () => selectedRace?.imagem ?? '/assets_dynamic/default.png',
    [selectedRace]
  );

  const itemColumns = React.useMemo(() => createItemColumns(theme, neon), [theme, neon]);
  const skillsColumns = React.useMemo(() => createSkillsColumns(theme, neon), [theme, neon]);
  const magiasColumns = React.useMemo(() => createMagiasColumns(theme, neon), [theme, neon]);

  React.useEffect(() => {
    return () => {
      galeriaUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [galeriaUrls]);

  React.useEffect(() => {
    let active = true;

    const loadCharacter = async () => {
      setIsLoadingCharacter(true);
      setLoadingError(null);

      try {
        let payload: PersonagemPayload | null = null;

        try {
          const byIdResponse = await getPersonagemById(characterId);
          payload = resolvePersonagemPayload(byIdResponse);
        } catch {
          const allCharacters = await getPersonagens();
          payload = allCharacters.find((item) => String(item.idpersonagem) === String(characterId)) ?? null;
        }

        if (!payload) {
          throw new Error('Personagem não encontrado.');
        }

        if (!active) return;

        const status = parseJson(payload.statusJson, {
          status: { vida: 0, vidaMaxima: 0, estamina: 0, estaminaMaxima: 0, mana: 0, manaMaxima: 0, capacidadeCarga: 0 },
          atributos: {
            principais: { resistencia: 0, agilidade: 0, sabedoria: 0, precisao: 0, forca: 0 },
            secundarios: { sanidade: 0, coragem: 0, inteligencia: 0, percepcao: 0, labia: 0, intimidacao: 0 },
          },
          nivel: 1,
          xp: 0,
          defesas: { armadura: 0, protecao: 0, escudo: 0, outras: 0 },
        });

        const loadedTraits = parseJson<string[] | string>(payload.tracos, []);
        const loadedCostumes = parseJson<string[] | string>(payload.costumes, []);
        const loadedItens = parseJson<any[]>(payload.inventarioJson, []).map((item) => ({
          ...item,
          descricao: tryParseRichText(item?.descricao),
        }));
        const loadedSkills = parseJson<any[]>(payload.skills, []).map((skill) => {
          const effectSource =
            skill?.efeito ??
            skill?.atributos?.__efeitoRichText ??
            skill?.atributos?.efeitoRichText;

          return {
            ...skill,
            efeito: tryParseRichText(effectSource),
          };
        });
        const loadedMagias = parseJson<any[]>(payload.magia, []).map((magia) => {
          const effectSource =
            magia?.efeito ??
            magia?.atributos?.__efeitoRichText ??
            magia?.atributos?.efeitoRichText;

          return {
            ...magia,
            efeito: tryParseRichText(effectSource),
          };
        });
        const loadedTags = parseJson<string[] | string>(payload.tags, []);
        const relacionados = parseJson<string[] | number[] | string | number>(payload.personagemsVinculados, []);

        const relatedList = (Array.isArray(relacionados) ? relacionados : [relacionados])
          .map((item) => {
            const id = Number(item);
            if (Number.isNaN(id)) return null;

            const found = allPersonagens.find((personagem) => personagem.Idpersonagem === id);
            return {
              id,
              nome: found?.Nome ?? `Personagem ${id}`,
            };
          })
          .filter((item): item is { id: number; nome: string } => !!item);

        setUserName(payload.nome || '');
        setRace(Number(payload.idraca));
        setCity(Number(payload.idcidade));
        setAvatarUrl(payload.imagem || '');
        setHistory(normalizeToJSONContent(tryParseRichText(payload.historia) || ''));
        setCostumes(Array.isArray(loadedCostumes) ? loadedCostumes[0] || '' : String(loadedCostumes || ''));
        setNanites(payload.nanites ? String(payload.nanites) : '');
        setAlignment(payload.alinhamento || '');
        setTraits(Array.isArray(loadedTraits) ? loadedTraits : []);
        setTags(Array.isArray(loadedTags) ? loadedTags : []);
        setVisivel(Boolean(payload.visivel));
        setItens(Array.isArray(loadedItens) && loadedItens.length > 0
          ? loadedItens
          : [{ nome: '', descricao: '', quantidade: 0, peso: 0, tipo: 'outro' } as any]);
        setSkills(Array.isArray(loadedSkills) && loadedSkills.length > 0
          ? loadedSkills
          : [{ nome: '', tipo: 'suporte', elemento: ['normal'], nivel: 1 } as any]);
        setMagias(Array.isArray(loadedMagias) && loadedMagias.length > 0
          ? loadedMagias
          : [{ nome: '', tipo: 'suporte', elemento: ['fogo'] } as any]);
        setListPersonagemRelacionado(relatedList);
        setStatusBasico({
          vida: status.status?.vida ?? 0,
          vidaMaxima: status.status?.vidaMaxima ?? status.status?.vida ?? 0,
          estamina: status.status?.estamina ?? 0,
          estaminaMaxima: status.status?.estaminaMaxima ?? status.status?.estamina ?? 0,
          mana: status.status?.mana ?? 0,
          manaMaxima: status.status?.manaMaxima ?? status.status?.mana ?? 0,
          capacidadeCarga: status.status?.capacidadeCarga ?? 0,
        });
        setAtributosPrincipais(status.atributos?.principais ?? {
          resistencia: 0,
          agilidade: 0,
          sabedoria: 0,
          precisao: 0,
          forca: 0,
        });
        setAtributosSecundarios(status.atributos?.secundarios ?? {
          sanidade: 0,
          coragem: 0,
          inteligencia: 0,
          percepcao: 0,
          labia: 0,
          intimidacao: 0,
        });
        setDefesas(status.defesas ?? {
          armadura: 0,
          protecao: 0,
          escudo: 0,
          outras: 0,
        });
        setLevel(status.nivel ?? 1);
        setXp(status.xp ?? 0);
      } catch (error: any) {
        if (!active) return;
        setLoadingError(error?.message || 'Erro ao carregar personagem.');
      } finally {
        if (active) {
          setIsLoadingCharacter(false);
        }
      }
    };

    loadCharacter();

    return () => {
      active = false;
    };
  }, [
    allPersonagens,
    characterId,
    setAlignment,
    setAtributosPrincipais,
    setAtributosSecundarios,
    setCity,
    setCostumes,
    setDefesas,
    setHistory,
    setItens,
    setLevel,
    setListPersonagemRelacionado,
    setMagias,
    setNanites,
    setRace,
    setSkills,
    setStatusBasico,
    setTags,
    setTraits,
    setUserName,
    setVisivel,
    setXp,
    setAvatarUrl,
  ]);

  const snapshot = React.useMemo(() => JSON.stringify({
    userName,
    race,
    city,
    avatarUrl,
    history,
    costumes,
    extraInformation,
    nanites,
    alignment,
    traits,
    tags,
    visivel,
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
    galeriaUrls,
  }), [
    userName,
    race,
    city,
    avatarUrl,
    history,
    costumes,
    extraInformation,
    nanites,
    alignment,
    traits,
    tags,
    visivel,
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
    galeriaUrls,
  ]);

  React.useEffect(() => {
    hasSnapshotInitializedRef.current = false;
    setLastSavedSnapshot('');
  }, [characterId]);

  React.useEffect(() => {
    if (hasSnapshotInitializedRef.current) return;
    if (isLoadingCharacter) return;
    if (!userName || race === undefined) return;

    hasSnapshotInitializedRef.current = true;
    setLastSavedSnapshot(snapshot);
  }, [snapshot, userName, race, isLoadingCharacter]);

  const isSynced = lastSavedSnapshot !== '' && snapshot === lastSavedSnapshot;
  const isFirstStep = editStep === 1;
  const isLastStep = editStep === 2;

  const handleAddGaleria = React.useCallback((files: File[]) => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setGaleriaUrls((prev) => [...prev, ...urls]);
    toast('Imagens de galeria para NPC ficam apenas em pré-visualização por enquanto.');
  }, []);

  const handleRemoveGaleria = React.useCallback((index: number) => {
    setGaleriaUrls((prev) => {
      const imageUrl = prev[index];
      if (imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  }, []);

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
  }, [city, race, userName]);

  const handleSave = React.useCallback(async (options?: { goBackAfterSave?: boolean }) => {
    if (!validateEdit()) return;

    try {
      setIsSaving(true);

      let avatarPath = avatarUrl;
      if (avatarFile) {
        const uploadResult = await saveAsset({
          imageFile: avatarFile,
          type: 'personagens',
          entityName: userName,
        });
        avatarPath = uploadResult.path;
      }

      const statusPayload = {
        status: {
          vida: Number(statusBasico.vida) || 0,
          vidaMaxima: Number(statusBasico.vidaMaxima) || 0,
          estamina: Number(statusBasico.estamina) || 0,
          estaminaMaxima: Number(statusBasico.estaminaMaxima) || 0,
          mana: Number(statusBasico.mana) || 0,
          manaMaxima: Number(statusBasico.manaMaxima) || 0,
          capacidadeCarga: Number(statusBasico.capacidadeCarga) || 0,
        },
        atributos: {
          principais: {
            resistencia: Number(atributosPrincipais.resistencia) || 0,
            agilidade: Number(atributosPrincipais.agilidade) || 0,
            sabedoria: Number(atributosPrincipais.sabedoria) || 0,
            precisao: Number(atributosPrincipais.precisao) || 0,
            forca: Number(atributosPrincipais.forca) || 0,
          },
          secundarios: {
            sanidade: Number(atributosSecundarios.sanidade) || 0,
            coragem: Number(atributosSecundarios.coragem) || 0,
            inteligencia: Number(atributosSecundarios.inteligencia) || 0,
            percepcao: Number(atributosSecundarios.percepcao) || 0,
            labia: Number(atributosSecundarios.labia) || 0,
            intimidacao: Number(atributosSecundarios.intimidacao) || 0,
          },
        },
        nivel: Number(level) || 1,
        xp: Number(xp) || 0,
        defesas: {
          armadura: Number(defesas.armadura) || 0,
          protecao: Number(defesas.protecao) || 0,
          escudo: Number(defesas.escudo) || 0,
          outras: Number(defesas.outras) || 0,
        },
      };

      const inventarioMapped = itens.map((item) => ({
        id: item.id ?? generateId(),
        idItemBase: item.idItemBase ?? undefined,
        nome: item.nome ?? 'Item',
        tipo: item.tipo ?? 'outro',
        quantidade: Number(item.quantidade) || 1,
        peso: item.peso !== undefined && item.peso !== null && Number(item.peso) !== 0
          ? Number(item.peso)
          : undefined,
        descricao: serializeRichText(item.descricao),
        atributos: item.atributos ?? {},
      }));

      const skillsMapped = skills.map((skill) => {
        const serializedEffect = serializeRichText((skill as any).efeito);

        return {
          id: skill.id ?? generateId(),
          nome: skill.nome ?? 'Skill',
          efeito: serializedEffect,
          tipo: skill.tipo ?? 'suporte',
          elemento: Array.isArray(skill.elemento) ? skill.elemento : ['normal'],
          custo: skill.custo ?? '',
          nivel: Number(skill.nivel) || 1,
          atributos: {
            ...(skill.atributos ?? {}),
            __efeitoRichText: serializedEffect,
          },
        };
      });

      const magiasMapped = magias.map((magia) => {
        const serializedEffect = serializeRichText((magia as any).efeito);

        return {
          id: magia.id ?? generateId(),
          nome: magia.nome ?? 'Magia',
          efeito: serializedEffect,
          tipo: magia.tipo ?? 'suporte',
          elemento: Array.isArray(magia.elemento) ? magia.elemento : ['normal'],
          custo: magia.custo ?? '',
          atributos: {
            ...(magia.atributos ?? {}),
            __efeitoRichText: serializedEffect,
          },
        };
      });

      const payload: PersonagemUpdatePayload = {
        nome: userName,
        idraca: race!,
        idcidade: city,
        historia: prepareForAPI(history),
        imagem: avatarPath,
        galeriaImagem: galeriaUrls.filter((url) => !url.startsWith('blob:')),
        costumes: costumes ? [costumes] : [],
        nanites: nanites ? Number(nanites) : undefined,
        alinhamento: alignment,
        tracos: traits,
        inventarioJson: inventarioMapped,
        skills: skillsMapped,
        magia: magiasMapped,
        personagemsVinculados: listPersonagemRelacionado
          .map((personagem) => Number(personagem.id))
          .filter((id) => Number.isFinite(id)),
        tags: tags.length ? tags : undefined,
        visivel,
        statusJson: statusPayload,
      };

      const result = await atualizarPersonagem(characterId, payload);
      if (result?.sucesso === false) {
        toast.error(result.mensagemErro || 'Erro ao atualizar personagem.');
        return;
      }

      setLastSavedSnapshot(snapshot);
      toast.success('NPC atualizado com sucesso!');
      onSave?.();

      if (options?.goBackAfterSave) {
        onBack();
      }
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }, [
    alignment,
    atributosPrincipais,
    atributosSecundarios,
    avatarFile,
    avatarUrl,
    characterId,
    city,
    costumes,
    defesas,
    galeriaUrls,
    history,
    itens,
    level,
    listPersonagemRelacionado,
    magias,
    nanites,
    onSave,
    race,
    skills,
    snapshot,
    statusBasico,
    tags,
    traits,
    userName,
    validateEdit,
    visivel,
    xp,
    onBack,
  ]);

  const handleSaveAndBack = React.useCallback(async () => {
    await handleSave({ goBackAfterSave: true });
  }, [handleSave]);

  if (isLoadingCharacter) {
    return <div>Carregando personagem...</div>;
  }

  if (loadingError) {
    return (
      <div>
        <p>{loadingError}</p>
        <CyberButton
          type="button"
          theme={theme}
          neon={neon}
          text="Voltar"
          width="180px"
          onClick={onBack}
        />
      </div>
    );
  }

  return (
    <FormController onSubmit={(event) => event.preventDefault()}>
      <CharacterStepDots
        theme={theme}
        neon={neon}
        activeStep={editStep}
        onStepClick={(targetStep) => setEditStep(targetStep)}
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
            onAddGaleria={handleAddGaleria}
            onRemoveGaleria={handleRemoveGaleria}
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
                  visivel={visivel}
                  setVisivel={setVisivel}
            listPersonagemRelacionado={listPersonagemRelacionado}
            setListPersonagemRelacionado={setListPersonagemRelacionado}
            personagens={personagens}
            allPersonagens={allPersonagens}
            searchTerm={searchTerm}
            loadingPersonagens={loadingPersonagens}
            searchPersonagens={searchPersonagens}
            raceChangeMode="current-or-android"
          />
        )}
      </FormEditController>

      <NavegationButtons>
        <CyberButton
          type="button"
          colorType="secondary"
          theme={theme}
          neon={neon}
          text="Voltar"
          width="200px"
          onClick={isFirstStep ? onBack : () => setEditStep(1)}
        />

        <CyberButton
          type="button"
          theme={theme}
          neon={neon}
          text={isSaving ? 'Salvando...' : 'Salvar'}
          width="200px"
          onClick={handleSaveAndBack}
          disabled={isSaving}
        />

        <CyberButton
          type="button"
          theme={theme}
          neon={neon}
          text={isLastStep ? 'Atualizar' : 'Próximo'}
          width="200px"
          onClick={() => {
            if (isLastStep) {
              handleSave();
              return;
            }
            setEditStep(2);
          }}
          disabled={isSaving}
        />
      </NavegationButtons>

      <FloatingActions>
        <SyncIconBadge
          theme={theme}
          neon={neon}
          synced={isSynced}
          title={isSynced ? 'Tudo salvo no NPC' : 'Existem alterações não salvas'}
        >
          {isSynced ? <CloudDoneIcon className="icon" /> : <CloudOffIcon className="icon" />}
        </SyncIconBadge>
        <FloatingSaveButton
          type="button"
          theme={theme}
          neon={neon}
          onClick={() => {
            handleSave();
          }}
          title="Salvar alterações"
          disabled={isSaving}
        >
          <SaveIcon className="icon" />
        </FloatingSaveButton>
      </FloatingActions>
    </FormController>
  );
};
