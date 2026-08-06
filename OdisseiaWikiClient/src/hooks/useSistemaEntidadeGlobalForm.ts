import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../axios/api';
import {
  SistemaEntidadeGlobalTipo,
  SistemaItemEscopoRuntime,
  SistemaRpgResumo,
  SistemaRuntimeContexto,
  SistemaVersaoResumo,
  getSistemaVersaoStatusLabel,
} from '../models/SistemaRpg';
import { listarSistemasRpg, listarVersoesSistemaRpg } from '../services/sistemasRpgService';
import { getApiErrorMessage } from '../utils/apiError';
import { useSistemaRuntimeContexto } from './useSistemaRuntimeContexto';

export interface SistemaEntidadeGlobalVinculoForm {
  idSistemaRpg: number | null;
  idSistemaVersao: number | null;
  acompanharPublicacaoAtual: boolean;
}

interface UseSistemaEntidadeGlobalFormOptions {
  tipoEntidade: SistemaEntidadeGlobalTipo;
  idEntidade?: string;
  idRaca?: number;
  initialValue?: Partial<SistemaEntidadeGlobalVinculoForm>;
  codigoTipoItem?: string;
  codigoCategoriaItem?: string;
  codigoArquetipoItem?: string;
}

const isPublished = (version: SistemaVersaoResumo) => (
  getSistemaVersaoStatusLabel(version.status) === 'Publicado'
);

export const useSistemaEntidadeGlobalForm = ({
  tipoEntidade,
  idEntidade,
  idRaca,
  initialValue,
  codigoTipoItem,
  codigoCategoriaItem,
  codigoArquetipoItem,
}: UseSistemaEntidadeGlobalFormOptions) => {
  const [vinculo, setVinculoState] = useState<SistemaEntidadeGlobalVinculoForm>({
    idSistemaRpg: initialValue?.idSistemaRpg ?? null,
    idSistemaVersao: initialValue?.idSistemaVersao ?? null,
    acompanharPublicacaoAtual: initialValue?.acompanharPublicacaoAtual ?? true,
  });
  const [preservedFixedVersionId, setPreservedFixedVersionId] = useState<number | null>(
    initialValue?.idSistemaVersao ?? null,
  );
  const [systems, setSystems] = useState<SistemaRpgResumo[]>([]);
  const [versions, setVersions] = useState<SistemaVersaoResumo[]>([]);
  const [catalogTypes, setCatalogTypes] = useState<SistemaItemEscopoRuntime[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const runtime = useSistemaRuntimeContexto({
    tipoEntidade,
    idEntidade,
    idRaca,
    codigoTipoItem,
    codigoCategoriaItem,
    codigoArquetipoItem,
  });

  const effectiveSystemId = vinculo.idSistemaRpg ?? runtime.contexto?.idSistemaRpg ?? null;
  const selectedSystem = systems.find((system) => system.idSistemaRpg === effectiveSystemId) ?? null;

  const setVinculo = useCallback((next: Partial<SistemaEntidadeGlobalVinculoForm>) => {
    setVinculoState((current) => ({ ...current, ...next }));
  }, []);

  const hydrateVinculo = useCallback((next?: Partial<SistemaEntidadeGlobalVinculoForm>) => {
    setPreservedFixedVersionId(next?.idSistemaVersao ?? null);
    setVinculoState({
      idSistemaRpg: next?.idSistemaRpg ?? null,
      idSistemaVersao: next?.idSistemaVersao ?? null,
      acompanharPublicacaoAtual: next?.acompanharPublicacaoAtual ?? true,
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingOptions(true);
    listarSistemasRpg({ signal: controller.signal })
      .then((result) => setSystems(result))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setOptionsError(getApiErrorMessage(error, 'Não foi possível carregar os Sistemas disponíveis.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOptions(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!effectiveSystemId) {
      setVersions([]);
      return undefined;
    }

    const controller = new AbortController();
    listarVersoesSistemaRpg(effectiveSystemId, { signal: controller.signal })
      .then(setVersions)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setOptionsError(getApiErrorMessage(error, 'Não foi possível carregar as versões publicadas.'));
        }
      });
    return () => controller.abort();
  }, [effectiveSystemId]);

  const allowedVersions = useMemo(() => versions.filter((version) => (
    isPublished(version) || version.idSistemaVersao === preservedFixedVersionId
  )), [preservedFixedVersionId, versions]);

  const effectiveVersionId = useMemo(() => {
    if (!vinculo.acompanharPublicacaoAtual) return vinculo.idSistemaVersao;
    return selectedSystem?.idVersaoPublicada ?? runtime.contexto?.idSistemaVersao ?? null;
  }, [runtime.contexto?.idSistemaVersao, selectedSystem?.idVersaoPublicada, vinculo]);

  useEffect(() => {
    if (tipoEntidade !== 'Item') return undefined;
    if (!effectiveVersionId) {
      setCatalogTypes(runtime.contexto?.itens?.tipos ?? []);
      return undefined;
    }

    const controller = new AbortController();
    api.get<{ tipos: SistemaItemEscopoRuntime[] }>(
      `/sistemas-rpg/versoes/${effectiveVersionId}/itens`,
      { signal: controller.signal },
    )
      .then((response) => setCatalogTypes(response.data?.tipos ?? []))
      .catch(() => {
        if (!controller.signal.aborted) setCatalogTypes(runtime.contexto?.itens?.tipos ?? []);
      });
    return () => controller.abort();
  }, [effectiveVersionId, runtime.contexto?.itens?.tipos, tipoEntidade]);

  const selectSystem = useCallback((idSistemaRpg: number | null) => {
    setVinculoState((current) => ({
      ...current,
      idSistemaRpg,
      idSistemaVersao: null,
    }));
  }, []);

  const toggleFollowCurrent = useCallback((follow: boolean) => {
    setVinculoState((current) => {
      const publishedVersion = systems
        .find((system) => system.idSistemaRpg === (current.idSistemaRpg ?? effectiveSystemId))
        ?.idVersaoPublicada ?? null;
      return {
        ...current,
        acompanharPublicacaoAtual: follow,
        idSistemaVersao: follow ? null : (current.idSistemaVersao ?? publishedVersion),
      };
    });
  }, [effectiveSystemId, systems]);

  const displayContext = useMemo<SistemaRuntimeContexto | null>(() => {
    const base = runtime.contexto;
    if (!base) return null;
    const selectedVersion = versions.find((version) => version.idSistemaVersao === effectiveVersionId);
    return {
      ...base,
      idSistemaRpg: effectiveSystemId,
      idSistemaVersao: effectiveVersionId,
      codigoSistema: selectedSystem?.codigo ?? base.codigoSistema,
      nomeSistema: selectedSystem?.nome ?? base.nomeSistema,
      numeroVersao: selectedVersion?.numeroVersao ?? base.numeroVersao,
      statusVersao: selectedVersion?.status ?? base.statusVersao,
      origem: base.usaFallbackLegado
        ? base.origem
        : (vinculo.acompanharPublicacaoAtual ? 'PublicacaoAtualEntidade' : 'VersaoFixadaEntidade'),
      acompanhaPublicacaoAtual: vinculo.acompanharPublicacaoAtual,
      idVersaoFixada: vinculo.acompanharPublicacaoAtual ? null : effectiveVersionId,
    };
  }, [effectiveSystemId, effectiveVersionId, runtime.contexto, selectedSystem, versions, vinculo.acompanharPublicacaoAtual]);

  return {
    vinculo,
    setVinculo,
    hydrateVinculo,
    systems,
    versions: allowedVersions,
    effectiveSystemId,
    effectiveVersionId,
    contexto: displayContext,
    catalogTypes: catalogTypes.length > 0 ? catalogTypes : (runtime.contexto?.itens?.tipos ?? []),
    loading: runtime.loading || loadingOptions,
    error: runtime.error ?? optionsError,
    reload: runtime.reload,
    selectSystem,
    toggleFollowCurrent,
  };
};

export type SistemaEntidadeGlobalFormState = ReturnType<typeof useSistemaEntidadeGlobalForm>;
