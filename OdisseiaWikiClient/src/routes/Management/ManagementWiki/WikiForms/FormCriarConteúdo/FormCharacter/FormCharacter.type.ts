import { Skills, SkillTipoString, SkillElemento } from '../../../../../../models/Skills';
import { Item, ItemTipo } from '../../../../../../models/Itens';
import { Magia, MagiaTipoString, MagiaElemento } from '../../../../../../models/Magias';
import { JSONContent } from '../../../../../../models/Characters';
import { RacaPayload } from '../../../../../../services/racasService';
import { CidadePayload } from '../../../../../../services/cidadesService';

export interface CharacterFormErrors {
  name?: string;
  race?: string;
}

export interface CharacterFormData {
  name: string;
  race?: number;
  city?: number;
}

export interface StatusBasico {
  vida: number;
  vidaMaxima: number;
  estamina: number;
  estaminaMaxima: number;
  mana: number;
  manaMaxima: number;
  capacidadeCarga: number;
}

export interface Defesas {
  armadura: number;
  protecao: number;
  escudo: number;
  outras: number;
}

export interface Principais {
  resistencia: number;
  agilidade: number;
  sabedoria: number;
  precisao: number;
  forca: number;
}

export interface Secundarios {
  sanidade: number;
  coragem: number;
  inteligencia: number;
  percepcao: number;
  labia: number;
  intimidacao: number;
}

export interface RelatedCharacter {
  id: number;
  nome: string;
}

export interface CharacterFormHookReturn {
  // Navigation
  step: number;
  setStep: (step: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  handleNext: () => void;
  handlePrev: () => void;
  handleSubmit: () => void;

  // Character data
  userName: string;
  setUserName: (value: string) => void;
  race: number | undefined;
  setRace: (value: number | undefined) => void;
  city: number | undefined;
  setCity: (value: number | undefined) => void;

  // Avatar & Gallery
  avatarUrl: string;
  setAvatarUrl: (value: string) => void;
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  galeriaUrls: string[];
  galeriaFiles: File[];
  galeriaShapes: string[];
  handleGaleriaUpload: (files: File[], shapes: string[]) => void;
  handleRemoveGaleriaImage: (index: number) => void;

  // Rich text & descriptive fields
  history: JSONContent | string;
  setHistory: (value: JSONContent | string) => void;
  costumes: string;
  setCostumes: (value: string) => void;
  nanites: string;
  setNanites: (value: string) => void;
  extraInformation?: string;
  setExtraInformation?: (value: string) => void;

  // Personality & visibility
  alignment: string;
  setAlignment: (value: string) => void;
  traits: string[];
  setTraits: (value: string[]) => void;
  tags: string[];
  setTags: (value: string[]) => void;
  visivel: boolean;
  setVisivel: (value: boolean) => void;

  // Experience & levels
  xp: number;
  setXp: (value: number) => void;
  level: number;
  setLevel: (value: number) => void;

  // Inventory
  itens: Item[];
  setItens: (value: Item[]) => void;
  skills: Skills[];
  setSkills: (value: Skills[]) => void;
  magias: Magia[];
  setMagias: (value: Magia[]) => void;

  // Related characters
  listPersonagemRelacionado: RelatedCharacter[];
  setListPersonagemRelacionado: (value: RelatedCharacter[]) => void;

  // Stats & Attributes
  statusBasico: StatusBasico;
  setStatusBasico: (value: StatusBasico) => void;
  atributosPrincipais: Principais;
  setAtributosPrincipais: (value: Principais) => void;
  atributosSecundarios: Secundarios;
  setAtributosSecundarios: (value: Secundarios) => void;
  defesas: Defesas;
  setDefesas: (value: Defesas) => void;

  // Fetched data (Cities, Races, Items)
  listCities: CidadePayload[];
  loadingCities: boolean;
  listRaces: RacaPayload[];
  loadingRaces: boolean;
  listItens: Item[];
  loadingItens: boolean;

  // Search
  searchItensTerm: string;
  setSearchItensTerm: (value: string) => void;

  // Errors & validation
  errors: CharacterFormErrors;
  userError: boolean;
  setUserError: (value: boolean) => void;
  raceError: boolean;
  setRaceError: (value: boolean) => void;
}