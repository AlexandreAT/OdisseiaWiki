import { Main } from '../styles/Home.style';
import InfoBlock from '../components/Generic/InfoBlock/InfoBlock';
import Banner from '../components/Banner';
import InfoCarousel from '../components/Generic/InfoCarousel/InfoCarousel';
import data from '../Mock/MockData.json';

import BannerCampaing from '../assets/Banner Campanha.png';
import BannerAbout from '../assets/Banner Sobre.jpg';

const Home = () => {
  const importImage = (path: string) => {
    return(`..${path}`)
  };
  
  const characters = data.characters.map(char => ({
    ...char,
    imageSrc: importImage(char.imageSrc),
  }));

  const cities = data.cities.map(city => ({
    ...city,
    imageSrc: importImage(city.imageSrc),
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
        listTop={data.characters}
        listBottom={data.cities}
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
        listTop={data.characters}
        listBottom={data.cities}
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
        listTop={data.characters}
        listBottom={data.cities}
        colorScheme='violetYellow'
      />
    </Main>
  )
}

export default Home