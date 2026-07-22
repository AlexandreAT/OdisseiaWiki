import { mapToItem } from './../../../../../../utils/mapItem';
import { getRacas, normalizeRacaStatus, resolveRacaCharacterStatus, RacaStatus } from './../../../../../../services/racasService';
import { RacaPayload } from './../../../../../../services/racasService';
import { CidadePayload, getCidades } from './../../../../../../services/cidadesService';
import { PersonagemCreatePayload, getPersonagens } from './../../../../../../services/personagensService';
import { saveAsset } from './../../../../../../services/assetsService';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CharacterFormData, CharacterFormErrors } from './FormCharacter.type';
import toast from 'react-hot-toast';
import { Principais, Secundarios, JSONContent } from '../../../../../../models/Characters';
import { SkillElemento, Skills, SkillTipoString } from '../../../../../../models/Skills';
import { Item, ItemTipo } from '../../../../../../models/Itens';
import { Magia, MagiaElemento, MagiaTipoString } from '../../../../../../models/Magias';
import { salvarPersonagem } from '../../../../../../services/personagensService';
import { getItens } from '../../../../../../services/itensService';
import { prepareForAPI } from '../../../../../../utils/richTextHelpers';
import { TOTAL_STEPS } from '../../../../../../constants';
import { ensureContentCategoryTag, isContentCategoryTag } from '../../../../../../utils/contentCategoryTag';
import { CharacterStatusExtras, DEFAULT_CHARACTER_STATUS_EXTRAS } from '../../../../../../utils/characterStatus';
import { getApiErrorMessage } from '../../../../../../utils/apiError';

const serializeRichText = (value: any): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

export const useFormCharacter = ({ applyRaceDefaults = true, contentType }: { applyRaceDefaults?: boolean; contentType?: string } = {}) => {
  // --- step ---
  const [step, setStep] = useState(1);
  // --- dados do formulário ---
  const [userName, setUserName] = useState('');
  // race
  const [race, setRace] = useState<number | undefined>(undefined);

  // city
  const [city, setCity] = useState<number | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>([]);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaShapes, setGaleriaShapes] = useState<string[]>([]);
  const [galeriaCaptions, setGaleriaCaptions] = useState<string[]>([]);
  const [history, setHistory] = useState<JSONContent | string>('');
  const [costumes, setCostumes] = useState('');
  const [nanites, setNanites] = useState('');
  const [alignment, setAlignment] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [idpassiva, setIdpassiva] = useState<number | undefined>(undefined);
  const [ultimate, setUltimate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visivel, setVisivel] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [statusExtras, setStatusExtras] = useState<CharacterStatusExtras>(DEFAULT_CHARACTER_STATUS_EXTRAS);
  // const [capacidadeCarga, setCapacidadeCarga] = useState(0); // TODO: Implementar se necessário
  const [skills, setSkills] = useState<Skills[]>([]);
  const [magias, setMagias] = useState<Magia[]>([]);
  const [itens, setItens] = useState<Item[]>([
    { nome: "", descricao: "", quantidade: 0, peso: 0, tipo: "outro" },
  ]);
  const [listPersonagemRelacionado, setListPersonagemRelacionado] = useState<
    { id: number; nome: string }[]
  >([]);

  // --- erros ---
  const [errors, setErrors] = useState<CharacterFormErrors>({});
  const [userError, setUserError] = useState(false);
  const [raceError, setRaceError] = useState(false);
  const [statusError, setStatusError] = useState(false);

  // --- status básico ---
  const [statusBasico, setStatusBasico] = useState({
    vida: 0,
    vidaMaxima: 0,
    estamina: 0,
    estaminaMaxima: 0,
    mana: 0,
    manaMaxima: 0,
    capacidadeCarga: 0,
  });
  // --- defesas ---
  const [defesas, setDefesas] = useState({
    armadura: 0,
    protecao: 0,
    escudo: 0,
    outras: 0,
  });
  // --- atributos principais ---
  const [atributosPrincipais, setAtributosPrincipais] = useState<Principais>({
    resistencia: 0,
    agilidade: 0,
    sabedoria: 0,
    precisao: 0,
    forca: 0,
  });
  // --- atributos secundários ---
  const [atributosSecundarios, setAtributosSecundarios] = useState<Secundarios>({
    sanidade: 0,
    coragem: 0,
    inteligencia: 0,
    percepcao: 0,
    labia: 0,
    intimidacao: 0,
  });

  // --- cidades ---
  const [listCities, setListCities] = useState<CidadePayload[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // --- raças ---
  const [listRaces, setListRaces] = useState<RacaPayload[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);

  // --- itens ---
  const [allItens, setAllItens] = useState<Item[]>([]);
  const [listItens, setListItens] = useState<Item[]>([]);
  const [loadingItens, setLoadingItens] = useState(true);
  const [searchItensTerm, setSearchItensTerm] = useState("");

  // --- personagens ---
  const [allPersonagens, setAllPersonagens] = useState<any[]>([]);
  const [personagens, setPersonagens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPersonagens, setLoadingPersonagens] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFirstStep = step === 1;
  const isLastStep = step === TOTAL_STEPS;

  const selectedRace = useMemo(() => 
    listRaces.find(r => r.idraca === race),
    [listRaces, race]
  );
  const selectedRaceStatus = useMemo(
    () => normalizeRacaStatus(
      selectedRace?.statusJson
      ?? (selectedRace as (RacaPayload & { StatusJson?: unknown }) | undefined)?.StatusJson
    ),
    [selectedRace]
  );
  const hasInitializedRaceRef = useRef(false);
  const lastRaceIdRef = useRef<number | undefined>(undefined);

  const applySelectedRaceDefaults = useCallback((raceStatus: RacaStatus) => {
    const basePrincipais: Principais = {
      resistencia: 0,
      agilidade: 0,
      sabedoria: 0,
      precisao: 0,
      forca: 0,
    };
    const key = raceStatus.atributoInicial
      ?.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') as keyof Principais;

    if (key && key in basePrincipais) basePrincipais[key] = 1;
    setAtributosPrincipais(basePrincipais);
    setAtributosSecundarios({
      sanidade: 0,
      coragem: 0,
      inteligencia: 0,
      percepcao: 0,
      labia: 0,
      intimidacao: 0,
    });

    const initialStatus = resolveRacaCharacterStatus(raceStatus);
    if (initialStatus) setStatusBasico(initialStatus);
  }, []);

  const handleRaceChange = useCallback((raceId: number) => {
    setRace(raceId);
    const nextRace = listRaces.find(item => item.idraca === raceId);
    const nextRaceStatus = normalizeRacaStatus(
      nextRace?.statusJson
      ?? (nextRace as (RacaPayload & { StatusJson?: unknown }) | undefined)?.StatusJson
    );

    if (nextRaceStatus) applySelectedRaceDefaults(nextRaceStatus);
  }, [applySelectedRaceDefaults, listRaces]);

  // Auto-adiciona tag do tipo de conteúdo quando muda
  useEffect(() => {
    if (contentType) {
      setTags(previousTags => ensureContentCategoryTag(previousTags, contentType));
      setTagInput('');
    }
  }, [contentType]);

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const result = await getCidades();
        if (result.sucesso && result.cidades) {
          setListCities(result.cidades);
        } else {
          console.error("Erro ao carregar cidades:", result.mensagemErro);
        }
      } catch (err) {
        console.error("Erro ao buscar cidades:", err);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchRaces = async () => {
      setLoadingRaces(true);
      try {
        const result = await getRacas();
        if (result.sucesso && result.racas) {
          setListRaces(result.racas);
        } else {
          console.error("Erro ao carregar raças:", result.mensagemErro);
        }
      } catch (err) {
        console.error("Erro ao buscar raças:", err);
      } finally {
        setLoadingRaces(false);
      }
    };
    fetchRaces();
  }, []);

  useEffect(() => {
    const fetchItens = async () => {
      setLoadingItens(true);
      try {
        const result = await getItens();
        console.log("🚀 ~ fetchItens ~ result:", result)
        const itens: Item[] = result.map(mapToItem);
        console.log("🚀 ~ fetchItens ~ itens:", itens)
        setAllItens(itens);
        setListItens(itens);
      } catch (err) {
        console.error("Erro ao buscar itens:", err);
      } finally {
        setLoadingItens(false);
      }
    };
    fetchItens();
  }, []);


  useEffect(() => {
    const fetchPersonagens = async () => {
      try {
        const result = await getPersonagens();
        console.log("🚀 ~ fetchPersonagens ~ result:", result)
        // API pode retornar array diretamente ou { personagens: [...] }
        const rawList = Array.isArray(result)
          ? result
          : (result as any)?.personagens ?? [];
        console.log("🚀 ~ fetchPersonagens ~ rawList:", rawList)
        // Normaliza cada item para garantir idpersonagem e nome
        const normalized = rawList.map((p: any) => ({
          ...p,
          idpersonagem: p.idpersonagem ?? p.Idpersonagem ?? p.id,
          nome: p.nome ?? p.Nome ?? 'Sem nome'
        }));
        console.log("🚀 ~ fetchPersonagens ~ normalized:", normalized)
        setAllPersonagens(normalized);
      } catch (err) {
        console.error("Erro ao buscar personagens:", err);
      }
    };
    fetchPersonagens();
  }, []);

  useEffect(() => {
    if (!applyRaceDefaults || !selectedRace || !selectedRaceStatus) return;
    if (lastRaceIdRef.current === selectedRace.idraca && hasInitializedRaceRef.current) return;

    lastRaceIdRef.current = selectedRace.idraca;
    hasInitializedRaceRef.current = true;

    applySelectedRaceDefaults(selectedRaceStatus);
  }, [selectedRace?.idraca, selectedRaceStatus, applyRaceDefaults, applySelectedRaceDefaults]);

  useEffect(() => {
    if (!searchItensTerm.trim()) {
      setListItens(allItens);
    } else {
      const term = searchItensTerm.toLowerCase();
      setListItens(
        allItens.filter(i => {
          const nomeMatch = i.nome.toLowerCase().includes(term);
          const tipoMatch = i.tipo.toLowerCase().includes(term);
          
          // Extrai texto do JSONContent se for objeto, ou usa string diretamente
          let descricaoText = '';
          if (i.descricao) {
            if (typeof i.descricao === 'string') {
              descricaoText = i.descricao;
            } else if (typeof i.descricao === 'object' && i.descricao.content) {
              // Extrai texto de JSONContent
              descricaoText = JSON.stringify(i.descricao);
            }
          }
          const descricaoMatch = descricaoText.toLowerCase().includes(term);
          
          return nomeMatch || tipoMatch || descricaoMatch;
        })
      );
    }
  }, [searchItensTerm, allItens]);

  const handleSelectItem = useCallback((item: Item) => {
    console.log("🚀 ~ handleSelectItem ~ item:", item)
    setItens(prev => {
      const updated = [...prev, {
        ...item,
        id: crypto.randomUUID(),
        idItemBase: item.id,
        quantidade: 1,
      }];
      console.log("🚀 ~ handleSelectItem ~ updated:", updated)
      return updated;
    });
  }, []);

  const searchPersonagens = useCallback((query: string) => {
    setSearchTerm(query);

    if (!query) {
      setPersonagens([]);
      return;
    }

    setLoadingPersonagens(true);
    setTimeout(() => {
      const filtered = allPersonagens.filter(p => {
        const nome = p.nome ?? p.Nome ?? '';
        return nome.toLowerCase().includes(query.toLowerCase());
      });
      setPersonagens(filtered);
      setLoadingPersonagens(false);
    }, 300);
  }, [allPersonagens]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    if (isContentCategoryTag(tagToRemove, contentType)) return;
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, [contentType]);

  const handleGaleriaUpload = useCallback((files: File[], shapes: string[]) => {
    setGaleriaFiles(prev => [...prev, ...files]);
    const urls = files.map(file => URL.createObjectURL(file));
    setGaleriaUrls(prev => [...prev, ...urls]);
    setGaleriaShapes(prev => [...prev, ...shapes]);
    setGaleriaCaptions(prev => [...prev, ...files.map(() => '')]);
  }, []);

  const handleRemoveGaleriaImage = useCallback((indexToRemove: number) => {
    setGaleriaUrls(prev => prev.filter((_, i) => i !== indexToRemove));
    setGaleriaFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setGaleriaShapes(prev => prev.filter((_, i) => i !== indexToRemove));
    setGaleriaCaptions(prev => prev.filter((_, i) => i !== indexToRemove));
  }, []);

  const handleGaleriaCaptionChange = useCallback((index: number, caption: string) => {
    setGaleriaCaptions(previous => previous.map((value, itemIndex) => itemIndex === index ? caption : value));
  }, []);

  // --- validação ---
  const validateCharacterForm = useCallback((data: CharacterFormData): CharacterFormErrors => {
    const errors: CharacterFormErrors = {};

    if (!data.name || data.name.trim().length < 3) {
      errors.name = 'O nome deve ter pelo menos 3 caracteres.';
    } else if (data.name.trim().length > 100) {
      errors.name = 'O nome deve ter no máximo 100 caracteres.';
    }

    if (!data.race || data.race === 0) {
      errors.race = 'Selecione uma raça.';
    }

    return errors;
  }, []);

  const validateStepOne = useCallback(() => {
    const validationErrors = validateCharacterForm({ name: userName, race });

    setErrors(validationErrors);
    setUserError(!!validationErrors.name);
    setRaceError(!!validationErrors.race);
    
    if (Object.keys(validationErrors).length > 0) return false;

    setStatusError(false);
    return true;
  }, [userName, race, validateCharacterForm]);

  // --- navegação ---
  const handleNext = useCallback(() => {
    if (step === 1 && !validateStepOne()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  }, [step, validateStepOne]);


  const handlePrev = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  // helper (pode ficar no topo do hook)
  const generateId = () =>
    (typeof crypto !== "undefined" && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : Math.random().toString(36).slice(2, 10);

  // --- submit ---
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateStepOne()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      let avatarPath = avatarUrl;

      if (avatarFile) {
        const result = await saveAsset({
          imageFile: avatarFile,
          type: "personagens",
          entityName: userName,
        });
        avatarPath = result.path;
      }

      const galleryImages = [];
      for (let index = 0; index < galeriaFiles.length; index += 1) {
        const result = await saveAsset({
          imageFile: galeriaFiles[index],
          type: 'personagens',
          entityName: userName,
          folderName: 'galeria',
        });
        galleryImages.push({
          url: result.path,
          legenda: galeriaCaptions[index]?.trim() || undefined,
        });
      }

      const statusForPayload = {
        vida: statusBasico.vida,
        vidaMaxima: statusBasico.vidaMaxima,
        estamina: statusBasico.estamina,
        estaminaMaxima: statusBasico.estaminaMaxima,
        mana: statusBasico.mana,
        manaMaxima: statusBasico.manaMaxima,
        capacidadeCarga: statusBasico.capacidadeCarga,
      };

      const inventarioMapped: Item[] = itens.map((it) => ({
        id: it.id ?? generateId(),
        idItemBase: it.idItemBase ?? undefined,
        nome: it.nome ?? "Item",
        tipo: (it.tipo as ItemTipo) ?? "outro",
        quantidade: Number(it.quantidade) || 1,
        peso:
          it.peso !== undefined && it.peso !== 0
            ? Number(it.peso)
            : undefined,
        descricao: serializeRichText(it.descricao),
        efeito: ((it.atributos as Record<string, unknown> | undefined)?.efeito as string | undefined) ?? it.efeito,
        imagem: it.imagem ?? undefined,
        atributos: it.atributos ?? {},
      }));
      console.log("🚀 ~ handleSubmit ~ inventarioMapped:", inventarioMapped)

      const magiaMapped: Magia[] = magias.filter((magia) => Boolean(magia.nome?.trim())).map((magia) => {
        const serializedEffect = serializeRichText((magia as any).efeito);

        return {
        id: magia.id ?? generateId(),
        nome: magia.nome ?? "Magia",
        efeito: serializedEffect,
        tipo: (magia.tipo as MagiaTipoString) ?? "suporte",
        elemento: (magia.elemento as MagiaElemento[]) ?? ["normal"],
        custo: magia.custo ?? "",
        atributos: {
          ...(magia.atributos ?? {}),
          __efeitoRichText: serializedEffect,
        },
      };
      });

      const skillMapped: Skills[] = skills.filter((skill) => Boolean(skill.nome?.trim())).map((skill) => {
        const serializedEffect = serializeRichText((skill as any).efeito);

        return {
        id: skill.id ?? generateId(),
        nome: skill.nome ?? "Skill",
        efeito: serializedEffect,
        tipo: (skill.tipo as SkillTipoString) ?? "suporte",
        elemento: (skill.elemento as SkillElemento[]) ?? ["normal"],
        custo: skill.custo ?? "",
        nivel: skill.nivel ?? 1,
        atributos: {
          ...(skill.atributos ?? {}),
          __efeitoRichText: serializedEffect,
        },
      };
      });

      const payload: PersonagemCreatePayload = {
        nome: userName,
        idraca: race!,
        idcidade: city,
        historia: prepareForAPI(history),
        imagem: avatarPath,
        galeriaImagem: galleryImages,
        costumes: costumes ? [costumes] : [],
        nanites: nanites ? Number(nanites) : undefined,
        alinhamento: alignment,
        tracos: traits,
        tags: ensureContentCategoryTag(tags, contentType),
        visivel: visivel,
        destaque,
        inventarioJson: inventarioMapped,
        skills: skillMapped,
        magia: magiaMapped,
        personagemsVinculados: listPersonagemRelacionado.map((p) => Number(p.id)).filter((id) => Number.isFinite(id)),
        statusJson: {
          status: statusForPayload,
          atributos: {
            principais: atributosPrincipais,
            secundarios: atributosSecundarios,
          },
          nivel: level,
          xp: xp,
          ...statusExtras,
          defesas: defesas,
        },
      };
      console.log("🚀 ~ handleSubmit ~ payload:", payload)

      const result = await salvarPersonagem(payload);
      console.log("🚀 ~ handleSubmit ~ result:", result)

      if (!result.sucesso) {
        const message = typeof result.mensagemErro === 'string' && result.mensagemErro.trim()
          ? result.mensagemErro
          : 'Erro ao salvar personagem';
        toast.error(message);
        return;
      }

      toast.success("Personagem salvo com sucesso!");
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Erro ao salvar personagem'));
    } finally {
      setIsSubmitting(false);
    }
  }, [avatarUrl, avatarFile, galeriaFiles, galeriaCaptions, userName, statusBasico, itens, magias, skills, race, city, history, costumes, nanites, alignment, traits, idpassiva, ultimate, listPersonagemRelacionado, atributosPrincipais, atributosSecundarios, level, xp, statusExtras, defesas, tags, contentType, visivel, destaque, validateStepOne]);

  return {
    step, setStep,
    userName, setUserName,
    race, setRace, handleRaceChange,
    city, setCity,
    avatarUrl, setAvatarUrl,
    avatarFile, setAvatarFile,
    galeriaUrls,
    galeriaFiles,
    galeriaShapes,
    galeriaCaptions,
    history, setHistory,
    costumes, setCostumes,
    nanites, setNanites,
    alignment, setAlignment,
    traits, setTraits,
    idpassiva, setIdpassiva,
    ultimate, setUltimate,
    tags, setTags,
    tagInput, setTagInput,
    visivel, setVisivel,
    destaque, setDestaque,
    itens, setItens,
    skills, setSkills,
    magias, setMagias,
    listPersonagemRelacionado, setListPersonagemRelacionado,
    statusBasico, setStatusBasico,
    isFirstStep,
    isLastStep,
    xp, setXp,
    level, setLevel,
    statusExtras, setStatusExtras,
    atributosPrincipais, setAtributosPrincipais,
    atributosSecundarios, setAtributosSecundarios,
    defesas, setDefesas,

    // erros
    errors,
    userError, setUserError,
    raceError, setRaceError,
    statusError,

    // listas
    listCities, loadingCities,
    listRaces, loadingRaces, selectedRace,
    personagens, allPersonagens, searchTerm, loadingPersonagens,
    listItens, loadingItens, searchItensTerm, setSearchItensTerm,

    // funções
    searchPersonagens,
    handleAddTag,
    handleRemoveTag,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    handleGaleriaCaptionChange,
    handleNext,
    handleSubmit,
    isSubmitting,
    handlePrev,
    handleSelectItem
  };
};
