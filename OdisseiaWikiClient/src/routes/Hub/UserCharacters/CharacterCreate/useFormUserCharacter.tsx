import { mapToItem } from './../../../../utils/mapItem';
import { getRacas, RacaPayload } from './../../../../services/racasService';
import { CidadePayload, getCidades } from './../../../../services/cidadesService';
import { saveAsset } from './../../../../services/assetsService';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { personagensMock } from '../../../../Mock/characters.mock';
import { CharacterFormData, CharacterFormErrors } from './FormUserCharacter/FormUserCharacter.type';
import toast from 'react-hot-toast';
import { Principais, Secundarios } from '../../../../models/Characters';
import { Skills } from '../../../../models/Skills';
import { Item } from '../../../../models/Itens';
import { Magia } from '../../../../models/Magias';
import { getItens } from '../../../../services/itensService';
import { getPersonagens } from '../../../../services/personagensService';
import { Mesa } from '../../../../models/Mesa';
import { getMesas } from '../../../../services/mesaService';
import { atualizarPersonagemJogador, criarPersonagemJogador, PersonagemJogadorPayload } from '../../../../services/personagemJogadorService';
import { PersonagemJogador } from '../../../../models/PersonagemJogador';
import { TOTAL_STEPS } from './constants';
import { mapInventoryForPayload, mapMagiasForPayload, mapSkillsForPayload } from './helpers';

export const useFormUserCharacter = (userId: number, onSave?: () => void, personagem?: PersonagemJogador) => {
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
  const [history, setHistory] = useState('');
  const [costumes, setCostumes] = useState('');
  const [extraInformation, setExtraInformation] = useState('');
  const [nanites, setNanites] = useState('');
  const [alignment, setAlignment] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
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
    estamina: 0,
    mana: 0,
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

  // --- mesas ---
  const [listMesas, setListMesas] = useState<Mesa[]>([]);
  const [selectedMesa, setSelectedMesa] = useState<number | undefined>(undefined);
  const [loadingMesas, setLoadingMesas] = useState(true);

  const isFirstStep = step === 1;
  const isLastStep = step === TOTAL_STEPS;

  const selectedRace = useMemo(() => 
    listRaces.find(r => r.idraca === race), 
    [listRaces, race]
  );

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const result = await getCidades(true); // Personagem Jogador: apenas visíveis
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
        const itens: Item[] = result.map(mapToItem);
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
        const personagensData = await getPersonagens(true); // Personagem Jogador: apenas visíveis
        
        if (personagensData && Array.isArray(personagensData)) {
          const mappedPersonagens = personagensData.map(p => {
            // Parse dos campos JSON que vêm como strings
            const personagemsVinculados = p.personagemsVinculados 
              ? (typeof p.personagemsVinculados === 'string' 
                ? JSON.parse(p.personagemsVinculados) 
                : p.personagemsVinculados)
              : [];

            return {
              Idpersonagem: parseInt(p.idpersonagem),
              Nome: p.nome,
              Idraca: p.idraca,
              Idcidade: p.idcidade,
              Historia: p.historia,
              StatusJson: p.statusJson,
              Alinhamento: p.alinhamento,
              Tracos: p.tracos,
              Costumes: p.costumes,
              Imagem: p.imagem,
              InventarioJson: p.inventarioJson,
              PersonagemsVinculados: personagemsVinculados.map((id: any) => 
                typeof id === 'string' ? parseInt(id) : id
              ),
              Nanites: p.nanites || 0,
              Tags: p.tags,
              Visivel: p.visivel,
              DataCriacao: p.dataCriacao,
              Skills: p.skills,
              Magia: p.magia,
            };
          });
          
          setAllPersonagens(mappedPersonagens as any);
          setPersonagens([]);
        } else {
          setAllPersonagens(personagensMock);
          setPersonagens([]);
        }
      } catch (err) {
        setAllPersonagens(personagensMock);
        setPersonagens([]);
      }
    };
    fetchPersonagens();
  }, []);

  useEffect(() => {
    const fetchMesas = async () => {
        setLoadingMesas(true);
        try {
          const mesas = await getMesas();
          setListMesas(mesas);
          const defaultMesa = mesas.find(m => m.idmesa === 1);
          
          if (defaultMesa) setSelectedMesa(defaultMesa.idmesa);
        } catch (err) {
          
        } finally {
          setLoadingMesas(false);
        }
    };
    fetchMesas();
  }, []);

  const hasInitializedRef = useRef(false);
  const lastRaceIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Não resetar atributos se estamos editando um personagem existente
    if (personagem || !selectedRace?.statusJson) return;
    
    // Evita re-executar se a raça não mudou
    if (lastRaceIdRef.current === selectedRace.idraca && hasInitializedRef.current) return;
    
    lastRaceIdRef.current = selectedRace.idraca;
    hasInitializedRef.current = true;

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
      estamina: selectedRace.statusJson.status.estamina,
      mana: selectedRace.statusJson.status.mana,
      capacidadeCarga: selectedRace.statusJson.status.capacidadeCarga ?? 0,
    });    
  }, [selectedRace?.idraca, selectedRace?.statusJson, personagem]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchItensTerm.trim()) {
        setListItens(allItens);
      } else {
        const term = searchItensTerm.toLowerCase();
        setListItens(
          allItens.filter(i =>
            i.nome.toLowerCase().includes(term) ||
            i.tipo.toLowerCase().includes(term) ||
            i.descricao?.toLowerCase().includes(term)
          )
        );
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [searchItensTerm, allItens]);

  const handleSelectItem = useCallback((item: Item) => {
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
      
      return updated;
    });
  }, []);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchPersonagens = useCallback((query: string) => {
    setSearchTerm(query);

    if (!query) {
      setPersonagens([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoadingPersonagens(true);
    searchTimeoutRef.current = setTimeout(() => {
      const filtered = allPersonagens.filter(p =>
        p.Nome.toLowerCase().includes(query.toLowerCase())
      );
      setPersonagens(filtered);
      setLoadingPersonagens(false);
    }, 300);
  }, [allPersonagens]);

  useEffect(() => {
    if (!personagem) return;

    const status = personagem.statusJson 
        ? JSON.parse(personagem.statusJson) 
        : { status: {}, atributos: {}, nivel: 1, xp: 0, defesas: {} };

    const tracos = personagem.tracos ? JSON.parse(personagem.tracos) : [];
    const costumes = personagem.costumes ? JSON.parse(personagem.costumes) : [];
    const inventario = personagem.inventarioJson ? JSON.parse(personagem.inventarioJson) : [];
    console.log("🚀 ~ useFormUserCharacter ~ personagem.inventarioJson:", personagem.inventarioJson)
    console.log("🚀 ~ useFormUserCharacter ~ inventario:", inventario)
    const skills = personagem.skills ? JSON.parse(personagem.skills) : [];
    const magias = personagem.magia ? JSON.parse(personagem.magia) : [];
    const relacionados = personagem.personagemsVinculados 
        ? JSON.parse(personagem.personagemsVinculados) 
        : [];

    // --- setando os states ---
    setUserName(personagem.nome || '');
    setRace(personagem.idraca);
    setCity(personagem.idcidade || undefined);
    setAvatarUrl(personagem.imagem || '');
    setHistory(personagem.historia || '');
    setExtraInformation(personagem.infoSecundariasJson || '');
    setNanites(personagem.nanites?.toString() || '');
    setAlignment(personagem.alinhamento || '');
    setTraits(tracos);
    setCostumes(costumes);

    setStatusBasico({
        vida: status.status?.vida ?? 0,
        estamina: status.status?.estamina ?? 0,
        mana: status.status?.mana ?? 0,
        capacidadeCarga: status.status?.capacidadeCarga ?? 0,
    });

    setDefesas({
        armadura: status.defesas?.armadura ?? 0,
        protecao: status.defesas?.protecao ?? 0,
        escudo: status.defesas?.escudo ?? 0,
        outras: status.defesas?.outras ?? 0,
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

    setSkills(skills);
    setMagias(magias);
    setItens(inventario);
    setListPersonagemRelacionado(relacionados);

    setXp(status.xp ?? 0);
    setLevel(status.nivel ?? 1);

  }, [personagem]);

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

  const handleUpdate = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      let avatarPath = avatarUrl;
      console.log("🚀 ~ handleUpdate ~ avatarUrl:", avatarUrl)

      if (avatarFile) {
        const result = await saveAsset({
          imageFile: avatarFile,
          type: "personagemjogador",
          entityName: userName,
        });
        avatarPath = result.path;
      }

      const statusForPayload = {
        vida: statusBasico.vida,
        estamina: statusBasico.estamina,
        mana: statusBasico.mana,
        capacidadeCarga: statusBasico.capacidadeCarga,
      };

      const inventarioMapped = mapInventoryForPayload(itens);
      const magiaMapped = mapMagiasForPayload(magias);
      const skillMapped = mapSkillsForPayload(skills);

      const payload: PersonagemJogadorPayload = {
        nome: userName,
        idraca: race!,
        idcidade: city!,
        idusuario: userId,
        idmesa: selectedMesa!,
        historia: history,
        imagem: avatarPath,
        costumes: costumes 
          ? (Array.isArray(costumes) ? costumes : [costumes]) 
          : [],
        infoSecundariasJson: extraInformation,
        nanites: nanites ? Number(nanites) : undefined,
        alinhamento: alignment,
        tracos: traits,
        inventarioJson: inventarioMapped,
        skills: skillMapped,
        magia: magiaMapped,
        personagemsVinculados: listPersonagemRelacionado.map((p) => String(p.id)),
        dataCriacao: new Date().toISOString(),
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

      const idPersonagem = personagem?.idpersonagemJogador;

      if (!idPersonagem) {
        toast.error("ID do personagem não encontrado para atualização.");
        return;
      }

      const result = await atualizarPersonagemJogador(idPersonagem, payload);

      if (!result.sucesso) {
        toast.error(result.mensagemErro || "Erro ao salvar personagem");
        return;
      }

      toast.success("Personagem salvo com sucesso!");
      if (onSave) onSave();
    } catch (err: any) {
      toast.error(err?.response?.data || "Erro ao salvar personagem");
    }
  }, [avatarUrl, avatarFile, userName, statusBasico, itens, magias, skills, race, city, userId, selectedMesa, history, costumes, extraInformation, nanites, alignment, traits, listPersonagemRelacionado, atributosPrincipais, atributosSecundarios, level, xp, defesas, personagem, onSave]);

  // --- submit ---
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      let avatarPath = avatarUrl;

      if (avatarFile) {
        const result = await saveAsset({
          imageFile: avatarFile,
          type: "personagemjogador",
          entityName: userName,
        });
        avatarPath = result.path;
      }

      const statusForPayload = {
        vida: statusBasico.vida,
        estamina: statusBasico.estamina,
        mana: statusBasico.mana,
        capacidadeCarga: statusBasico.capacidadeCarga,
      };

      const inventarioMapped = mapInventoryForPayload(itens);
      const magiaMapped = mapMagiasForPayload(magias);
      const skillMapped = mapSkillsForPayload(skills);

      const payload: PersonagemJogadorPayload = {
        nome: userName,
        idraca: race!,
        idcidade: city!,
        idusuario: userId,
        idmesa: selectedMesa!,
        historia: history,
        imagem: avatarPath,
        costumes: costumes 
          ? (Array.isArray(costumes) ? costumes : [costumes]) 
          : [],
        infoSecundariasJson: extraInformation,
        nanites: nanites ? Number(nanites) : undefined,
        alinhamento: alignment,
        tracos: traits,
        inventarioJson: inventarioMapped,
        skills: skillMapped,
        magia: magiaMapped,
        personagemsVinculados: listPersonagemRelacionado.map((p) => String(p.id)),
        dataCriacao: new Date().toISOString(),
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
      const result = await criarPersonagemJogador(payload);

      if (!result.sucesso) {
        toast.error(result.mensagemErro || "Erro ao salvar personagem");
        return;
      }

      toast.success("Personagem salvo com sucesso!");
      if (onSave) onSave();
    } catch (err: any) {
      toast.error(err?.response?.data || "Erro ao salvar personagem");
    }
  }, [avatarUrl, avatarFile, userName, statusBasico, itens, magias, skills, race, city, userId, selectedMesa, history, costumes, extraInformation, nanites, alignment, traits, listPersonagemRelacionado, atributosPrincipais, atributosSecundarios, level, xp, defesas, onSave]);

  return {
    step,
    setStep,
    isFirstStep,
    isLastStep,
    userName,
    setUserName,
    race,
    setRace,
    city,
    setCity,
    avatarUrl,
    setAvatarUrl,
    avatarFile,
    setAvatarFile,
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
    errors,
    userError,
    setUserError,
    raceError,
    setRaceError,
    statusError,
    listCities,
    loadingCities,
    listRaces,
    loadingRaces,
    selectedRace,
    personagens,
    allPersonagens,
    searchTerm,
    loadingPersonagens,
    listItens,
    loadingItens,
    searchItensTerm,
    setSearchItensTerm,
    selectedMesa,
    setSelectedMesa,
    listMesas,
    loadingMesas,
    searchPersonagens,
    handleNext,
    handleSubmit,
    handlePrev,
    handleSelectItem,
    handleUpdate,
  };
};