import React from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePersonagem } from './usePersonagem';
import { PageContainer, TopSection, BottomSection, AvatarWrapper, MetaRow, Sections, CardContent, SubHeading, InfoList, InfoItem, MetaContent, SectionSpacer, AvatarDivController, SatusDivController, StatusList, StatusDiv, HeaderStatusController, StatusController, StatusHeader, StatusBarWrapper, StatusBarFill, PersonagemRichText, FlexRow, MutedText, BoldLabel, ItemThumb, ItemPlaceholder, GalleryToggle, GalleryContent, SkillItem, Spacer, MaskIcon, ItemRow, FlexFill, InfoControllers, TitleDiv, TagItem, TagList, RelatedLink, HistoryWrapper, HistoryModalOverlay, HistoryModalSheet, HistoryModalHeader, HistoryModalTitle, HistoryModalClose, HistoryModalContent, InfoSpan, BottomInfoLeft, BottomInfoRight, StoryWithImage, StoryImage, HudCornerEl, HudTopLine, HudBottomLine, HudLeftLine, HudRightLine, StatusTopLine, StatusBottomLine, StatusLeftLine, StatusRightLine, BackgroundVideoContainer, BackgroundVideo, BackgroundOverlay, HexagonHud, HexagonBackground, HexagonBorder, HexagonContent, HexagonValue, PageController } from './PersonagemPage.style';
import glassHeart from '../../assets/svg/glass-heart.svg';
import rollingEnergy from '../../assets/svg/rolling-energy.svg';
import electric from '../../assets/svg/electric.svg';
import upgrade from '../../assets/svg/upgrade.svg';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import { ClipBox } from '../../components/Generic/ClipBox/ClipBox';
import { AvatarIcon } from '../../components/Generic/AvatarIcon/AvatarIcon';
import TitleGlitch from '../../components/Generic/TitleGlitch/TitleGlitch';
import { getCidadeById } from '../../services/cidadesService';
import { getRacaById } from '../../services/racasService';
import { GalleryBlock } from '../Wiki/components/blocks/GalleryBlock/GalleryBlock';
import { PageBlockType } from '../../models/Pages';
import village from '../../assets/svg/village.svg';
import scales from '../../assets/svg/scales.svg';
import dna1 from '../../assets/svg/dna1.svg';
import { SpanLink } from '../../components/Generic/SpanLink/SpanLink';
import { getPersonagensByIds } from '../../services/personagensService';
import CloseIcon from '@mui/icons-material/Close';
import backgroundVideo from '../../assets/backgroundLinesScifiAnimation.mp4';

type InventarioItemProps = {
  item: any;
};

const InventarioItem: React.FC<InventarioItemProps> = ({ item }) => {
  const nomeItem = item.nome ?? item.nomeItem ?? item.titulo ?? String(item);
  const quantidade = item.quantidade ?? item.qtd ?? item.qtde ?? null;
  const imagem = item.imagem ?? item.url ?? (typeof item === 'string' ? item : undefined);

  return (
    <ItemRow>
      {imagem ? (
        <ItemThumb src={normalizeImagePath(imagem)} alt={nomeItem} />
      ) : (
        <ItemPlaceholder />
      )}
      <FlexFill>
        <BoldLabel>{nomeItem}</BoldLabel>
        {item.descricao && <MutedText>{item.descricao}</MutedText>}
      </FlexFill>
      <MutedText>{quantidade ? `x${quantidade}` : ''}</MutedText>
    </ItemRow>
  );
};

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
  const [cidadeImagem, setCidadeImagem] = React.useState<string | null>(null);
  const [racaNome, setRacaNome] = React.useState<string | null>(null);
  const [personagensVinculadosNomes, setPersonagensVinculadosNomes] = React.useState<{ id: number; nome: string }[]>([]);
  const [galleryOpen, setGalleryOpen] = React.useState(true);
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const fetchRelated = async () => {
      try {
        const idCidade = getField(personagem, ['idcidade', 'Idcidade', 'idCidade', 'idcidade']) as any;
        if (idCidade) {
          const res: any = await getCidadeById(Number(idCidade));
          const cidade = res?.cidade ?? res;
          if (mounted && cidade) {
            setCidadeNome(cidade.nome ?? null);
            setCidadeImagem(cidade.imagem ?? null);
          }
        }
        const idRaca = getField(personagem, ['idraca', 'Idraca', 'idRaca']) as any;
        
        if (idRaca) {
          const rr: any = await getRacaById(Number(idRaca));
          const raca = rr?.raca ?? rr;
          if (mounted && raca) {
            setRacaNome(raca.nome ?? null);
          }
        }

        const vinculados = (personagem as any)?.personagemsVinculados;
        if (Array.isArray(vinculados) && vinculados.length > 0) {
          const res = await getPersonagensByIds(vinculados);
          if (mounted && Array.isArray(res)) {
            const nomes = res.map((p: any) => ({
              id: Number(p.idpersonagem ?? p.id),
              nome: p.nome ?? 'Sem nome'
            }));
            setPersonagensVinculadosNomes(nomes);
          }
        }
      } catch (e) {
        // fail silently
      }
    };
    fetchRelated();
    return () => { mounted = false; };
  }, [personagem]);

  if (loading) return <div>Carregando personagem...</div>;
  if (error) return <div>Erro: {error}</div>;
  console.log("🚀 ~ PersonagemPage ~ personagem:", personagem)
  if (!personagem) return <div>Personagem não encontrado</div>;

  const nome = getField(personagem, ['nome', 'Nome']) || 'Sem nome';
  const imagem = getField(personagem, ['imagem', 'Imagem', 'imagemUrl', 'ImagemUrl']) as string | undefined;
  const historia = getField(personagem, ['historia', 'Historia']) as any | undefined;
  const alinhamento = getField(personagem, ['alinhamento', 'Alinhamento', 'alignment']);

  const costumes = (personagem as any)?.costumes;
  const costumesList = Array.isArray(costumes) && costumes.length > 0 ? costumes : null;

  const tracos = (personagem as any)?.tracos;
  const tracosList = Array.isArray(tracos) && tracos.length > 0 ? tracos : null;

  const infoExtras = (personagem as any)?.infoSecundariasJson;
  const hasInfoExtras = infoExtras && String(infoExtras).trim() !== '';

  const vinculados = (personagem as any)?.personagemsVinculados;
  const hasVinculados = Array.isArray(vinculados) && vinculados.length > 0;

  const tags = (personagem as any)?.tags;
  const tagsList = Array.isArray(tags) && tags.length > 0 ? tags : null;

  return (
    <PageContainer>
        <BackgroundVideoContainer>
          <BackgroundVideo
            src={backgroundVideo}
            autoPlay
            loop
            muted
            playsInline
          />
          <BackgroundOverlay />
        </BackgroundVideoContainer>
        <PageController>
        <ClipBox theme={theme} neon={neon} width="100%" height='auto' useClip={false} borderRadius="8px" zIndex={1}>
            <TopSection>
                <AvatarDivController>
                    <AvatarWrapper>
                        <AvatarIcon theme={theme} neon={neon} initialImage={imagem ? normalizeImagePath(imagem) : ''} size={250} clickable={false} />
                    </AvatarWrapper>

                    <CardContent maxWidth='300px' neon={neon}>
                      <HudCornerEl $position="top-left" $neon={neon === 'on'} />
                      <HudCornerEl $position="top-right" $neon={neon === 'on'} />
                      <HudCornerEl $position="bottom-left" $neon={neon === 'on'} />
                      <HudCornerEl $position="bottom-right" $neon={neon === 'on'} />
                      <HudTopLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <HudBottomLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <HudLeftLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <HudRightLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <InfoControllers>
                        <TitleDiv>
                            <TitleGlitch theme={theme} neon={neon} text={nome} fontSize="20px" />
                        </TitleDiv>
                        <MetaRow>
                            <HeaderStatusController>
                                <MetaContent as={FlexRow} gap={12} alignItems="flex-start">
                                  <FlexRow gap={8}>
                                    <MaskIcon src={dna1} color={'var(--neonBlue)'} size={20} />
                                    <BoldLabel>Raça:</BoldLabel> {racaNome ?? ((personagem as any).idraca ?? '—')}
                                  </FlexRow>
                                  <FlexRow gap={8}>
                                    <MaskIcon src={village} color={'var(--neonBlue)'} size={20} />
                                    <BoldLabel>Cidade:</BoldLabel> {cidadeNome ?? ((personagem as any).idcidade ?? '—')}
                                  </FlexRow>
                                  <FlexRow gap={8}>
                                    <MaskIcon src={scales} color={'var(--neonBlue)'} size={20} />
                                    <BoldLabel>Alinhamento:</BoldLabel> {alinhamento ?? '—'}
                                  </FlexRow>
                                </MetaContent>
                            </HeaderStatusController>
                        </MetaRow>
                      </InfoControllers>
                    </CardContent>
                </AvatarDivController>
                <SatusDivController>
                    <StatusController>
                        <TitleGlitch theme={theme} neon={neon} text={"Status"} fontSize="20px" />
                        <StatusList>
                            <StatusHeader>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <MaskIcon src={glassHeart} color={'var(--neonRed)'} size={64} />
                                  <div>
                                    <BoldLabel>Vida</BoldLabel>
                                    <MutedText>{(personagem as any)?.statusJson?.status?.vida ?? '—'} / {(personagem as any)?.statusJson?.status?.vidaMaxima ?? '—'}</MutedText>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonRed)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.vida) || 0) / (Number((personagem as any)?.statusJson?.status?.vidaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <MaskIcon src={rollingEnergy} color={neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'} size={64} />
                                  <div>
                                    <BoldLabel>Mana</BoldLabel>
                                    <MutedText>{(personagem as any)?.statusJson?.status?.mana ?? '—'} / {(personagem as any)?.statusJson?.status?.manaMaxima ?? '—'}</MutedText>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonBlue)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.mana) || 0) / (Number((personagem as any)?.statusJson?.status?.manaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                            </StatusHeader>

                            <StatusHeader>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <MaskIcon src={electric} color={'var(--neonGreen)'} size={64} />
                                  <div>
                                    <BoldLabel>Estamina</BoldLabel>
                                    <MutedText>{(personagem as any)?.statusJson?.status?.estamina ?? '—'} / {(personagem as any)?.statusJson?.status?.estaminaMaxima ?? '—'}</MutedText>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonGreen)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.estamina) || 0) / (Number((personagem as any)?.statusJson?.status?.estaminaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <MaskIcon src={upgrade} color={'var(--neonYellow)'} size={64} />
                                  <div>
                                    <BoldLabel>Xp</BoldLabel>
                                    <MutedText>{(personagem as any)?.statusJson?.nivel ?? (personagem as any)?.statusJson?.nivel ?? '—'} / {(personagem as any)?.statusJson?.xp ?? '—'}</MutedText>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonYellow)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.xp) || 0) / (Number(((personagem as any)?.statusJson?.nivel) || 1)) * 100))} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                            </StatusHeader>
                        </StatusList>
                        <HexagonHud>
                          <HexagonBackground />
                          <HexagonContent>
                            <BoldLabel>Nível</BoldLabel>
                            <HexagonValue>{(personagem as any)?.statusJson?.nivel ?? '—'}</HexagonValue>
                          </HexagonContent>
                          <HexagonBorder $neon={neon === 'on'} />
                        </HexagonHud>
                    </StatusController>
                </SatusDivController>
            </TopSection>
            <BottomSection>
                <BottomInfoLeft>
                  <CardContent gap={5} neon={neon}>
                    <HudCornerEl $position="top-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="top-right" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-right" $neon={neon === 'on'} />
                    <HudTopLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudBottomLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudLeftLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudRightLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <TitleGlitch theme={theme} neon={neon} text={"Informacoes"} fontSize="20px" />
                      {tagsList && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem>
                                  <BoldLabel>Tags:</BoldLabel>{' '}
                                  <InfoSpan>{tagsList.map((tag: string, idx: number) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span> | </span>}
                                      {tag}
                                    </React.Fragment>
                                  ))}
                                  </InfoSpan>
                                </InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}

                      {costumesList && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem>
                                  <BoldLabel>Costumes:</BoldLabel>{' '}
                                  {costumesList.map((c: string, idx: number) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span> | </span>}
                                      {c}
                                    </React.Fragment>
                                  ))}
                                </InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}

                      {hasVinculados && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem>
                                  <BoldLabel>Personagens Relacionados:</BoldLabel>{' '}
                                  {personagensVinculadosNomes.length > 0 ? (
                                    personagensVinculadosNomes.map((p, idx) => (
                                      <React.Fragment key={p.id}>
                                        {idx > 0 && <span> | </span>}
                                        <RelatedLink>
                                          <SpanLink
                                            theme={theme}
                                            neon={neon}
                                            colorScheme="bluePink"
                                            link={`/personagem/${p.id}`}
                                            textSize="14px"
                                            className="inline-link"
                                          >
                                            {p.nome}
                                          </SpanLink>
                                        </RelatedLink>
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <MutedText>Carregando...</MutedText>
                                  )}
                                </InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}

                      {tracosList && (
                        <HeaderStatusController>
                            <TagList>
                              <BoldLabel>Traços de Personalidade:</BoldLabel>
                              {tracosList.map((traco: string, idx: number) => (
                                <TagItem key={idx}>{traco}</TagItem>
                              ))}
                            </TagList>
                        </HeaderStatusController>
                      )}

                      {hasInfoExtras && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem><BoldLabel>Informações Extras:</BoldLabel> {infoExtras}</InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}
                  </CardContent>
                </BottomInfoLeft>
                <BottomInfoRight>
                  <CardContent neon={neon}>
                    <HudCornerEl $position="top-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="top-right" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-right" $neon={neon === 'on'} />
                    <HudTopLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudBottomLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudLeftLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudRightLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <TitleGlitch theme={theme} neon={neon} text={"Historia"} fontSize="20px" />
                      <StoryWithImage cityImage={cidadeImagem}>
                        <HistoryWrapper onClick={() => setHistoryModalOpen(true)}>
                          <PersonagemRichText>
                          <div className="ProseMirror">
                              <RichTextDisplay content={historia} />
                          </div>
                          </PersonagemRichText>
                        </HistoryWrapper>
                        {cidadeImagem && <StoryImage src={normalizeImagePath(cidadeImagem)} alt={cidadeNome ?? 'Cidade'} />}
                      </StoryWithImage>
                  </CardContent>
                </BottomInfoRight>
            </BottomSection>
        </ClipBox>
        </PageController>

        {historyModalOpen && historia && createPortal(
          <HistoryModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setHistoryModalOpen(false); }}>
            <HistoryModalSheet theme={theme} neon={neon}>
              <HistoryModalHeader theme={theme} neon={neon}>
                <HistoryModalTitle theme={theme} neon={neon}>História</HistoryModalTitle>
                <HistoryModalClose theme={theme} neon={neon} onClick={() => setHistoryModalOpen(false)} title="Fechar">
                  <CloseIcon />
                </HistoryModalClose>
              </HistoryModalHeader>
              <HistoryModalContent theme={theme} neon={neon}>
                <div className="ProseMirror">
                  <RichTextDisplay content={historia} />
                </div>
              </HistoryModalContent>
            </HistoryModalSheet>
          </HistoryModalOverlay>,
          document.getElementById('modal-root') || document.body
        )}

      <Sections>

            <SectionSpacer>
            </SectionSpacer>

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="12px" backgroundColor="rgba(0,0,10,0.25)">
                <CardContent neon={neon}>
                  <HudCornerEl $position="top-left" />
                  <HudCornerEl $position="top-right" />
                  <HudCornerEl $position="bottom-left" />
                  <HudCornerEl $position="bottom-right" />
                  <HudTopLine $isActive={neon === 'on'} />
                  <HudBottomLine $isActive={neon === 'on'} />
                  <HudLeftLine $isActive={neon === 'on'} />
                  <HudRightLine $isActive={neon === 'on'} />
                  <SubHeading>Itens</SubHeading>
                  {(Array.isArray((personagem as any).inventarioJson) && (personagem as any).inventarioJson.length > 0) ? (
                    (personagem as any).inventarioJson.map((it: any, idx: number) => (
                      <InventarioItem key={idx} item={it} />
                    ))
                  ) : (
                    <MutedText>Sem itens cadastrados</MutedText>
                  )}
                </CardContent>
              </ClipBox>
            </SectionSpacer>

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="12px" backgroundColor="rgba(0,0,10,0.25)">
                <CardContent neon={neon}>
                  <HudCornerEl $position="top-left" />
                  <HudCornerEl $position="top-right" />
                  <HudCornerEl $position="bottom-left" />
                  <HudCornerEl $position="bottom-right" />
                  <HudTopLine $isActive={neon === 'on'} />
                  <HudBottomLine $isActive={neon === 'on'} />
                  <HudLeftLine $isActive={neon === 'on'} />
                  <HudRightLine $isActive={neon === 'on'} />
                  <SubHeading>Habilidades</SubHeading>
                  {(Array.isArray((personagem as any).skills) && (personagem as any).skills.length > 0) ? (
                    (personagem as any).skills.map((sk: any, idx: number) => (
                      <SkillItem key={idx}>
                        <BoldLabel>{sk.nome ?? sk.titulo ?? `Habilidade ${idx + 1}`}</BoldLabel>
                        {(sk.descricao || sk.custo || sk.nivel) && (
                          <MutedText>
                            {sk.descricao ?? ''}{sk.custo ? ` • Custo: ${sk.custo}` : ''}{sk.nivel ? ` • Nível: ${sk.nivel}` : ''}
                          </MutedText>
                        )}
                      </SkillItem>
                    ))
                  ) : (
                    <MutedText>Sem habilidades registradas</MutedText>
                  )}

                  <Spacer />
                  <SubHeading>Magias</SubHeading>
                  {(Array.isArray((personagem as any).magia) && (personagem as any).magia.length > 0) ? (
                    (personagem as any).magia.map((mg: any, idx: number) => (
                      <SkillItem key={idx}>
                        <BoldLabel>{mg.nome ?? mg.titulo ?? `Magia ${idx + 1}`}</BoldLabel>
                        {(mg.descricao || mg.custo || mg.nivel) && (
                          <MutedText>
                            {mg.descricao ?? ''}{mg.custo ? ` • Custo: ${mg.custo}` : ''}{mg.nivel ? ` • Nível: ${mg.nivel}` : ''}
                          </MutedText>
                        )}
                      </SkillItem>
                    ))
                  ) : (
                    <MutedText>Sem magias registradas</MutedText>
                  )}
                </CardContent>
              </ClipBox>
            </SectionSpacer>

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="8px" backgroundColor="rgba(0,0,10,0.12)">
                <GalleryToggle onClick={() => setGalleryOpen(s => !s)}>
                  <CardContent neon={neon}>
                    <HudCornerEl $position="top-left" />
                    <HudCornerEl $position="top-right" />
                    <HudCornerEl $position="bottom-left" />
                    <HudCornerEl $position="bottom-right" />
                    <HudTopLine $isActive={neon === 'on'} />
                    <HudBottomLine $isActive={neon === 'on'} />
                    <HudLeftLine $isActive={neon === 'on'} />
                    <HudRightLine $isActive={neon === 'on'} />
                    <SubHeading>{galleryOpen ? 'Galeria ▾' : 'Galeria ▸'}</SubHeading>
                  </CardContent>
                </GalleryToggle>
                {galleryOpen && (
                  <GalleryContent>
                    {Array.isArray((personagem as any).galeriaImagem) && (personagem as any).galeriaImagem.length > 0 ? (
                      <GalleryBlock
                        block={{ tipo: PageBlockType.GALLERY, conteudo: { imagens: (personagem as any).galeriaImagem.map((u: any) => ({ url: u, legenda: '' })) }, ordem: 0 }}
                        blockIndex={0}
                        theme={theme}
                        neon={neon}
                      />
                    ) : (
                      <MutedText padding="12px">Nenhuma imagem na galeria</MutedText>
                    )}
                  </GalleryContent>
                )}
              </ClipBox>
            </SectionSpacer>
        </Sections>
    </PageContainer>
  );
};

export default PersonagemPage;