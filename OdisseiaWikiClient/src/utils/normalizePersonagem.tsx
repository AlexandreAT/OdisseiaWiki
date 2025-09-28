import { PersonagemStatus } from "../models/Characters";

// ----- tipos auxiliares (adequa se já tiver algo parecido no teu projeto) -----
export type Skill = {
  id?: string;
  nome?: string;
  tipo?: string;
  elemento?: string[];
  custo?: string;
  nivel?: number;
  atributos?: any;
};

export type Magia = Skill;

export type Item = {
  id?: string;
  nome?: string;
  descricao?: string;
  quantidade?: number;
  peso?: number;
  tipo?: string;
  atributos?: any;
};

// ----- raw vindo do backend (muitos campos como string) -----
export interface RawPersonagemApi {
  idpersonagemJogador: number;
  idusuario?: number;
  idmesa?: number;
  nome: string;
  idraca?: number;
  idcidade?: number;
  historia?: string;
  statusJson?: string | PersonagemStatus;
  alinhamento?: string;
  tracos?: string | string[];
  costumes?: string | string[];
  infoSecundariasJson?: string | any;
  imagem?: string;
  inventarioJson?: string | any[];
  nanites?: number | null;
  dataCriacao?: string;
  skills?: string | any[];
  magia?: string | any[];
  personagemsVinculados?: string | any[];
  // ... outros campos que o back enviar
}

// ----- default status para fallback -----
const defaultStatus: PersonagemStatus = {
  status: { vida: 0, estamina: 0, mana: 0, capacidadeCarga: 0 },
  atributos: {
    principais: { resistencia: 0, agilidade: 0, sabedoria: 0, precisao: 0, forca: 0 },
    secundarios: { sanidade: 0, coragem: 0, inteligencia: 0, percepcao: 0, labia: 0, intimidacao: 0 },
  },
  nivel: 1,
  xp: 0,
  defesas: { armadura: 0, protecao: 0, escudo: 0, outras: 0 },
};

// ----- helper de parse seguro -----
function parseJsonOr<T>(value: any, fallback: T): T {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

// ----- mapper: transforma o raw (API) num objeto normalizado pra UI -----
export function normalizePersonagem(raw: RawPersonagemApi) {
  const status = parseJsonOr<PersonagemStatus>(raw.statusJson, defaultStatus);
  const tracos = parseJsonOr<string[]>(raw.tracos, []);
  const costumes = parseJsonOr<string[]>(raw.costumes, []);
  const inventario = parseJsonOr<Item[]>(raw.inventarioJson, []);
  const skills = parseJsonOr<Skill[]>(raw.skills, []);
  const magias = parseJsonOr<Magia[]>(raw.magia, []);
  const relacionados = parseJsonOr<any[]>(raw.personagemsVinculados, []);

  return {
    idpersonagemJogador: raw.idpersonagemJogador,
    idusuario: raw.idusuario,
    idmesa: raw.idmesa,
    nome: raw.nome,
    idraca: raw.idraca,
    idcidade: raw.idcidade,
    historia: raw.historia ?? '',
    statusJson: status,
    alinhamento: raw.alinhamento ?? '',
    tracos,
    costumes,
    infoSecundariasJson: parseJsonOr<any>(raw.infoSecundariasJson, raw.infoSecundariasJson ?? ''),
    imagem: raw.imagem ?? '',
    inventarioJson: inventario,
    nanites: raw.nanites ?? 0,
    dataCriacao: raw.dataCriacao ?? '',
    skills,
    magia: magias,
    personagemsVinculados: relacionados,
  } as const; // retorna um objeto normalizado
}