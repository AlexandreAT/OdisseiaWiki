import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useSelector } from 'react-redux';
import BannerMesa from '../../../../assets/Banner Mesa.jpeg';
import { normalizeImagePath } from '../../../Wiki/utils/imagePathHelper';
import { MesaHudDecor } from '../MesaHudDecor/MesaHudDecor';
import type { MesaResumo } from '../../../../models/Mesa';
import { CardFooter, MesaCardBody, MesaCardImage, MesaCardShell, MesaMeta, Tag, TagRow } from '../../Mesas.style';
import type { MesaThemeState } from '../../MesaThemeState';

interface MesaCardProps {
  mesa: MesaResumo;
  onOpen: () => void;
}

export const MesaCard = ({ mesa, onOpen }: MesaCardProps) => {
  const { neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const isNeonActive = neon === 'on';

  return (
    <MesaCardShell
    $neon={isNeonActive}
    tabIndex={0}
    role="link"
    onClick={onOpen}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') onOpen();
    }}
  >
    <MesaHudDecor neon={isNeonActive} />
    <MesaCardImage>
      <img src={normalizeImagePath(mesa.imagem || BannerMesa)} alt={`Banner da Mesa ${mesa.nome}`} />
    </MesaCardImage>
    <MesaCardBody>
      <h3>{mesa.nome}</h3>
      <TagRow>
        {mesa.numeroVersao && <Tag $pink>{mesa.numeroVersao.startsWith('v') ? mesa.numeroVersao : `v${mesa.numeroVersao}`}</Tag>}
        <Tag>{mesa.sistemaNome || 'Sistema não informado'}</Tag>
      </TagRow>
      <p>{mesa.descricao || 'Esta Mesa ainda não possui uma descrição pública.'}</p>
      <MesaMeta>
        <span><PersonOutlineIcon /> Mestre: <strong>{mesa.mestreNome || 'Não informado'}</strong></span>
      </MesaMeta>
      <CardFooter>
        <span><GroupsOutlinedIcon /> {mesa.jogadoresAtuais} / {mesa.limiteJogadores}</span>
        <span>{mesa.vagasDisponiveis > 0 ? `${mesa.vagasDisponiveis} vagas` : 'Mesa cheia'}</span>
      </CardFooter>
    </MesaCardBody>
  </MesaCardShell>
    );
};
