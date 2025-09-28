import React from 'react'
import { colorCardsSchemes } from '../../../Global Styles/ColorCardsSchemes';
import { useSelector } from 'react-redux'

interface Props {
  colorScheme: keyof typeof colorCardsSchemes;
}

const ListCharacters:React.FC<Props> = ({ colorScheme }) => {

  const scheme = colorCardsSchemes[colorScheme];
  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  return (
    <div>
      <h2>teste</h2>
      {theme}
      {neon }
    </div>
  )
}

export default ListCharacters