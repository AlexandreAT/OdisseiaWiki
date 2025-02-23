import React from 'react'
import { colorSchemes } from '../../../styles/ColorSchemes';
import { useSelector } from 'react-redux'

interface Props {
  colorScheme: keyof typeof colorSchemes;
}

const ListCharacters:React.FC<Props> = ({ colorScheme }) => {

  const scheme = colorSchemes[colorScheme];
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