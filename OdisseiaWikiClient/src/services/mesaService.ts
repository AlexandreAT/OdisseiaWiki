import api from "../axios/api";
import {
  Mesa,
  MesaAoVivoSnapshot,
  MesaAtualizarPayload,
  MesaCriarPayload,
  MesaExpulsaoRegistro,
  MesaHubResponse,
  MesaJogador,
  MesaPersonagensGerenciamento,
  MesaPesquisaFiltros,
  MesaPublica,
  MesaResumo,
  MesaSolicitacaoEntrada,
  PaginaMesa,
} from "../models/Mesa";

// GET todas as mesas
export const getMesas = async (): Promise<Mesa[]> => {
  const response = await api.get("/Mesa");
  return response.data;
};

// GET mesa por ID
export const getMesaById = async (id: number): Promise<Mesa | null> => {
  const response = await api.get(`/Mesa/${id}`);
  return response.data;
};

// POST criar nova mesa
export const criarMesa = async (payload: Partial<Mesa>): Promise<Mesa> => {
  const response = await api.post("/Mesa", payload);
  return response.data;
};

// PUT atualizar mesa
export const atualizarMesa = async (id: number, payload: Partial<Mesa>): Promise<Mesa> => {
  const response = await api.put(`/Mesa/${id}`, payload);
  return response.data;
};

// DELETE mesa
export const deletarMesa = async (id: number) => {
  await api.delete(`/Mesa/${id}`);
};

const emptyPage = <T>(): PaginaMesa<T> => ({
  itens: [], pagina: 1, tamanhoPagina: 0, totalItens: 0, totalPaginas: 0,
});

const normalizePage = <T>(value: unknown): PaginaMesa<T> => {
  if (!value || typeof value !== 'object') return emptyPage<T>();
  const data = value as Record<string, unknown>;
  const itens = (data.itens ?? data.items ?? data.registros ?? []) as T[];
  const tamanhoPagina = Number(data.tamanhoPagina ?? data.pageSize ?? itens.length ?? 0);
  const totalItens = Number(data.totalItens ?? data.total ?? data.totalCount ?? itens.length);
  const totalPaginas = Number(data.totalPaginas ?? data.pages ?? Math.ceil(totalItens / Math.max(tamanhoPagina, 1)));
  return {
    itens,
    pagina: Number(data.pagina ?? data.page ?? 1),
    tamanhoPagina,
    totalItens,
    totalPaginas,
  };
};

export const obterHubMesas = async (
  criadasPagina = 1,
  participandoPagina = 1,
): Promise<MesaHubResponse> => {
  const response = await api.get('/Mesa/hub', { params: { criadasPagina, participandoPagina } });
  const data = response.data as Record<string, unknown>;
  return {
    criadas: normalizePage<MesaResumo>(data.criadas ?? data.mesasCriadas),
    participando: normalizePage<MesaResumo>(data.participando ?? data.mesasParticipando),
  };
};

export const pesquisarMesas = async (
  filtros: MesaPesquisaFiltros,
): Promise<PaginaMesa<MesaResumo>> => {
  const response = await api.get('/Mesa/pesquisar', {
    params: {
      termo: filtros.termo || undefined,
      idSistemaRpg: filtros.idSistemaRpg || undefined,
      somenteComVagas: filtros.somenteComVagas || undefined,
      pagina: filtros.pagina ?? 1,
      tamanhoPagina: filtros.tamanhoPagina ?? 12,
    },
  });
  return normalizePage<MesaResumo>(response.data);
};

export const obterMesaPublica = async (idMesa: number): Promise<MesaPublica> => {
  const response = await api.get<MesaPublica>(`/Mesa/${idMesa}/publica`);
  return response.data;
};

export const criarMesaCompleta = async (payload: MesaCriarPayload): Promise<MesaResumo> => {
  const response = await api.post<MesaResumo>('/Mesa', payload);
  return response.data;
};

export const atualizarMesaCompleta = async (
  idMesa: number,
  payload: MesaAtualizarPayload,
): Promise<MesaResumo> => {
  const response = await api.put<MesaResumo>(`/Mesa/${idMesa}`, payload);
  return response.data;
};

export const solicitarEntradaMesa = async (
  idMesa: number,
  mensagem?: string,
): Promise<void> => {
  await api.post(`/Mesa/${idMesa}/solicitacoes`, { mensagem: mensagem?.trim() || null });
};

export const listarSolicitacoesMesa = async (
  idMesa: number,
): Promise<MesaSolicitacaoEntrada[]> => {
  const response = await api.get<MesaSolicitacaoEntrada[]>(`/Mesa/${idMesa}/solicitacoes`);
  return response.data;
};

export const aceitarSolicitacaoMesa = async (
  idMesa: number,
  idSolicitacao: number,
): Promise<void> => {
  await api.post(`/Mesa/${idMesa}/solicitacoes/${idSolicitacao}/aceitar`);
};

export const recusarSolicitacaoMesa = async (
  idMesa: number,
  idSolicitacao: number,
): Promise<void> => {
  await api.delete(`/Mesa/${idMesa}/solicitacoes/${idSolicitacao}`);
};

export const listarJogadoresMesa = async (idMesa: number): Promise<MesaJogador[]> => {
  const response = await api.get<MesaJogador[]>(`/Mesa/${idMesa}/jogadores`);
  return response.data;
};

export const expulsarJogadorMesa = async (
  idMesa: number,
  idUsuario: number,
  motivo: string,
): Promise<void> => {
  await api.delete(`/Mesa/${idMesa}/jogadores/${idUsuario}`, { data: { motivo } });
};

export const listarExpulsoesUsuario = async (): Promise<MesaExpulsaoRegistro[]> => {
  const response = await api.get<MesaExpulsaoRegistro[]>('/Mesa/expulsoes');
  return response.data;
};

export const obterPersonagensMesaGerenciamento = async (
  idMesa: number,
): Promise<MesaPersonagensGerenciamento> => {
  const response = await api.get<MesaPersonagensGerenciamento>(
    `/Mesa/${idMesa}/personagens/gerenciamento`,
  );
  return response.data;
};

export const obterMesaAoVivo = async (idMesa: number): Promise<MesaAoVivoSnapshot> => {
  const response = await api.get<MesaAoVivoSnapshot>(`/Mesa/${idMesa}/personagens/ao-vivo`);
  return response.data;
};

export const atualizarMesaAoVivo = async (
  idMesa: number,
  aoVivo: boolean,
): Promise<MesaResumo> => {
  const response = await api.put<MesaResumo>(`/Mesa/${idMesa}/ao-vivo`, { aoVivo });
  return response.data;
};
