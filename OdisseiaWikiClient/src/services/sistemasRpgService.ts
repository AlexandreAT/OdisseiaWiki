import api from '../axios/api';
import {
  AtualizarSistemaRpgPayload,
  ConfiguracaoCombateSistema,
  ConfiguracaoCriacaoSistema,
  ConfiguracaoExploracaoSistema,
  ConfiguracaoGeralSistema,
  ConfiguracaoPoderesSistema,
  ConfiguracaoProgressaoSistema,
  ConfiguracaoSobrevivenciaSistema,
  CriarSistemaRpgPayload,
  CriarSistemaVersaoPayload,
  DuplicarSistemaVersaoPayload,
  SistemaModuloConfigMap,
  SistemaModuloKey,
  MesaMigracaoPreview,
  SistemaPatchNote,
  SistemaResolverResult,
  SistemaRuntimeConsulta,
  SistemaRuntimeContexto,
  SistemaItensConfig,
  SistemaRpg,
  SistemaRpgResumo,
  SistemaVersaoResumo,
  SISTEMA_MODULO_ENDPOINTS,
} from '../models/SistemaRpg';
import { ServiceRequestOptions } from './serviceRequestOptions';

const BASE_PATH = '/sistemas-rpg';

export const listarSistemasRpg = async (
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaRpgResumo[]> => {
  const response = await api.get<SistemaRpgResumo[]>(BASE_PATH, requestOptions);
  return response.data;
};

export const obterSistemaRpg = async (
  idSistemaRpg: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaRpg> => {
  const response = await api.get<SistemaRpg>(`${BASE_PATH}/${idSistemaRpg}`, requestOptions);
  return response.data;
};

export const criarSistemaRpg = async (
  payload: CriarSistemaRpgPayload,
): Promise<SistemaRpg> => {
  const response = await api.post<SistemaRpg>(BASE_PATH, payload);
  return response.data;
};

export const atualizarSistemaRpg = async (
  idSistemaRpg: number,
  payload: AtualizarSistemaRpgPayload,
): Promise<SistemaRpg> => {
  const response = await api.put<SistemaRpg>(`${BASE_PATH}/${idSistemaRpg}`, payload);
  return response.data;
};

export const excluirSistemaRpg = async (idSistemaRpg: number): Promise<void> => {
  await api.delete(`${BASE_PATH}/${idSistemaRpg}`);
};

export const listarVersoesSistemaRpg = async (
  idSistemaRpg: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaVersaoResumo[]> => {
  const response = await api.get<SistemaVersaoResumo[]>(
    `${BASE_PATH}/${idSistemaRpg}/versoes`,
    requestOptions,
  );
  return response.data;
};

export const obterVersaoSistemaRpg = async (
  idSistemaRpg: number,
  idSistemaVersao: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaVersaoResumo> => {
  const response = await api.get<SistemaVersaoResumo>(
    `${BASE_PATH}/${idSistemaRpg}/versoes/${idSistemaVersao}`,
    requestOptions,
  );
  return response.data;
};

export const criarVersaoSistemaRpg = async (
  idSistemaRpg: number,
  payload: CriarSistemaVersaoPayload,
): Promise<SistemaVersaoResumo> => {
  const response = await api.post<SistemaVersaoResumo>(
    `${BASE_PATH}/${idSistemaRpg}/versoes`,
    payload,
  );
  return response.data;
};

export const excluirVersaoSistemaRpg = async (
  idSistemaRpg: number,
  idSistemaVersao: number,
): Promise<void> => {
  await api.delete(`${BASE_PATH}/${idSistemaRpg}/versoes/${idSistemaVersao}`);
};

export const duplicarVersaoSistemaRpg = async (
  idSistemaVersao: number,
  payload: DuplicarSistemaVersaoPayload,
): Promise<SistemaVersaoResumo> => {
  const response = await api.post<SistemaVersaoResumo>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/duplicar`,
    payload,
  );
  return response.data;
};

export const publicarVersaoSistemaRpg = async (
  idSistemaVersao: number,
): Promise<SistemaVersaoResumo> => {
  const response = await api.post<SistemaVersaoResumo>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/publicar`,
  );
  return response.data;
};

export const obterPatchNoteSistemaRpg = async (
  idSistemaVersao: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaPatchNote> => {
  const response = await api.get<SistemaPatchNote>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/patch-note`,
    requestOptions,
  );
  return response.data;
};

export const arquivarVersaoSistemaRpg = async (
  idSistemaVersao: number,
): Promise<SistemaVersaoResumo> => {
  const response = await api.post<SistemaVersaoResumo>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/arquivar`,
  );
  return response.data;
};

export const obterConfiguracaoSistemaRpg = async <K extends SistemaModuloKey>(
  idSistemaVersao: number,
  modulo: K,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaModuloConfigMap[K]> => {
  const endpoint = SISTEMA_MODULO_ENDPOINTS[modulo];
  const response = await api.get<SistemaModuloConfigMap[K]>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/${endpoint}`,
    requestOptions,
  );
  return response.data;
};

export const atualizarConfiguracaoSistemaRpg = async <K extends SistemaModuloKey>(
  idSistemaVersao: number,
  modulo: K,
  payload: SistemaModuloConfigMap[K],
): Promise<SistemaModuloConfigMap[K]> => {
  const endpoint = SISTEMA_MODULO_ENDPOINTS[modulo];
  const response = await api.put<SistemaModuloConfigMap[K]>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/${endpoint}`,
    payload,
  );
  return response.data;
};

export const obterConfiguracaoGeralSistemaRpg = (
  idSistemaVersao: number,
  requestOptions?: ServiceRequestOptions,
): Promise<ConfiguracaoGeralSistema> => obterConfiguracaoSistemaRpg(
  idSistemaVersao,
  'geral',
  requestOptions,
);

export const obterConfiguracaoCriacaoSistemaRpg = (
  idSistemaVersao: number,
  requestOptions?: ServiceRequestOptions,
): Promise<ConfiguracaoCriacaoSistema> => obterConfiguracaoSistemaRpg(
  idSistemaVersao,
  'criacao',
  requestOptions,
);

export const obterConfiguracaoProgressaoSistemaRpg = (
  idSistemaVersao: number,
  requestOptions?: ServiceRequestOptions,
): Promise<ConfiguracaoProgressaoSistema> => obterConfiguracaoSistemaRpg(
  idSistemaVersao,
  'progressao',
  requestOptions,
);

export const obterConfiguracaoExploracaoSistemaRpg = (
  idSistemaVersao: number,
  requestOptions?: ServiceRequestOptions,
): Promise<ConfiguracaoExploracaoSistema> => obterConfiguracaoSistemaRpg(
  idSistemaVersao,
  'exploracao',
  requestOptions,
);

export const obterConfiguracaoCombateSistemaRpg = (
  idSistemaVersao: number,
  requestOptions?: ServiceRequestOptions,
): Promise<ConfiguracaoCombateSistema> => obterConfiguracaoSistemaRpg(
  idSistemaVersao,
  'combate',
  requestOptions,
);

export const obterConfiguracaoPoderesSistemaRpg = (
  idSistemaVersao: number,
  requestOptions?: ServiceRequestOptions,
): Promise<ConfiguracaoPoderesSistema> => obterConfiguracaoSistemaRpg(
  idSistemaVersao,
  'poderes',
  requestOptions,
);

export const obterConfiguracaoSobrevivenciaSistemaRpg = (
  idSistemaVersao: number,
  requestOptions?: ServiceRequestOptions,
): Promise<ConfiguracaoSobrevivenciaSistema> => obterConfiguracaoSistemaRpg(
  idSistemaVersao,
  'sobrevivencia',
  requestOptions,
);

export const obterCatalogoItensSistemaRpg = async (
  idSistemaVersao: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaItensConfig> => {
  const response = await api.get<SistemaItensConfig>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/itens`,
    requestOptions,
  );
  return response.data;
};

export const atualizarCatalogoItensSistemaRpg = async (
  idSistemaVersao: number,
  payload: SistemaItensConfig,
): Promise<SistemaItensConfig> => {
  const response = await api.put<SistemaItensConfig>(
    `${BASE_PATH}/versoes/${idSistemaVersao}/itens`,
    payload,
  );
  return response.data;
};

export const resolverSistemaRpg = async (
  idMesa?: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaResolverResult> => {
  const response = await api.get<SistemaResolverResult>(`${BASE_PATH}/resolver`, {
    params: idMesa === undefined ? undefined : { idMesa },
    ...requestOptions,
  });
  return response.data;
};

export const resolverContextoRuntimeSistemaRpg = async (
  consulta: SistemaRuntimeConsulta,
  requestOptions: ServiceRequestOptions = {},
): Promise<SistemaRuntimeContexto> => {
  const params = Object.fromEntries(
    Object.entries(consulta).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  const response = await api.get<SistemaRuntimeContexto>(`${BASE_PATH}/runtime/contexto`, {
    params,
    ...requestOptions,
  });
  return response.data;
};

export const migrarMesaParaVersaoSistemaRpg = async (
  idMesa: number,
  idSistemaVersao: number,
): Promise<SistemaResolverResult> => {
  const response = await api.post<SistemaResolverResult>(
    `${BASE_PATH}/mesas/${idMesa}/migrar`,
    { idSistemaVersao, confirmarPreservacaoValores: true },
  );
  return response.data;
};

export const obterPreviaMigracaoMesaSistemaRpg = async (
  idMesa: number,
  idSistemaVersaoDestino: number,
  requestOptions: ServiceRequestOptions = {},
): Promise<MesaMigracaoPreview> => {
  const response = await api.post<MesaMigracaoPreview>(
    `${BASE_PATH}/mesas/${idMesa}/migracao/preview`,
    { idSistemaVersaoDestino },
    requestOptions,
  );
  return response.data;
};
