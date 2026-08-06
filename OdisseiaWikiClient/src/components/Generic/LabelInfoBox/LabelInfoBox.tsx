import { ReactElement, memo } from 'react'
import { BoxContainer } from './LabelInfoBox.style';

interface Props {
    children: ReactElement;
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
    title?: string;
}

const LabelInfoBoxComponent = ({children, theme, neon, title}: Props) => {
  return (
    <BoxContainer theme={theme} neon={neon} title={title}>
        {children}
    </BoxContainer>
  )
}

export const LabelInfoBox = memo(LabelInfoBoxComponent);
