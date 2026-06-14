import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePersonagem } from './usePersonagem';
import { PageContainer, TopSection, BottomSection, AvatarWrapper, TitleRow, MetaRow, Sections, CardContent, Heading, SubHeading, InfoList, InfoItem, MetaContent, SectionSpacer, AvatarDivController, SatusDivController, StatusList, StatusDiv, HeaderStatusController, StatusController, StatusHeader, StatusBarWrapper, StatusBarFill } from './PersonagemPage.style';
import glassHeart from '../../assets/svg/glass-heart.svg';
import rollingEnergy from '../../assets/svg/rolling-energy.svg';
import electric from '../../assets/svg/electric.svg';
import upgrade from '../../assets/svg/upgrade.svg';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import { PersonagemRichText } from './PersonagemPage.style';
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

type InventarioItemProps = {
  item: any;
};

const InventarioItem: React.FC<InventarioItemProps> = ({ item }) => {
  const nomeItem = item.nome ?? item.nomeItem ?? item.titulo ?? String(item);
  const quantidade = item.quantidade ?? item.qtd ?? item.qtde ?? null;
  const imagem = item.imagem ?? item.url ?? (typeof item === 'string' ? item : undefined);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
      {imagem ? (
        <img src={normalizeImagePath(imagem)} alt={nomeItem} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{nomeItem}</div>
        {item.descricao && <div style={{ fontSize: 13, color: 'var(--muted, #cfcfcf)' }}>{item.descricao}</div>}
      </div>
      <div style={{ color: 'var(--muted, #cfcfcf)' }}>{quantidade ? `x${quantidade}` : ''}</div>
    </div>
  );
};

type StatusIconProps = {
  src: string;
  color?: string;
  size?: number;
  alt?: string;
};

const StatusIcon: React.FC<StatusIconProps> = ({ src, color = 'currentColor', size = 64, alt }) => {
  const px = typeof size === 'number' ? `${size}px` : String(size);
  const style: React.CSSProperties = {
    width: px,
    height: px,
    display: 'inline-block',
    backgroundColor: color,
    WebkitMaskImage: `url("${src}")`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskImage: `url("${src}")`,
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
    maskPosition: 'center',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  };

  return <div role="img" aria-label={alt} style={style} />;
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
  const [racaNome, setRacaNome] = React.useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = React.useState(true);

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
        console.log("🚀 ~ fetchRelated ~ personagem:", personagem)
        
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
  const alinhamento = getField(personagem, ['alinhamento', 'Alinhamento', 'alignment']);
  const idVal = getField(personagem, ['idpersonagem', 'Idpersonagem', 'id', 'Id']) || id;

  return (
    <PageContainer>
        <ClipBox theme={theme} neon={neon} width='100%' height='100vh' useClip borderRadius="8px" zIndex={1}>
            <TopSection>
                <AvatarDivController>
                    <AvatarWrapper>
                        <AvatarIcon theme={theme} neon={neon} initialImage={imagem ? normalizeImagePath(imagem) : ''} size={250} clickable={false} />
                    </AvatarWrapper>

                    <CardContent>
                        <TitleRow>
                            <TitleGlitch theme={theme} neon={neon} text={nome} fontSize="20px" />
                        </TitleRow>
                        <MetaRow>
                            <HeaderStatusController>
                                <MetaContent>Personagem • ID {idVal}</MetaContent>
                                <MetaContent style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div>Raça: {racaNome ?? ((personagem as any).idraca ?? '—')}</div>
                                    <StatusIcon src={dna1} color={'var(--clearneonBlue)'} size={20} alt="raça" />
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div>Cidade: {cidadeNome ?? ((personagem as any).idcidade ?? '—')}</div>
                                    <StatusIcon src={village} color={'var(--clearneonBlue)'} size={20} alt="cidade" />
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div>Alinhamento: {alinhamento ?? '—'}</div>
                                    <StatusIcon src={scales} color={'var(--clearneonBlue)'} size={20} alt="alinhamento" />
                                  </div>
                                </MetaContent>
                            </HeaderStatusController>
                        </MetaRow>
                    </CardContent>
                </AvatarDivController>
                <SatusDivController>
                    <StatusController>
                        <TitleGlitch theme={theme} neon={neon} text={"Status"} fontSize="20px" />
                        <StatusList>
                            <StatusHeader>
                                <StatusDiv>
                                  <StatusIcon src={glassHeart} color={'var(--neonRed)'} size={64} alt="vida" />
                                  <div>
                                    <div style={{ fontWeight: 700 }}>Vida</div>
                                    <div style={{ color: 'var(--muted, #cfcfcf)' }}>{(personagem as any)?.statusJson?.status?.vida ?? '—'} / {(personagem as any)?.statusJson?.status?.vidaMaxima ?? '—'}</div>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonRed)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.vida) || 0) / (Number((personagem as any)?.statusJson?.status?.vidaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                                <StatusDiv>
                                  <StatusIcon src={rollingEnergy} color={'var(--neonBlue)'} size={64} alt="mana" />
                                  <div>
                                    <div style={{ fontWeight: 700 }}>Mana</div>
                                    <div style={{ color: 'var(--muted, #cfcfcf)' }}>{(personagem as any)?.statusJson?.status?.mana ?? '—'} / {(personagem as any)?.statusJson?.status?.manaMaxima ?? '—'}</div>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonBlue)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.mana) || 0) / (Number((personagem as any)?.statusJson?.status?.manaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                            </StatusHeader>

                            <StatusHeader>
                                <StatusDiv>
                                  <StatusIcon src={electric} color={'var(--neonGreen)'} size={64} alt="estamina" />
                                  <div>
                                    <div style={{ fontWeight: 700 }}>Estamina</div>
                                    <div style={{ color: 'var(--muted, #cfcfcf)' }}>{(personagem as any)?.statusJson?.status?.estamina ?? '—'} / {(personagem as any)?.statusJson?.status?.estaminaMaxima ?? '—'}</div>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonGreen)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.estamina) || 0) / (Number((personagem as any)?.statusJson?.status?.estaminaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                                <StatusDiv>
                                  <StatusIcon src={upgrade} color={'var(--neonYellow)'} size={64} alt="xp" />
                                  <div>
                                    <div style={{ fontWeight: 700 }}>Xp</div>
                                    <div style={{ color: 'var(--muted, #cfcfcf)' }}>{(personagem as any)?.statusJson?.nivel ?? (personagem as any)?.statusJson?.nivel ?? '—'} / {(personagem as any)?.statusJson?.xp ?? '—'}</div>
                                    <StatusBarWrapper>
                                      <StatusBarFill $color={'var(--neonYellow)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.xp) || 0) / (Number(((personagem as any)?.statusJson?.nivel) || 1)) * 100))} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                            </StatusHeader>
                        </StatusList>
                    </StatusController>
                </SatusDivController>
            </TopSection>
            <BottomSection>
                <CardContent>
                    <SubHeading>Informações</SubHeading>
                    <InfoList>
                        <InfoItem>Tags: {Array.isArray((personagem as any).tags) && (personagem as any).tags.length ? (personagem as any).tags.join(', ') : '—'}</InfoItem>
                    </InfoList>
                </CardContent>
                <CardContent>
                    <Heading>História</Heading>
                    <PersonagemRichText>
                    <div className="ProseMirror">
                        <RichTextDisplay content={historia} />
                    </div>
                    </PersonagemRichText>
                </CardContent>
            </BottomSection>
        </ClipBox>

      <Sections>

            <SectionSpacer>
            </SectionSpacer>

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="12px" backgroundColor="rgba(0,0,10,0.25)">
                <CardContent>
                  <SubHeading>Itens</SubHeading>
                  {(Array.isArray((personagem as any).inventarioJson) && (personagem as any).inventarioJson.length > 0) ? (
                    (personagem as any).inventarioJson.map((it: any, idx: number) => (
                      <InventarioItem key={idx} item={it} />
                    ))
                  ) : (
                    <div style={{ color: 'var(--muted, #cfcfcf)' }}>Sem itens cadastrados</div>
                  )}
                </CardContent>
              </ClipBox>
            </SectionSpacer>

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="12px" backgroundColor="rgba(0,0,10,0.25)">
                <CardContent>
                  <SubHeading>Habilidades</SubHeading>
                  {(Array.isArray((personagem as any).skills) && (personagem as any).skills.length > 0) ? (
                    (personagem as any).skills.map((sk: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{sk.nome ?? sk.titulo ?? `Habilidade ${idx + 1}`}</div>
                        {(sk.descricao || sk.custo || sk.nivel) && (
                          <div style={{ fontSize: 13, color: 'var(--muted, #cfcfcf)' }}>
                            {sk.descricao ?? ''}{sk.custo ? ` • Custo: ${sk.custo}` : ''}{sk.nivel ? ` • Nível: ${sk.nivel}` : ''}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--muted, #cfcfcf)' }}>Sem habilidades registradas</div>
                  )}

                  <div style={{ height: 12 }} />
                  <SubHeading>Magias</SubHeading>
                  {(Array.isArray((personagem as any).magia) && (personagem as any).magia.length > 0) ? (
                    (personagem as any).magia.map((mg: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{mg.nome ?? mg.titulo ?? `Magia ${idx + 1}`}</div>
                        {(mg.descricao || mg.custo || mg.nivel) && (
                          <div style={{ fontSize: 13, color: 'var(--muted, #cfcfcf)' }}>
                            {mg.descricao ?? ''}{mg.custo ? ` • Custo: ${mg.custo}` : ''}{mg.nivel ? ` • Nível: ${mg.nivel}` : ''}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--muted, #cfcfcf)' }}>Sem magias registradas</div>
                  )}
                </CardContent>
              </ClipBox>
            </SectionSpacer>

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="8px" backgroundColor="rgba(0,0,10,0.12)">
                <div style={{ cursor: 'pointer' }} onClick={() => setGalleryOpen(s => !s)}>
                  <CardContent>
                    <SubHeading>{galleryOpen ? 'Galeria ▾' : 'Galeria ▸'}</SubHeading>
                  </CardContent>
                </div>
                {galleryOpen && (
                  <div style={{ padding: '0 12px 12px 12px' }}>
                    {Array.isArray((personagem as any).galeriaImagem) && (personagem as any).galeriaImagem.length > 0 ? (
                      <GalleryBlock
                        block={{ tipo: PageBlockType.GALLERY, conteudo: { imagens: (personagem as any).galeriaImagem.map((u: any) => ({ url: u, legenda: '' })) }, ordem: 0 }}
                        blockIndex={0}
                        theme={theme}
                        neon={neon}
                      />
                    ) : (
                      <div style={{ color: 'var(--muted, #cfcfcf)', padding: 12 }}>Nenhuma imagem na galeria</div>
                    )}
                  </div>
                )}
              </ClipBox>
            </SectionSpacer>
        </Sections>
    </PageContainer>
  );
};

export default PersonagemPage;
