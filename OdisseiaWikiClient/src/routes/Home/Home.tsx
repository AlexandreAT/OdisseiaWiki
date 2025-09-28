import { Main } from './Home.style';
import { InfoBlock } from '../../components/InfoComponents/InfoBlock/InfoBlock';
import { Banner } from '../../components/Generic/Banner/Banner';
import { InfoCarousel } from '../../components/InfoComponents/InfoCarousel/InfoCarousel';
import { personagensMock } from '../../Mock/characters.mock';
import { cidadesMock } from '../../Mock/cities.mock';

import BannerCampaing from '../../assets/Banner Campanha.png';
import BannerAbout from '../../assets/Banner Sobre.jpg';

const Home = () => {

  const charactersCards = personagensMock.map((p) => ({
    name: p.Nome,
    imageSrc: p.Imagem,
    description: p.Historia ?? "Sem descrição",
    link: `/personagen/${p.Idpersonagem}`,
  }));

  const citiesCards = cidadesMock.map((p) => ({
    name: p.Nome,
    imageSrc: p.Imagem,
    description: p.Descricao ?? "Sem descrição",
    link: `/cidade/${p.Idcidade}`,
  }));

  return (
    <Main>
      <Banner
        title='Odisseia'
        paragraph={[
          "Descubra um universo repleto de diversidade e tensões, onde a tecnologia encontra a magia em uma fusão única.",
          "Em Odisseia, explore a complexidade de um mundo onde mitologia e ciência se entrelaçam, moldando o destino das raças.",
        ]}
      />
      <InfoBlock
        title='Sobre o universo'
        imageSrc={BannerCampaing} imageAlt='Banner - Sobre' imagePosition='left'
        colorScheme='pinkBlue'
        paragraph={[
          "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Blanditiis expedita amet consequuntur reiciendis consequatur, dolore facere officia cum eligendi repellendus nulla praesentium, ipsum eaque, aspernatur ex quod ullam voluptate facilis.",
          "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Molestiae corporis inventore voluptatibus sapiente mollitia fugit, deleniti eaque dolorum qui nobis delectus veniam sunt nisi quos ullam placeat facere accusantium itaque.",
          "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Minus, ex. Asperiores a aut animi nemo autem distinctio, reprehenderit voluptatum dolore, iusto dolores explicabo hic nostrum repellat veniam provident, adipisci quis!",
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae qui nulla rerum doloremque sapiente ea eveniet, molestias aut impedit provident rem eaque, quod accusamus eligendi aliquid maiores dicta blanditiis harum."
        ]}
      />
      <InfoBlock
        title='Campanha do RPG'
        subtitle='Insurgência'
        imageSrc={BannerAbout} imageAlt='Banner - Campanha' imagePosition='right'
        colorScheme='yellowViolet'
        paragraph={[
          "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quaerat a nihil, vero, nisi id libero ab minima vel quia accusantium soluta ratione, nulla consectetur cupiditate inventore optio sed tempore porro. Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero maiores neque iste similique officiis aliquam adipisci reiciendis voluptas quod mollitia, porro dolorem dolorum, eligendi dolore. Iure quia maxime dolore quaerat. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Asperiores fuga labore praesentium numquam! Repellendus esse, dolore optio fuga excepturi unde incidunt neque, amet magnam fugiat asperiores quae sequi nostrum. Quasi!"
        ]}
      />
      <InfoCarousel
        typeTop='simple'
        typeBottom='city'
        title='Destaques da Wiki'
        subtitleTop='Personagens'
        subtitleBottom='Cidades'
        imageStyleTop='circle'
        imageStyleBottom='rectangle'
        listTop={charactersCards}
        listBottom={citiesCards}
        colorScheme='bluePink'
      />
      <InfoCarousel
        typeTop='simple'
        typeBottom='city'
        title='Destaques da Wiki'
        subtitleTop='Personagens'
        subtitleBottom='Cidades'
        imageStyleTop='circle'
        imageStyleBottom='rectangle'
        listTop={charactersCards}
        listBottom={citiesCards}
        colorScheme='greenRed'
      />
      <InfoCarousel
        typeTop='simple'
        typeBottom='city'
        title='Destaques da Wiki'
        subtitleTop='Personagens'
        subtitleBottom='Cidades'
        imageStyleTop='circle'
        imageStyleBottom='rectangle'
        listTop={charactersCards}
        listBottom={citiesCards}
        colorScheme='violetYellow'
      />
    </Main>
  )
}

export default Home