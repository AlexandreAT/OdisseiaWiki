import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AnimatedBackground } from '../../../components/Generic/AnimatedBackground/AnimatedBackground';
import { ManagementWiki } from '../../Management/ManagementWiki/ManagementWiki';
import { ActionButton, ManagementContent, MesaPage, PageHeader } from '../Mesas.style';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import type { MesaThemeState } from '../MesaThemeState';

const MesaWikiManagement = () => {
  const { id } = useParams();
  const idMesa = Number(id);
  const navigate = useNavigate();
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const neonAtivo = neon === 'on';

  return (
    <>
      <AnimatedBackground type="management" skipIntro />
      <MesaPage $neon={neonAtivo}>
        <PageHeader $neon={neonAtivo}>
          <MesaHudDecor neon={neonAtivo} />
          <div><h1>Wiki da Mesa</h1><p>Conteúdos exclusivos desta campanha.</p></div>
          <ActionButton onClick={() => navigate(`/mesa/${idMesa}`)}><ArrowBackOutlinedIcon /> Voltar para a Mesa</ActionButton>
        </PageHeader>
        <ManagementContent $neon={neonAtivo}>
          <MesaHudDecor neon={neonAtivo} />
          <ManagementWiki key={idMesa} theme={theme} neon={neon} />
        </ManagementContent>
      </MesaPage>
    </>
  );
};

export default MesaWikiManagement;
