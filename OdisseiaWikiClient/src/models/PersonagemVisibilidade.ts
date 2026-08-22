export type TipoPersonagemVisibilidade = 'npc' | 'jogador';

/**
 * Configuração granular dos dados da ficha que podem ser exibidos.
 *
 * A visibilidade geral do personagem (`visivel`) é independente desta
 * configuração e, por isso, não faz parte deste contrato.
 */
export interface PersonagemVisibilidade {
  vida: boolean;
  estamina: boolean;
  mana: boolean;
  capacidadeCarga: boolean;
  atributosPrincipais: boolean;
  atributosSecundarios: boolean;
  defesas: boolean;
  imagem: boolean;
  historia: boolean;
  raca: boolean;
  cidade: boolean;
  nome: boolean;
  alinhamento: boolean;
  tracosPersonalidade: boolean;
  personagensRelacionados: boolean;
  inventario: boolean;
  proteses: boolean;
  passivas: boolean;
  ultimate: boolean;
  skills: boolean;
  magias: boolean;
  galeria: boolean;
  xp: boolean;
  nivel: boolean;
}

export type CampoPersonagemVisibilidade = keyof PersonagemVisibilidade;

export interface DefinicaoCampoPersonagemVisibilidade {
  rotulo: string;
  descricao: string;
}

export interface GrupoPersonagemVisibilidade {
  id: 'identidade' | 'status' | 'conteudo';
  titulo: string;
  campos: readonly CampoPersonagemVisibilidade[];
}

/** Mantém a lista de campos e o contrato HTTP validados pelo TypeScript. */
export const CAMPOS_PERSONAGEM_VISIBILIDADE: Record<
  CampoPersonagemVisibilidade,
  DefinicaoCampoPersonagemVisibilidade
> = {
  vida: { rotulo: 'Vida', descricao: 'Vida atual e máxima.' },
  estamina: { rotulo: 'Estamina', descricao: 'Estamina atual e máxima.' },
  mana: { rotulo: 'Mana', descricao: 'Mana atual e máxima.' },
  capacidadeCarga: { rotulo: 'Capacidade de carga', descricao: 'Limite de carga do personagem.' },
  atributosPrincipais: { rotulo: 'Atributos principais', descricao: 'Força, agilidade e demais atributos base.' },
  atributosSecundarios: { rotulo: 'Atributos secundários', descricao: 'Atributos derivados e complementares.' },
  defesas: { rotulo: 'Defesas', descricao: 'Armadura, proteção, escudo e outras defesas.' },
  imagem: { rotulo: 'Imagem', descricao: 'Imagem principal do personagem.' },
  historia: { rotulo: 'História', descricao: 'Biografia e contexto do personagem.' },
  raca: { rotulo: 'Raça', descricao: 'Raça associada ao personagem.' },
  cidade: { rotulo: 'Cidade', descricao: 'Cidade de origem ou associação.' },
  nome: { rotulo: 'Nome', descricao: 'Nome exibido na ficha.' },
  alinhamento: { rotulo: 'Alinhamento', descricao: 'Alinhamento do personagem.' },
  tracosPersonalidade: { rotulo: 'Traços de personalidade', descricao: 'Traços e costumes do personagem.' },
  personagensRelacionados: { rotulo: 'Personagens relacionados', descricao: 'Vínculos com outros personagens.' },
  inventario: { rotulo: 'Inventário', descricao: 'Itens e equipamentos carregados.' },
  proteses: { rotulo: 'Próteses', descricao: 'Próteses e implantes do personagem.' },
  passivas: { rotulo: 'Passivas', descricao: 'Habilidades passivas.' },
  ultimate: { rotulo: 'Ultimate', descricao: 'Habilidade ultimate.' },
  skills: { rotulo: 'Skills', descricao: 'Lista de habilidades.' },
  magias: { rotulo: 'Magias', descricao: 'Lista de magias.' },
  galeria: { rotulo: 'Galeria', descricao: 'Imagens adicionais do personagem.' },
  xp: { rotulo: 'XP', descricao: 'Experiência acumulada.' },
  nivel: { rotulo: 'Nível', descricao: 'Nível atual do personagem.' },
};

export const GRUPOS_PERSONAGEM_VISIBILIDADE: readonly GrupoPersonagemVisibilidade[] = [
  {
    id: 'identidade',
    titulo: 'Identidade e narrativa',
    campos: ['imagem', 'nome', 'raca', 'cidade', 'alinhamento', 'tracosPersonalidade', 'historia'],
  },
  {
    id: 'status',
    titulo: 'Status e progressão',
    campos: [
      'vida',
      'estamina',
      'mana',
      'capacidadeCarga',
      'atributosPrincipais',
      'atributosSecundarios',
      'defesas',
      'xp',
      'nivel',
    ],
  },
  {
    id: 'conteudo',
    titulo: 'Conteúdo da ficha',
    campos: [
      'personagensRelacionados',
      'inventario',
      'proteses',
      'passivas',
      'ultimate',
      'skills',
      'magias',
      'galeria',
    ],
  },
];

/**
 * Gera uma configuração completa para respostas antigas/parciais do endpoint.
 * NPCs preservam a regra inicial da wiki; fichas de jogador começam abertas.
 */
export const criarVisibilidadePadrao = (
  tipo: TipoPersonagemVisibilidade,
): PersonagemVisibilidade => ({
  vida: true,
  estamina: true,
  mana: true,
  capacidadeCarga: true,
  atributosPrincipais: true,
  atributosSecundarios: true,
  defesas: true,
  imagem: true,
  historia: tipo === 'jogador',
  raca: true,
  cidade: true,
  nome: true,
  alinhamento: true,
  tracosPersonalidade: true,
  personagensRelacionados: true,
  inventario: tipo === 'jogador',
  proteses: true,
  passivas: tipo === 'jogador',
  ultimate: tipo === 'jogador',
  skills: tipo === 'jogador',
  magias: tipo === 'jogador',
  galeria: true,
  xp: tipo === 'jogador',
  nivel: tipo === 'jogador',
});

export const visibilidadesSaoIguais = (
  primeira: PersonagemVisibilidade,
  segunda: PersonagemVisibilidade,
): boolean => Object.keys(CAMPOS_PERSONAGEM_VISIBILIDADE).every((campo) => (
  primeira[campo as CampoPersonagemVisibilidade] === segunda[campo as CampoPersonagemVisibilidade]
));

export const definirTodosCamposVisiveis = (
  visibilidade: PersonagemVisibilidade,
  visivel: boolean,
): PersonagemVisibilidade => Object.keys(CAMPOS_PERSONAGEM_VISIBILIDADE).reduce<PersonagemVisibilidade>(
  (configuracao, campo) => ({
    ...configuracao,
    [campo]: visivel,
  }),
  { ...visibilidade },
);
