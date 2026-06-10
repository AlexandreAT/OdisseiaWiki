import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePersonagem } from './usePersonagem';
import { PageContainer, LeftColumn, RightColumn, AvatarWrapper, TitleRow, MetaRow, Sections, CardContent, Heading, SubHeading, InfoList, InfoItem, MetaContent, SectionSpacer } from './PersonagemPage.style';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import { PersonagemRichText } from './PersonagemPage.style';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import { ClipBox } from '../../components/Generic/ClipBox/ClipBox';
import { AvatarIcon } from '../../components/Generic/AvatarIcon/AvatarIcon';
import TitleGlitch from '../../components/Generic/TitleGlitch/TitleGlitch';
import { LabelInfoBox } from '../../components/Generic/LabelInfoBox/LabelInfoBox';
import { getCidadeById } from '../../services/cidadesService';
import { getRacaById } from '../../services/racasService';

const PersonagemPage: React.FC = () => {
  const params = useParams();
  const id = params.id;
  const { loading, error, personagem } = usePersonagem(id);
  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  const getField = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && String(v).toString().trim() !== '') return v;
    }
    return undefined;
  };

  const [cidadeNome, setCidadeNome] = React.useState<string | null>(null);
  const [racaNome, setRacaNome] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchRelated = async () => {
      try {
        const idCidade = getField(personagem, ['idcidade', 'Idcidade', 'idCidade', 'idcidade']) as any;
        if (idCidade) {
          const res = await getCidadeById(Number(idCidade));
          if (mounted && res && res.cidade) {
            setCidadeNome(res.cidade.nome ?? null);
          }
        }
        const idRaca = getField(personagem, ['idraca', 'Idraca', 'idRaca']) as any;
        
        if (idRaca) {
          const rr = await getRacaById(Number(idRaca));
          if (mounted && rr && rr.raca) {
            setRacaNome(rr.raca.nome ?? null);
          }
        }
      } catch (e) {
        // fail silently; keep names null
      }
    };
    fetchRelated();
    return () => { mounted = false; };
  }, [personagem]);

  if (loading) return <div>Carregando personagem...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!personagem) return <div>Personagem não encontrado</div>;

  const nome = getField(personagem, ['nome', 'Nome']) || 'Sem nome';
  const imagem = getField(personagem, ['imagem', 'Imagem', 'imagemUrl', 'ImagemUrl']) as string | undefined;
  const historia = getField(personagem, ['historia', 'Historia']) as any | undefined;
  const idVal = getField(personagem, ['idpersonagem', 'Idpersonagem', 'id', 'Id']) || id;

  return (
    <PageContainer>
      <LeftColumn>
        <ClipBox theme={theme} neon={neon} width="240px" useClip borderRadius="8px" zIndex={1}>
          <AvatarWrapper>
            <AvatarIcon theme={theme} neon={neon} initialImage={imagem ? normalizeImagePath(imagem) : ''} size={180} clickable={false} />
          </AvatarWrapper>

          <CardContent>
            <TitleRow>
              <TitleGlitch theme={theme} neon={neon} text={nome} fontSize="20px" />
            </TitleRow>
            <MetaRow>
              <LabelInfoBox theme={theme} neon={neon}>
                <MetaContent>Personagem • ID {idVal}</MetaContent>
              </LabelInfoBox>
            </MetaRow>
          </CardContent>
        </ClipBox>
      </LeftColumn>
      <RightColumn>
        <Sections>
            <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="16px" backgroundColor="rgba(0,0,10,0.35)">
              <CardContent>
                <Heading>História</Heading>
                <PersonagemRichText>
                  <div className="ProseMirror">
                    <RichTextDisplay content={historia} />
                  </div>
                </PersonagemRichText>
              </CardContent>
            </ClipBox>

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="16px" backgroundColor="rgba(0,0,10,0.35)">
                <CardContent>
                  <SubHeading>Informações</SubHeading>
                  <InfoList>
                    <InfoItem>Raça: {racaNome ?? ((personagem as any).idraca ?? '—')}</InfoItem>
                    <InfoItem>Cidade: {cidadeNome ?? ((personagem as any).idcidade ?? '—')}</InfoItem>
                    <InfoItem>Tags: {Array.isArray((personagem as any).tags) && (personagem as any).tags.length ? (personagem as any).tags.join(', ') : '—'}</InfoItem>
                  </InfoList>
                </CardContent>
              </ClipBox>
            </SectionSpacer>

            {/* debug block removed */}
        </Sections>
      </RightColumn>
    </PageContainer>
  );
};

export default PersonagemPage;
