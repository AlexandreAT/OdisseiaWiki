import AddIcon from '@mui/icons-material/Add';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from 'react-router-dom';
import BannerMesa from '../../../assets/Banner Mesa.jpeg';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { MesaPagination } from '../../Mesas/components/MesaPagination/MesaPagination';
import { MesaHudDecor } from '../../Mesas/components/MesaHudDecor/MesaHudDecor';
import {
  ActionButton,
  EmptyState,
  HeaderActions,
  MesaPage,
  MesaPageLoading,
  MesaMeta,
  MesaRow,
  MesaRowActions,
  MesaRowBody,
  MesaRowImage,
  Section,
  SectionTitle,
  TableList,
} from '../../Mesas/Mesas.style';
import { useUserTables } from './useUserTables';

interface UserTablesProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const UserTables = ({ neon }: UserTablesProps) => {
  const navigate = useNavigate();
  const {
    data,
    loading,
    createdPage,
    participatingPage,
    setCreatedPage,
    setParticipatingPage,
  } = useUserTables();

  if (loading) return <MesaPageLoading><LoadingIndicator label="Carregando Mesas" /></MesaPageLoading>;

  const renderList = (items: typeof data.criadas.itens, owned: boolean) => (
    <TableList>
      {items.length === 0 && (
        <EmptyState><GroupsOutlinedIcon />{owned ? 'Você ainda não criou uma Mesa.' : 'Você ainda não participa de outra Mesa.'}</EmptyState>
      )}
      {items.map((mesa) => (
        <MesaRow $neon={neon === 'on'} key={mesa.idMesa} onClick={() => navigate(owned ? `/mesa/${mesa.idMesa}/gerenciar` : `/mesa/${mesa.idMesa}/jogo`)}>
          <MesaHudDecor neon={neon === 'on'} />
          <MesaRowImage><img src={normalizeImagePath(mesa.imagem || BannerMesa)} alt="" /></MesaRowImage>
          <MesaRowBody>
            <h3>{mesa.nome}</h3>
            <p>{mesa.descricao || 'Sem descrição cadastrada.'}</p>
            <MesaMeta>
              <span>Sistema: <strong>{mesa.sistemaNome}</strong></span>
              {mesa.numeroVersao && <span>Versão: <strong>{mesa.numeroVersao}</strong></span>}
              <span>Mestre: <strong>{mesa.mestreNome}</strong></span>
              <span>Jogadores: <strong>{mesa.jogadoresAtuais} / {mesa.limiteJogadores}</strong></span>
            </MesaMeta>
          </MesaRowBody>
          <MesaRowActions onClick={(event) => event.stopPropagation()}>
            {owned ? (
              <>
                {Boolean(mesa.solicitacoesPendentes) && (
                  <ActionButton $compact $accent="pink" onClick={() => navigate(`/mesa/${mesa.idMesa}/gerenciar?aba=pedidos`)}>
                    <GroupsOutlinedIcon /> {mesa.solicitacoesPendentes}
                  </ActionButton>
                )}
                <ActionButton $compact onClick={() => navigate(`/mesa/${mesa.idMesa}/gerenciar`)}><SettingsOutlinedIcon /> Gerenciar</ActionButton>
                <ActionButton $compact onClick={() => navigate(`/mesa/${mesa.idMesa}/jogo`)}><VisibilityOutlinedIcon /> Entrar</ActionButton>
              </>
            ) : (
              <ActionButton $compact onClick={() => navigate(`/mesa/${mesa.idMesa}/jogo`)}><VisibilityOutlinedIcon /> Entrar</ActionButton>
            )}
          </MesaRowActions>
        </MesaRow>
      ))}
    </TableList>
  );

  return (
    <MesaPage $neon={neon === 'on'} aria-label="Gerenciamento de Mesas">
      <header className="mesa-hub-header">
        <MesaHudDecor neon={neon === 'on'} />
        <div className="mesa-hub-copy">
          <p className="mesa-hub-kicker">RPG ONLINE</p>
          <h1>Gerenciamento de Mesas</h1>
          <p>Crie campanhas, acompanhe seus jogadores e entre nas Mesas das quais participa.</p>
        </div>
        <HeaderActions className="mesa-hub-actions">
          <ActionButton type="button" onClick={() => navigate('/mesas/pesquisar')}><ManageSearchIcon /> Pesquisar Mesa</ActionButton>
          <ActionButton type="button" $accent="pink" onClick={() => navigate('/mesas/nova')}><AddIcon /> Criar nova Mesa</ActionButton>
        </HeaderActions>
      </header>
      <Section>
        <SectionTitle $neon={neon === 'on'}>
          <MesaHudDecor neon={neon === 'on'} />
          <h2>Minhas Mesas criadas</h2>
        </SectionTitle>
        {renderList(data.criadas.itens, true)}
        <MesaPagination page={createdPage} totalPages={data.criadas.totalPaginas} onChange={setCreatedPage} />
      </Section>
      <Section>
        <SectionTitle $neon={neon === 'on'}>
          <MesaHudDecor neon={neon === 'on'} />
          <h2>Mesas que participo</h2>
        </SectionTitle>
        {renderList(data.participando.itens, false)}
        <MesaPagination page={participatingPage} totalPages={data.participando.totalPaginas} onChange={setParticipatingPage} />
      </Section>
    </MesaPage>
  );
};
