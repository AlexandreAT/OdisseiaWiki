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
          const minimal = {
            id: payload.idpersonagem ?? idParam,
            nome: payload.nome,
            imagem: payload.imagem,
            historia: payload.historia,
          };
          if (!cancelled) setPersonagem(minimal);
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
