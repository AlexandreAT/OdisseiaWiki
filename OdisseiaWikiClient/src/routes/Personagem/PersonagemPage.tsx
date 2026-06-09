import React from 'react';
import { useParams } from 'react-router-dom';
import { usePersonagem } from './usePersonagem';
import { PageContainer, Avatar, Header, Title, Meta, Content } from './PersonagemPage.style';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';

const PersonagemPage: React.FC = () => {
  const params = useParams();
  const id = params.id;
  const { loading, error, personagem } = usePersonagem(id);

  if (loading) return <div>Carregando personagem...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!personagem) return <div>Personagem não encontrado</div>;

  const nome = (personagem as any).nome || 'Sem nome';
  const imagem = (personagem as any).imagem;
  const historia = (personagem as any).historia;

  return (
    <PageContainer>
      <div>
        {imagem ? <Avatar src={normalizeImagePath(imagem)} alt={nome} /> : <Avatar src="/assets/avatar-placeholder.png" alt={nome} />}
      </div>

      <Content>
        <Header>
          <Title>{nome}</Title>
          <Meta>Personagem • ID {id}</Meta>
        </Header>

        <section style={{ marginTop: 16 }}>
          <RichTextDisplay content={historia} />
        </section>
      </Content>
    </PageContainer>
  );
};

export default PersonagemPage;
