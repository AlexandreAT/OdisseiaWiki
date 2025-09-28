import { WikiSection } from '../../components/InfoComponents/WikiSummary/index';
import { personagensMock } from '../../Mock/characters.mock'

const Wiki = () => {
  
  return (
    <div>
        <WikiSection 
          colorScheme='bluePink'
          title='Personagens'
          content={personagensMock}
          contentType='characters'
        />
    </div>
  )
}

export default Wiki