import type { PersonagemJogador, StatusBase } from './PersonagemJogador';

export interface Mesa {
  idmesa: number;
  idusuarioCriacao?: number;
  nome: string;
  imagem?: string | null;
  padraoSistema: boolean;
  idSistemaVersao?: number | null;
  dataCriacao: string;
}

export type MesaPapelUsuario = 'Mestre' | 'Participante' | 'Pendente' | 'Visitante' | 'Expulso';

export interface PaginaMesa<T> {
  itens: T[];
  pagina: number;
  tamanhoPagina: number;
  totalItens: number;
  totalPaginas: number;
}

export interface MesaResumo {
  idMesa: number;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  tags: string[];
  idUsuarioCriacao?: number | null;
  mestreNome: string;
  mestreImagem?: string | null;
  idSistemaRpg?: number | null;
  sistemaNome: string;
  idSistemaVersao?: number | null;
  numeroVersao?: string | null;
  jogadoresAtuais: number;
  limiteJogadores: number;
  vagasDisponiveis: number;
  solicitacoesPendentes?: number;
  papelUsuario?: MesaPapelUsuario;
  aoVivo: boolean;
  dataCriacao?: string;
}

export interface MesaHubResponse {
  criadas: PaginaMesa<MesaResumo>;
  participando: PaginaMesa<MesaResumo>;
}

export interface MesaPublica extends MesaResumo {
  papelUsuario: MesaPapelUsuario;
  podeSolicitarEntrada: boolean;
  solicitacaoPendente: boolean;
  lotada: boolean;
  wikiDisponivel: boolean;
}

export interface MesaCriarPayload {
  nome: string;
  descricao?: string;
  imagem?: string | null;
  limiteJogadores: number;
  tags: string[];
  idSistemaRpg: number;
  idSistemaVersao: number;
  acompanharVersaoAtual: boolean;
}

export interface MesaAtualizarPayload {
  nome: string;
  descricao?: string;
  imagem?: string | null;
  limiteJogadores: number;
  tags: string[];
  idSistemaVersao: number;
  acompanharVersaoAtual: boolean;
}

export interface MesaPesquisaFiltros {
  termo?: string;
  idSistemaRpg?: number;
  somenteComVagas?: boolean;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface MesaSolicitacaoEntrada {
  idSolicitacao: number;
  idMesa: number;
  idUsuario: number;
  usuarioNome: string;
  usuarioImagem?: string | null;
  mensagem?: string | null;
  dataSolicitacao: string;
  dataCadastroUsuario?: string | null;
}

export interface MesaJogador {
  idUsuario: number;
  nome: string;
  imagem?: string | null;
  dataEntrada?: string | null;
  personagens: number;
  online?: boolean;
}

export interface MesaPersonagemResumo {
  personagem: PersonagemJogador;
  status: StatusBase;
  nivel: number;
  xp: number;
  idUsuarioDono?: number | null;
  donoNome: string;
  donoImagem?: string | null;
  online: boolean;
  morto?: boolean;
}

export interface MesaPersonagensGerenciamento {
  mesa: MesaResumo;
  personagens: MesaPersonagemResumo[];
}

export interface MesaAoVivoSnapshot extends MesaPersonagensGerenciamento {
  jogadoresOnline: number;
  participantes: number;
  turnoAtual: 'Mestre';
  atualizadoEm?: string;
}

export interface MesaExpulsaoRegistro {
  idMesa: number;
  mesaNome: string;
  motivo: string;
  dataExpulsao: string;
}
