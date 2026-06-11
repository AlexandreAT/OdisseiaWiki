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
import { GalleryBlock } from '../Wiki/components/blocks/GalleryBlock/GalleryBlock';
import { PageBlockType } from '../../models/Pages';

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

            <SectionSpacer>
              <ClipBox theme={theme} neon={neon} useClip borderRadius="8px" zIndex={1} innerOffset="12px" backgroundColor="rgba(0,0,10,0.25)">
                <CardContent>
                  <SubHeading>Itens</SubHeading>
                  {(Array.isArray((personagem as any).inventarioJson) && (personagem as any).inventarioJson.length > 0) ? (
                    (personagem as any).inventarioJson.map((it: any, idx: number) => {
                      const nomeItem = it.nome ?? it.nomeItem ?? it.titulo ?? String(it);
                      const quantidade = it.quantidade ?? it.qtd ?? it.qtde ?? null;
                      const imagem = it.imagem ?? it.url ?? (typeof it === 'string' ? it : undefined);
                      return (
                        <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                          {imagem ? (
                            <img src={normalizeImagePath(imagem)} alt={nomeItem} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{nomeItem}</div>
                            {it.descricao && <div style={{ fontSize: 13, color: 'var(--muted, #cfcfcf)' }}>{it.descricao}</div>}
                          </div>
                          <div style={{ color: 'var(--muted, #cfcfcf)' }}>{quantidade ? `x${quantidade}` : ''}</div>
                        </div>
                      );
                    })
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

            {/* debug block removed */}
        </Sections>
      </RightColumn>
    </PageContainer>
  );
};

export default PersonagemPage;
