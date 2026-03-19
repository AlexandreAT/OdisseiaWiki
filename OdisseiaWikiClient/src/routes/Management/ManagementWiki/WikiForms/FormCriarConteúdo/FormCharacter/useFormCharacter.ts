import { mapToItem } from './../../../../../../utils/mapItem';
import { getRacas } from './../../../../../../services/racasService';
import { RacaPayload } from './../../../../../../services/racasService';
import { CidadePayload, getCidades } from './../../../../../../services/cidadesService';
import { PersonagemCreatePayload } from './../../../../../../services/personagensService';
import { saveAsset } from './../../../../../../services/assetsService';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { personagensMock } from '../../../../../../Mock/characters.mock';
import { CharacterFormData, CharacterFormErrors } from './FormCharacter.type';
import toast from 'react-hot-toast';
import { Principais, Secundarios, JSONContent } from '../../../../../../models/Characters';
import { SkillElemento, Skills, SkillTipoString } from '../../../../../../models/Skills';
import { Item, ItemTipo } from '../../../../../../models/Itens';
import { Magia, MagiaElemento, MagiaTipoString } from '../../../../../../models/Magias';
import { salvarPersonagem } from '../../../../../../services/personagensService';
import { getItens } from '../../../../../../services/itensService';
import { prepareForAPI } from '../../../../../../utils/richTextHelpers';

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

  if (!responseData) return 'Erro ao salvar personagem';
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

  return 'Erro ao salvar personagem';
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
  const [history, setHistory] = useState<JSONContent | string>('');
  const [costumes, setCostumes] = useState('');
  const [nanites, setNanites] = useState('');
  const [alignment, setAlignment] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visivel, setVisivel] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  // const [capacidadeCarga, setCapacidadeCarga] = useState(0); // TODO: Implementar se necessário
  const [skills, setSkills] = useState<Skills[]>([
    { nome: "", tipo: "suporte", elemento: ["normal"], nivel: 1,  }
  ])
  const [magias, setMagias] = useState<Magia[]>([
    { nome: "", tipo: "suporte", elemento: ["fogo"] },
  ]);
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
  const [allPersonagens, setAllPersonagens] = useState<typeof personagensMock>([]);
  const [personagens, setPersonagens] = useState<typeof personagensMock>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPersonagens, setLoadingPersonagens] = useState(false);

  const TOTAL_STEPS = 2; // ajuste conforme for crescendo

  const isFirstStep = step === 1;
  const isLastStep = step === TOTAL_STEPS;

  const selectedRace = useMemo(() => 
    listRaces.find(r => r.idraca === race),
    [listRaces, race]
  );

  // Auto-adiciona tag do tipo de conteúdo quando muda
  useEffect(() => {
    if (contentType) {
      setTags([contentType]);
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
    setAllPersonagens(personagensMock);
    setPersonagens([]);
  }, []);

  useEffect(() => {
    if (!applyRaceDefaults) return;

    if (selectedRace?.statusJson) {
      const basePrincipais: Principais = {
        resistencia: 0,
        agilidade: 0,
        sabedoria: 0,
        precisao: 0,
        forca: 0,
      };

      const key = selectedRace.statusJson.atributoInicial
        ?.trim()
        ?.toLowerCase() as keyof Principais;

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

      setStatusBasico({
        vida: selectedRace.statusJson.status.vida,
        vidaMaxima: selectedRace.statusJson.status.vidaMaxima ?? selectedRace.statusJson.status.vida,
        estamina: selectedRace.statusJson.status.estamina,
        estaminaMaxima: selectedRace.statusJson.status.estaminaMaxima ?? selectedRace.statusJson.status.estamina,
        mana: selectedRace.statusJson.status.mana,
        manaMaxima: selectedRace.statusJson.status.manaMaxima ?? selectedRace.statusJson.status.mana,
        capacidadeCarga: selectedRace.statusJson.status.capacidadeCarga ?? 0,
      });    
    }
  }, [selectedRace, applyRaceDefaults]);

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
      if (prev.length === 0) return [item];

      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        ...item,
        id: crypto.randomUUID(),
        idItemBase: item.id,
        quantidade: 1,
      };
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
      const filtered = allPersonagens.filter(p =>
        p.Nome.toLowerCase().includes(query.toLowerCase())
      );
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
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // --- validação ---
  const validateCharacterForm = useCallback((data: CharacterFormData): CharacterFormErrors => {
    const errors: CharacterFormErrors = {};

    if (!data.name || data.name.trim().length < 1) {
      errors.name = 'O nome deve ter pelo menos 1 caracter.';
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
        efeito: it.efeito ?? undefined,
        imagem: it.imagem ?? undefined,
        atributos: it.atributos ?? {},
      }));
      console.log("🚀 ~ handleSubmit ~ inventarioMapped:", inventarioMapped)

      const magiaMapped: Magia[] = magias.map((magia) => {
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

      const skillMapped: Skills[] = skills.map((skill) => {
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
        costumes: costumes ? [costumes] : [],
        nanites: nanites ? Number(nanites) : undefined,
        alinhamento: alignment,
        tracos: traits,
        tags: tags.length > 0 ? tags : undefined,
        visivel: visivel,
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
      toast.error(extractErrorMessage(err));
    }
  }, [avatarUrl, avatarFile, userName, statusBasico, itens, magias, skills, race, city, history, costumes, nanites, alignment, traits, listPersonagemRelacionado, atributosPrincipais, atributosSecundarios, level, xp, defesas]);

  return {
    step, setStep,
    userName, setUserName,
    race, setRace,
    city, setCity,
    avatarUrl, setAvatarUrl,
    avatarFile, setAvatarFile,
    history, setHistory,
    costumes, setCostumes,
    nanites, setNanites,
    alignment, setAlignment,
    traits, setTraits,
    tags, setTags,
    tagInput, setTagInput,
    visivel, setVisivel,
    itens, setItens,
    skills, setSkills,
    magias, setMagias,
    listPersonagemRelacionado, setListPersonagemRelacionado,
    statusBasico, setStatusBasico,
    isFirstStep,
    isLastStep,
    xp, setXp,
    level, setLevel,
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
    handleNext,
    handleSubmit,
    handlePrev,
    handleSelectItem
  };
};