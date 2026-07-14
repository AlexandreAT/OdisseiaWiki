import { Title } from './TitleGlitch.style';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  text: string;
  fontSize?: string;
  colorOverride?: string;
} 

const TitleGlitch = ({ theme, neon, text, fontSize, colorOverride }: Props) => {
  return (
    <Title
      theme={theme}
      neon={neon}
      $fontSize={fontSize}
      $colorOverride={colorOverride}
    >
      {text}
    </Title>
  )
}

export default TitleGlitch
