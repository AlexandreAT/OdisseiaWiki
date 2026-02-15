import { FormCriarConteúdo } from "./FormCriarConteúdo/FormCriarConteúdo";
import { FormBuscarConteúdo } from "./FormBuscarConteúdo/FormBuscarConteúdo";
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
                return <FormBuscarConteúdo theme={theme} neon={neon} />;
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
