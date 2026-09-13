import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import BannerMesa from '../../../assets/Banner Mesa.jpeg';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { OdisseiaAnimatedTitle } from '../../../components/Generic/OdisseiaAnimatedTitle/OdisseiaAnimatedTitle';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import {
  ActionButton,
  HeaderActions,
  MasterLine,
  MesaPageLoading,
  MesaPublicBackdrop,
  MesaPublicPage,
  ModalTextarea,
  PublicBanner,
  PublicBannerTitle,
  PublicContent,
  PublicHero,
  StatBox,
  StatGrid,
  Tag,
  TagRow,
} from '../Mesas.style';
import { useMesaPublic } from './useMesaPublic';
import type { MesaThemeState } from '../MesaThemeState';

const MesaPublic = () => {
  const { id } = useParams();
  const idMesa = Number(id);
  const navigate = useNavigate();
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const { mesa, loading, sending, requestJoin } = useMesaPublic(idMesa);
  const [joinOpen, setJoinOpen] = useState(false);
  const [message, setMessage] = useState('');

  if (loading) return <MesaPageLoading><LoadingIndicator label="Carregando Mesa" /></MesaPageLoading>;
  if (!mesa) return null;

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
      return null;
    }
  })();
  const isNeonActive = neon === 'on';
  const bannerImage = normalizeImagePath(mesa.imagem || BannerMesa);

  const submitRequest = async () => {
    if (await requestJoin(message)) {
      setJoinOpen(false);
      setMessage('');
    }
  };

  return (
    <>
      <MesaPublicBackdrop $backgroundImage={bannerImage} aria-hidden="true" />
      <MesaPublicPage>
        <PublicHero $neon={isNeonActive}>
          <MesaHudDecor neon={isNeonActive} />
          <PublicBanner>
            <img src={bannerImage} alt={`Banner da Mesa ${mesa.nome}`} />
            <PublicBannerTitle>
              <OdisseiaAnimatedTitle key={mesa.nome} theme={theme} neon={neon} text={mesa.nome} />
              <TagRow>
                {mesa.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </TagRow>
            </PublicBannerTitle>
          </PublicBanner>

          <PublicContent>
            <MasterLine>
              <span><PersonOutlineIcon /> Mestre: <strong>{mesa.mestreNome}</strong></span>
              <span><AccountTreeOutlinedIcon /> Sistema: <strong>{mesa.sistemaNome}</strong></span>
              {mesa.numeroVersao && <span><NewReleasesOutlinedIcon /> Versão: <strong>{mesa.numeroVersao}</strong></span>}
            </MasterLine>
            <p>{mesa.descricao || 'Esta Mesa ainda não possui uma descrição pública.'}</p>
            <StatGrid>
              <StatBox $accent="blue" $neon={isNeonActive}>
                <MesaHudDecor neon={isNeonActive} />
                <GroupsOutlinedIcon />
                <div><small>Jogadores</small><strong>{mesa.jogadoresAtuais} / {mesa.limiteJogadores}</strong></div>
              </StatBox>
              <StatBox $accent="green" $neon={isNeonActive}>
                <MesaHudDecor neon={isNeonActive} color="var(--clearneonGreen)" />
                <PersonAddAltOutlinedIcon />
                <div><small>Vagas disponíveis</small><strong>{mesa.vagasDisponiveis}</strong></div>
              </StatBox>
              <StatBox $accent="violet" $neon={isNeonActive}>
                <MesaHudDecor neon={isNeonActive} color="var(--clearneonViolet)" />
                <AccountTreeOutlinedIcon />
                <div><small>Sistema</small><strong>{mesa.sistemaNome}</strong></div>
              </StatBox>
              <StatBox $accent="pink" $neon={isNeonActive}>
                <MesaHudDecor neon={isNeonActive} color="var(--clearneonPink)" />
                <MenuBookOutlinedIcon />
                <div><small>Wiki da Mesa</small><strong>Em breve</strong></div>
              </StatBox>
            </StatGrid>
            <HeaderActions>
              <ActionButton disabled title="A Wiki própria da Mesa será disponibilizada em uma próxima etapa"><MenuBookOutlinedIcon /> Ver Wiki da Mesa</ActionButton>
              {mesa.papelUsuario === 'Mestre' && <ActionButton onClick={() => navigate(`/mesa/${mesa.idMesa}/gerenciar`)}><SettingsOutlinedIcon /> Gerenciar Mesa</ActionButton>}
              {mesa.papelUsuario === 'Participante' && <ActionButton onClick={() => navigate(`/mesa/${mesa.idMesa}/jogo`)}><GroupsOutlinedIcon /> Entrar na Mesa</ActionButton>}
              {mesa.solicitacaoPendente && <ActionButton disabled $accent="pink"><PersonAddAltOutlinedIcon /> Pedido pendente</ActionButton>}
              {mesa.podeSolicitarEntrada && !mesa.solicitacaoPendente && (
                <ActionButton $accent="pink" onClick={() => user ? setJoinOpen(true) : navigate('/login')}><PersonAddAltOutlinedIcon /> Pedir para participar</ActionButton>
              )}
              {mesa.lotada && mesa.papelUsuario === 'Visitante' && <ActionButton disabled $accent="pink">Mesa lotada</ActionButton>}
            </HeaderActions>
          </PublicContent>
        </PublicHero>
      </MesaPublicPage>
      {joinOpen && (
        <Modal
          title={`Pedir entrada em ${mesa.nome}`}
          theme={theme}
          neon={neon}
          mobileInset
          onClose={() => setJoinOpen(false)}
          onSubmit={() => void submitRequest()}
        >
          <p>Você pode enviar uma mensagem curta ao mestre. Este campo é opcional.</p>
          <ModalTextarea maxLength={200} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Conte um pouco sobre você..." disabled={sending} />
          <small>{message.length} / 200</small>
        </Modal>
      )}
    </>
  );
};

export default MesaPublic;
