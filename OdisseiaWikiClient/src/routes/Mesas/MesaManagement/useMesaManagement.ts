import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type {
  MesaJogador,
  MesaPersonagemResumo,
  MesaPublica,
  MesaSolicitacaoEntrada,
} from '../../../models/Mesa';
import type { SistemaVersaoResumo } from '../../../models/SistemaRpg';
import {
  aceitarSolicitacaoMesa,
  atualizarMesaCompleta,
  expulsarJogadorMesa,
  listarJogadoresMesa,
  listarSolicitacoesMesa,
  obterMesaPublica,
  obterPersonagensMesaGerenciamento,
  recusarSolicitacaoMesa,
} from '../../../services/mesaService';
import { saveAsset } from '../../../services/assetsService';
import { listarVersoesSistemaRpg } from '../../../services/sistemasRpgService';
import { getApiErrorMessage } from '../../../utils/apiError';

export type MesaManagementTab = 'geral' | 'pedidos' | 'jogadores' | 'personagens';

export interface MesaGeneralForm {
  nome: string;
  descricao: string;
  imagem?: string;
  tags: string;
  limiteJogadores: number;
  idSistemaVersao?: number;
  acompanharVersaoAtual: boolean;
}

export const useMesaManagement = (idMesa?: number, tab: MesaManagementTab = 'geral') => {
  const [mesa, setMesa] = useState<MesaPublica | null>(null);
  const [form, setForm] = useState<MesaGeneralForm | null>(null);
  const [versions, setVersions] = useState<SistemaVersaoResumo[]>([]);
  const [requests, setRequests] = useState<MesaSolicitacaoEntrada[]>([]);
  const [players, setPlayers] = useState<MesaJogador[]>([]);
  const [characters, setCharacters] = useState<MesaPersonagemResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const loadMesa = useCallback(async () => {
    if (!idMesa) return;
    const data = await obterMesaPublica(idMesa);
    setMesa(data);
    setForm({
      nome: data.nome,
      descricao: data.descricao || '',
      imagem: data.imagem || undefined,
      tags: data.tags?.join(', ') || '',
      limiteJogadores: data.limiteJogadores,
      idSistemaVersao: data.idSistemaVersao || undefined,
      acompanharVersaoAtual: false,
    });
    if (data.idSistemaRpg) {
      const items = await listarVersoesSistemaRpg(data.idSistemaRpg);
      setVersions(items.filter((version) => ['Publicado', 'Published'].includes(version.status)));
    }
  }, [idMesa]);

  const loadTab = useCallback(async () => {
    if (!idMesa) return;
    if (tab === 'pedidos') setRequests(await listarSolicitacoesMesa(idMesa));
    if (tab === 'jogadores') setPlayers(await listarJogadoresMesa(idMesa));
    if (tab === 'personagens') setCharacters((await obterPersonagensMesaGerenciamento(idMesa)).personagens);
  }, [idMesa, tab]);

  const load = useCallback(async () => {
    setLoading(true);
    try { await Promise.all([loadMesa(), loadTab()]); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Não foi possível carregar o gerenciamento da Mesa.')); }
    finally { setLoading(false); }
  }, [loadMesa, loadTab]);

  useEffect(() => { void load(); }, [load]);

  const updateForm = <K extends keyof MesaGeneralForm>(key: K, value: MesaGeneralForm[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async () => {
    if (!idMesa || !mesa || !form?.nome.trim() || !form.idSistemaVersao) return;
    if (form.limiteJogadores < Math.max(1, mesa.jogadoresAtuais)) {
      toast.error('O limite não pode ser menor que a quantidade atual de jogadores.');
      return;
    }
    setSaving(true);
    try {
      const upload = bannerFile ? await saveAsset({ imageFile: bannerFile, type: 'mesa', entityName: form.nome }) : null;
      await atualizarMesaCompleta(idMesa, {
        nome: form.nome.trim(), descricao: form.descricao.trim(),
        imagem: upload?.url || upload?.path || form.imagem || null,
        limiteJogadores: form.limiteJogadores,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        idSistemaVersao: form.idSistemaVersao,
        acompanharVersaoAtual: form.acompanharVersaoAtual,
      });
      toast.success('Mesa atualizada. Os personagens não foram migrados automaticamente.');
      setBannerFile(null);
      await loadMesa();
    } catch (error) { toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a Mesa.')); }
    finally { setSaving(false); }
  };

  const accept = async (idRequest: number) => {
    if (!idMesa) return;
    try { await aceitarSolicitacaoMesa(idMesa, idRequest); toast.success('Jogador aceito na Mesa.'); await Promise.all([loadMesa(), loadTab()]); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Não foi possível aceitar o pedido.')); }
  };

  const refuse = async (idRequest: number) => {
    if (!idMesa) return;
    try { await recusarSolicitacaoMesa(idMesa, idRequest); toast.success('Pedido recusado.'); await loadTab(); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Não foi possível recusar o pedido.')); }
  };

  const expel = async (idUser: number, reason: string) => {
    if (!idMesa || !reason.trim()) { toast.error('Informe o motivo da expulsão.'); return false; }
    try { await expulsarJogadorMesa(idMesa, idUser, reason.trim()); toast.success('Jogador removido da Mesa.'); await Promise.all([loadMesa(), loadTab()]); return true; }
    catch (error) { toast.error(getApiErrorMessage(error, 'Não foi possível remover o jogador.')); return false; }
  };

  return {
    mesa, form, versions, requests, players, characters, loading, saving,
    updateForm,
    setBanner: (file: File, preview: string) => { setBannerFile(file); updateForm('imagem', preview); },
    removeBanner: () => { setBannerFile(null); updateForm('imagem', undefined); },
    save, accept, refuse, expel,
  };
};
