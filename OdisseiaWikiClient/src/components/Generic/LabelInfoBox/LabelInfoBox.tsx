import { ReactElement, memo } from 'react'
import { BoxContainer } from './LabelInfoBox.style';

interface Props {
    children: ReactElement;
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
}

const LabelInfoBoxComponent = ({children, theme, neon}: Props) => {
  return (
    <BoxContainer theme={theme} neon={neon}>
        {children}
    </BoxContainer>
  )
}

export const LabelInfoBox = memo(LabelInfoBoxComponent);