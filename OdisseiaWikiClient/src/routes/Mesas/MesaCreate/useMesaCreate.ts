import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { SistemaRpgResumo, SistemaVersaoResumo } from '../../../models/SistemaRpg';
import { criarMesaCompleta } from '../../../services/mesaService';
import { saveAsset } from '../../../services/assetsService';
import { listarSistemasRpg, listarVersoesSistemaRpg } from '../../../services/sistemasRpgService';
import { getApiErrorMessage } from '../../../utils/apiError';

export interface MesaCreateFormState {
  nome: string;
  descricao: string;
  limiteJogadores: number;
  tags: string;
  idSistemaRpg?: number;
  idSistemaVersao?: number;
  acompanharVersaoAtual: boolean;
}

const initialForm: MesaCreateFormState = {
  nome: '', descricao: '', limiteJogadores: 4, tags: '', acompanharVersaoAtual: true,
};

export const useMesaCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [systems, setSystems] = useState<SistemaRpgResumo[]>([]);
  const [versions, setVersions] = useState<SistemaVersaoResumo[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listarSistemasRpg().then((items) => {
      const active = items.filter((item) => item.ativo);
      setSystems(active);
      if (active.length > 0) setForm((current) => ({ ...current, idSistemaRpg: active[0].idSistemaRpg }));
    }).catch((error) => toast.error(getApiErrorMessage(error, 'Não foi possível carregar os Sistemas.')));
  }, []);

  useEffect(() => {
    if (!form.idSistemaRpg) { setVersions([]); return; }
    listarVersoesSistemaRpg(form.idSistemaRpg).then((items) => {
      const published = items.filter((item) => ['Publicado', 'Published'].includes(item.status));
      setVersions(published);
      const system = systems.find((item) => item.idSistemaRpg === form.idSistemaRpg);
      const preferredId = system?.idVersaoPublicada ?? published[0]?.idSistemaVersao;
      setForm((current) => ({ ...current, idSistemaVersao: preferredId ?? current.idSistemaVersao }));
    }).catch((error) => toast.error(getApiErrorMessage(error, 'Não foi possível carregar as versões publicadas.')));
  }, [form.idSistemaRpg, systems]);

  const latestVersionId = useMemo(() => systems.find((system) => system.idSistemaRpg === form.idSistemaRpg)?.idVersaoPublicada, [form.idSistemaRpg, systems]);

  const update = <K extends keyof MesaCreateFormState>(key: K, value: MesaCreateFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    if (!form.nome.trim() || !form.idSistemaRpg || !form.idSistemaVersao) {
      toast.error('Informe o nome, o Sistema e uma versão publicada.');
      return;
    }
    if (form.limiteJogadores < 1 || form.limiteJogadores > 20) {
      toast.error('O limite deve ficar entre 1 e 20 jogadores.');
      return;
    }
    setSaving(true);
    try {
      const upload = bannerFile ? await saveAsset({ imageFile: bannerFile, type: 'mesa', entityName: form.nome }) : null;
      const mesa = await criarMesaCompleta({
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        imagem: upload?.url || upload?.path || null,
        limiteJogadores: form.limiteJogadores,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        idSistemaRpg: form.idSistemaRpg,
        idSistemaVersao: form.idSistemaVersao,
        acompanharVersaoAtual: form.acompanharVersaoAtual,
      });
      toast.success('Mesa criada com sucesso.');
      navigate(`/mesa/${mesa.idMesa}/gerenciar`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível criar a Mesa.'));
    } finally { setSaving(false); }
  };

  return {
    form, update, systems, versions, latestVersionId, saving,
    bannerPreview, setBanner: (file: File, preview: string) => { setBannerFile(file); setBannerPreview(preview); },
    removeBanner: () => { setBannerFile(null); setBannerPreview(undefined); },
    useLatest: () => latestVersionId && update('idSistemaVersao', latestVersionId),
    submit,
  };
};
