import { Title } from './TitleGlitch.style';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  text: string;
  fontSize?: string;
} 

const TitleGlitch = ({ theme, neon, text, fontSize }: Props) => {
  return (
    <Title
      theme={theme}
      neon={neon}
      $fontSize={fontSize}
    >
      {text}
    </Title>
  )
}

export default TitleGlitch