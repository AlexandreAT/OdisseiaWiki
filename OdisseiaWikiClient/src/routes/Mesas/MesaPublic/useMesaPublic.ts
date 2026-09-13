import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { MesaPublica } from '../../../models/Mesa';
import { obterMesaPublica, solicitarEntradaMesa } from '../../../services/mesaService';
import { getApiErrorMessage } from '../../../utils/apiError';

export const useMesaPublic = (idMesa?: number) => {
  const [mesa, setMesa] = useState<MesaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!idMesa) return;
    setLoading(true);
    try { setMesa(await obterMesaPublica(idMesa)); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Não foi possível carregar esta Mesa.')); }
    finally { setLoading(false); }
  }, [idMesa]);

  useEffect(() => { void load(); }, [load]);

  const requestJoin = async (message: string) => {
    if (!idMesa) return false;
    setSending(true);
    try {
      await solicitarEntradaMesa(idMesa, message);
      toast.success('Pedido enviado ao mestre da Mesa.');
      await load();
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível enviar o pedido.'));
      return false;
    } finally { setSending(false); }
  };

  return { mesa, loading, sending, requestJoin };
};
