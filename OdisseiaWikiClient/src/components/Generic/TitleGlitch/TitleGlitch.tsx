import { Title } from './TitleGlitch.style';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    text: string;
} 

const TitleGlitch = ({ theme, neon, text }: Props) => {
  return (
    <Title theme={theme} neon={neon}>
        {text}
    </Title>
  )
}

export default TitleGlitch