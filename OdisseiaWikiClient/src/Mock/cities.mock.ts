import { Cidade } from "../models/Cities";
import cityAluren from "../assets/Cidade Alurën.png";
import cityElysium from "../assets/Cidade Elysium.png";
import cityGrimdal from "../assets/Cidade Grimdal.png";
import cityIronhold from "../assets/Cidade Ironhold Keep.png";
import cityLoryzon from "../assets/Cidade Loryzon.png";
import cityRavena from "../assets/Cidade Ravena.png";

export const cidadesMock: Cidade[] = [
  {
    Idcidade: 1,
    Nome: "Loryzon",
    Imagem: cityLoryzon,
    Descricao: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo explicabo necessitatibus cum totam! Sunt iusto, molestias modi sequi, voluptate ad, corporis voluptas neque vel doloremque quidem labore dicta officia ducimus!' }] }] },
    Tags: ["Capital", "Comércio", "Magia"],
    Visivel: true,
    DataCriacao: "2025-17-09"
  },
  {
    Idcidade: 2,
    Nome: "Ravena",
    Imagem: cityRavena,
    Descricao: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo explicabo necessitatibus cum totam! Sunt iusto, molestias modi sequi, voluptate ad, corporis voluptas neque vel doloremque quidem labore dicta officia ducimus!' }] }] },
    Tags: ["Porto", "Mistério"],
    Visivel: true,
    DataCriacao: "2025-17-09"
  },
  {
    Idcidade: 3,
    Nome: "Alurën",
    Imagem: cityAluren,
    Descricao: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo explicabo necessitatibus cum totam! Sunt iusto, molestias modi sequi, voluptate ad, corporis voluptas neque vel doloremque quidem labore dicta officia ducimus!' }] }] },
    Tags: ["Élfico", "Floresta"],
    Visivel: true,
    DataCriacao: "2025-17-09"
  },
  {
    Idcidade: 4,
    Nome: "Ironhold Keep",
    Imagem: cityIronhold,
    Descricao: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo explicabo necessitatibus cum totam! Sunt iusto, molestias modi sequi, voluptate ad, corporis voluptas neque vel doloremque quidem labore dicta officia ducimus!' }] }] },
    Tags: ["Fortaleza", "Anão", "Montanha"],
    Visivel: true,
    DataCriacao: "2025-17-09"
  },
  {
    Idcidade: 5,
    Nome: "Grimdal",
    Imagem: cityGrimdal,
    Descricao: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo explicabo necessitatibus cum totam! Sunt iusto, molestias modi sequi, voluptate ad, corporis voluptas neque vel doloremque quidem labore dicta officia ducimus!' }] }] },
    Tags: ["Deserto", "Mistério"],
    Visivel: true,
    DataCriacao: "2025-17-09"
  },
  {
    Idcidade: 6,
    Nome: "Elysium",
    Imagem: cityElysium,
    Descricao: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo explicabo necessitatibus cum totam! Sunt iusto, molestias modi sequi, voluptate ad, corporis voluptas neque vel doloremque quidem labore dicta officia ducimus!' }] }] },
    Tags: ["Céu", "Divino"],
    Visivel: true,
    DataCriacao: "2025-17-09"
  }
];
