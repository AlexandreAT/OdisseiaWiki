import { ReactElement } from 'react'
import { BoxContainer } from './LabelInfoBox.style';

interface Props {
    children: ReactElement;
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
}

export const LabelInfoBox = ({children, theme, neon}: Props) => {
  return (
    <BoxContainer theme={theme} neon={neon}>
        {children}
    </BoxContainer>
  )
}