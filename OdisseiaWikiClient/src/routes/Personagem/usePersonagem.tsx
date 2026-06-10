import { useEffect, useState } from 'react';
import { getPersonagemById } from '../../services/personagensService';
import { normalizePersonagem } from '../../utils/normalizePersonagem';

export type NormalizedPersonagem = ReturnType<typeof normalizePersonagem> | {
  // fallback shape for personagensService payloads (minimal)
  id?: string | number;
  nome?: string;
  imagem?: string;
  historia?: any;
};

export const usePersonagem = (idParam?: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personagem, setPersonagem] = useState<NormalizedPersonagem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!idParam) return setLoading(false);
      setLoading(true);
      setError(null);
      try {
        const res = await getPersonagemById(String(idParam));
        // API may return payload or wrapper
        const payload = (res as any)?.personagem ?? res;
        if (payload) {
          // Build a raw object compatible with normalizePersonagem
          const raw = {
            idpersonagemJogador: (payload as any).idpersonagemJogador ?? (payload as any).idpersonagem ?? idParam,
            idusuario: (payload as any).idusuario ?? (payload as any).idusuario,
            idmesa: (payload as any).idmesa ?? (payload as any).idmesa,
            nome: (payload as any).nome ?? '',
            idraca: (payload as any).idraca ?? (payload as any).Idraca ?? undefined,
            idcidade: (payload as any).idcidade ?? (payload as any).Idcidade ?? undefined,
            historia: (payload as any).historia ?? (payload as any).Historia ?? '',
            galeriaImagem: (payload as any).galeriaImagem ?? (payload as any).GaleriaImagem ?? undefined,
            statusJson: (payload as any).statusJson ?? (payload as any).StatusJson ?? undefined,
            alinhamento: (payload as any).alinhamento ?? (payload as any).Alinhamento ?? undefined,
            tracos: (payload as any).tracos ?? (payload as any).Tracos ?? undefined,
            costumes: (payload as any).costumes ?? (payload as any).Costumes ?? undefined,
            infoSecundariasJson: (payload as any).infoSecundariasJson ?? undefined,
            imagem: (payload as any).imagem ?? (payload as any).Imagem ?? undefined,
            inventarioJson: (payload as any).inventarioJson ?? (payload as any).InventarioJson ?? undefined,
            nanites: (payload as any).nanites ?? (payload as any).Nanites ?? undefined,
            dataCriacao: (payload as any).dataCriacao ?? (payload as any).DataCriacao ?? undefined,
            skills: (payload as any).skills ?? (payload as any).Skills ?? undefined,
            magia: (payload as any).magia ?? (payload as any).Magia ?? undefined,
            personagemsVinculados: (payload as any).personagemsVinculados ?? (payload as any).PersonagemsVinculados ?? undefined,
            tags: (payload as any).tags ?? (payload as any).Tags ?? undefined,
            visivel: (payload as any).visivel ?? true,
          } as any;

          const normalized = normalizePersonagem(raw as any);
          if (!cancelled) setPersonagem(normalized as any);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Erro ao buscar personagem');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [idParam]);

  return { loading, error, personagem };
};
