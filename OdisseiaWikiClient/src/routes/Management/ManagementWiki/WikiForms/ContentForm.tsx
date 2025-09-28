import { FormCriarConteúdo } from "./FormCriarConteúdo/FormCriarConteúdo";
import { FormContainer } from "./ContentForm.style";

interface ContentFormProps {
  mode: 'create' | 'search' | null;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ContentForm = ({ mode, theme, neon }: ContentFormProps) => {
    const renderForm = () => {
        switch (mode) {
            case 'create':
                return <FormCriarConteúdo theme={theme} neon={neon} />;
            case 'search':
                return <p>Pesquisar conteúdo</p>;
            default:
                return null;
        }
    };

  return (
    <FormContainer theme={theme} neon={neon}>
      {renderForm()}
    </FormContainer>
  );
};
