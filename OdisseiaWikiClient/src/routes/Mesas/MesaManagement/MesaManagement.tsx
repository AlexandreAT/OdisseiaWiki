import CheckIcon from '@mui/icons-material/Check';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BannerMesa from '../../../assets/Banner Mesa.jpeg';
import { AnimatedBackground } from '../../../components/Generic/AnimatedBackground/AnimatedBackground';
import { ImageUploader } from '../../../components/Generic/ImageUploader/ImageUploader';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { Select } from '../../../components/Generic/Select/Select';
import { getStoredAuthUser } from '../../../services/authSession';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import type { PersonagemStatus, StatusBase } from '../../../models/PersonagemJogador';
import { CharacterSelectionCard } from '../../Hub/UserCharacters/CharacterSelectionCard/CharacterSelectionCard';
import {
  ActionButton,
  CharacterGrid,
  DisabledHint,
  EmptyState,
  FieldLabel,
  FormColumn,
  FormFooter,
  FormGrid,
  ManagementContent,
  ManagementLayout,
  ManagementSidebar,
  MesaPage,
  MesaPageLoading,
  ModalTextarea,
  PageHeader,
  RequestCard,
  SidebarButton,
  SidebarMenu,
} from '../Mesas.style';
import { MesaManagementTab, useMesaManagement } from './useMesaManagement';
import type { MesaThemeState } from '../MesaThemeState';

const tabs: Array<{ key: MesaManagementTab | 'wiki' | 'configuracoes'; label: string; icon: typeof HomeOutlinedIcon; disabled?: boolean }> = [
  { key: 'geral', label: 'Geral', icon: HomeOutlinedIcon },
  { key: 'pedidos', label: 'Pedidos', icon: PersonOutlineIcon },
  { key: 'jogadores', label: 'Jogadores', icon: GroupsOutlinedIcon },
  { key: 'personagens', label: 'Personagens', icon: PersonOutlineIcon },
  { key: 'wiki', label: 'Wiki da Mesa', icon: MenuBookOutlinedIcon, disabled: true },
  { key: 'configuracoes', label: 'Configurações', icon: SettingsOutlinedIcon, disabled: true },
];

const fallbackStatus: StatusBase = { vida: 0, vidaMaxima: 0, mana: 0, manaMaxima: 0, estamina: 0, estaminaMaxima: 0, capacidadeCarga: 0 };

const parseCharacterStatus = (raw: unknown): PersonagemStatus | null => {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return value && typeof value === 'object' ? value as PersonagemStatus : null;
  } catch { return null; }
};

const MesaManagement = () => {
  const { id } = useParams();
  const idMesa = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('aba');
  const tab: MesaManagementTab = ['pedidos', 'jogadores', 'personagens'].includes(rawTab || '') ? rawTab as MesaManagementTab : 'geral';
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const isNeonActive = neon === 'on';
  const currentUserId = Number(getStoredAuthUser()?.id);
  const state = useMesaManagement(idMesa, tab);
  const [expelUser, setExpelUser] = useState<{ id: number; name: string } | null>(null);
  const [expelReason, setExpelReason] = useState('');

  if (state.loading) {
    return (
      <>
        <AnimatedBackground type="management" skipIntro />
        <MesaPageLoading><LoadingIndicator label="Carregando mesa" /></MesaPageLoading>
      </>
    );
  }
  if (!state.mesa || !state.form) return null;

  const selectTab = (key: MesaManagementTab) => setParams(key === 'geral' ? {} : { aba: key });

  return (
    <>
      <AnimatedBackground type="management" skipIntro />
      <MesaPage $neon={isNeonActive}>
        <PageHeader $neon={isNeonActive}>
          <MesaHudDecor neon={isNeonActive} />
          <div><h1>Gerenciamento da Mesa</h1><p>{state.mesa.nome}</p></div>
          <ActionButton onClick={() => navigate(`/mesa/${idMesa}`)}><VisibilityOutlinedIcon /> Visualizar página</ActionButton>
        </PageHeader>
        <ManagementLayout>
          <ManagementSidebar $neon={isNeonActive}>
            <MesaHudDecor neon={isNeonActive} />
            <h3>Gerenciamento da Mesa</h3>
            <SidebarMenu>
              {tabs.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarButton key={item.key} $active={tab === item.key} disabled={item.disabled} onClick={() => !item.disabled && selectTab(item.key as MesaManagementTab)} title={item.disabled ? 'Recurso preparado para uma próxima etapa' : undefined}>
                    <Icon /> {item.label}{item.disabled && <DisabledHint>Em breve</DisabledHint>}
                  </SidebarButton>
                );
              })}
            </SidebarMenu>
          </ManagementSidebar>
          <ManagementContent $neon={isNeonActive}>
            <MesaHudDecor neon={isNeonActive} />
            {tab === 'geral' && (
              <FormGrid onSubmit={(event) => { event.preventDefault(); void state.save(); }}>
                <FormColumn>
                  <ImageUploader theme={theme} neon={neon} cropPreset={{ mode: 'single', aspectRatio: 16 / 9, shape: 'rectangle', displayShape: 'rectangle' }} initialImage={state.form.imagem ? normalizeImagePath(state.form.imagem) : undefined} onImageCropped={(result) => state.setBanner(result.file, result.preview)} onRemove={state.removeBanner} label="Banner da Mesa" mobileSize="full" />
                  <InputText theme={theme} neon={neon} label="Nome da Mesa" value={state.form.nome} onChange={(event) => state.updateForm('nome', event.target.value)} required width="100%" height="52px" />
                  <FieldLabel><span>Descrição</span><textarea maxLength={500} value={state.form.descricao} onChange={(event) => state.updateForm('descricao', event.target.value)} /><small>{state.form.descricao.length} / 500</small></FieldLabel>
                </FormColumn>
                <FormColumn>
                  <InputText theme={theme} neon={neon} label="Sistema (não pode ser alterado)" value={state.mesa.sistemaNome} disabled width="100%" height="52px" />
                  <Select theme={theme} neon={neon} label="Versão do Sistema" value={state.form.idSistemaVersao ?? ''} onChange={(event) => state.updateForm('idSistemaVersao', Number(event.target.value))} options={state.versions.map((version) => ({ value: version.idSistemaVersao, label: version.numeroVersao }))} width="100%" height="52px" portal />
                  <InputText theme={theme} neon={neon} type="number" label="Limite de jogadores" value={state.form.limiteJogadores} onChange={(event) => state.updateForm('limiteJogadores', Number(event.target.value))} required width="100%" height="52px" />
                  <InputText theme={theme} neon={neon} label="Tags (separadas por vírgula)" value={state.form.tags} onChange={(event) => state.updateForm('tags', event.target.value)} width="100%" height="52px" />
                  <p>Alterar a versão da Mesa não atualiza automaticamente as fichas já existentes.</p>
                </FormColumn>
                <FormFooter><ActionButton type="submit" disabled={state.saving}>{state.saving ? 'Salvando...' : 'Salvar alterações'}</ActionButton></FormFooter>
              </FormGrid>
            )}
            {tab === 'pedidos' && (
              <>
                <PageHeader $neon={isNeonActive}>
                  <MesaHudDecor neon={isNeonActive} />
                  <div><h1>Pedidos de entrada</h1><p>Gerencie quem deseja participar desta Mesa.</p></div>
                </PageHeader>
                <div>
                  {state.requests.length === 0 && <EmptyState>Nenhum pedido pendente.</EmptyState>}
                  {state.requests.map((request) => (
                    <RequestCard $neon={isNeonActive} key={request.idSolicitacao}>
                      <MesaHudDecor neon={isNeonActive} />
                      <img src={request.usuarioImagem || BannerMesa} alt="" />
                      <div><h3>{request.usuarioNome}</h3><p>{request.mensagem || 'O jogador não enviou uma mensagem.'}</p><small>Solicitado em {new Date(request.dataSolicitacao).toLocaleString('pt-BR')}</small></div>
                      <div><ActionButton $accent="green" $compact onClick={() => void state.accept(request.idSolicitacao)}><CheckIcon /> Aceitar</ActionButton> <ActionButton $accent="red" $compact onClick={() => void state.refuse(request.idSolicitacao)}><CloseIcon /> Recusar</ActionButton></div>
                    </RequestCard>
                  ))}
                </div>
              </>
            )}
            {tab === 'jogadores' && (
              <>
                <PageHeader $neon={isNeonActive}>
                  <MesaHudDecor neon={isNeonActive} />
                  <div><h1>Jogadores</h1><p>Participantes atualmente vinculados à Mesa.</p></div>
                </PageHeader>
                {state.players.length === 0 && <EmptyState>Nenhum jogador participante.</EmptyState>}
                {state.players.map((player) => (
                  <RequestCard $neon={isNeonActive} key={player.idUsuario}>
                    <MesaHudDecor neon={isNeonActive} />
                    <img src={normalizeImagePath(player.imagem || BannerMesa)} alt="" />
                    <div><h3>{player.nome}</h3><p>{player.personagens} personagem(ns) nesta Mesa.</p></div>
                    <ActionButton $accent="red" $compact onClick={() => setExpelUser({ id: player.idUsuario, name: player.nome })}>Expulsar</ActionButton>
                  </RequestCard>
                ))}
              </>
            )}
            {tab === 'personagens' && (
              <>
                <PageHeader $neon={isNeonActive}>
                  <MesaHudDecor neon={isNeonActive} />
                  <div><h1>Personagens da Mesa</h1><p>Leitura administrativa, incluindo fichas invisíveis e personagens mortos.</p></div>
                </PageHeader>
                {state.characters.length === 0 ? <EmptyState>Nenhum personagem vinculado.</EmptyState> : (
                  <CharacterGrid>{state.characters.map((entry) => {
                    const parsed = parseCharacterStatus(entry.personagem.statusJson);
                    return (
                      <CharacterSelectionCard
                        key={entry.personagem.idpersonagemJogador}
                        personagem={entry.personagem}
                        status={entry.status || parsed?.status || fallbackStatus}
                        level={entry.nivel ?? parsed?.nivel ?? 1}
                        xp={entry.xp ?? parsed?.xp ?? 0}
                        theme={theme}
                        neon={neon}
                        context="mesa-master"
                        ownerName={entry.donoNome}
                        online={entry.online}
                        onActions={currentUserId > 0 && Number(entry.idUsuarioDono ?? entry.personagem.idusuario) === currentUserId
                          ? () => navigate(`/mesa/${idMesa}/jogo?acoes=${entry.personagem.idpersonagemJogador}`)
                          : undefined}
                        onView={() => navigate(`/personagem/${entry.personagem.idpersonagemJogador}?tipo=jogador&mesaId=${idMesa}&modo=leitura`)}
                        onSheet={() => navigate(`/personagem/${entry.personagem.idpersonagemJogador}?tipo=jogador&mesaId=${idMesa}&modo=ficha`)}
                        onEdit={() => undefined}
                      />
                    );
                  })}</CharacterGrid>
                )}
              </>
            )}
          </ManagementContent>
        </ManagementLayout>
      </MesaPage>
      {expelUser && (
        <Modal title={`Expulsar ${expelUser.name}`} theme={theme} neon={neon} mobileInset onClose={() => setExpelUser(null)} onSubmit={async () => { if (await state.expel(expelUser.id, expelReason)) { setExpelUser(null); setExpelReason(''); } }}>
          <p>O personagem e os dados do jogador serão preservados. Informe o motivo da remoção.</p>
          <ModalTextarea maxLength={500} value={expelReason} onChange={(event) => setExpelReason(event.target.value)} />
          <small>{expelReason.length} / 500</small>
        </Modal>
      )}
    </>
  );
};

export default MesaManagement;
