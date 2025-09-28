import { Item } from "../models/Itens";

export const itensMock: Item[] = [
  {
    id: "uuid-lanterna",
    nome: "Lanterna",
    tipo: "outro",
    quantidade: 1,
    peso: 1,
    descricao: "Lanterna portátil para iluminar ambientes escuros.",
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-vector",
    nome: "Vector",
    tipo: "arma",
    quantidade: 1,
    peso: 5,
    descricao: "Rajada de 10 balas, pente de 50.",
    atributos: {
      danoPorAlcance: { curta: 150, media: 100, longa: 60 },
      municao: { capacidade: 50, atual: 50 },
      ataquesPorTurno: 5,
      bonus: ["+1 média distância"]
    },
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-colt",
    nome: "Colt",
    tipo: "arma",
    quantidade: 1,
    peso: 3,
    descricao: "Pente de 10 balas.",
    atributos: {
      danoPorAlcance: { curta: 150, media: 100, longa: 50 },
      municao: { capacidade: 10, atual: 10 },
      ataquesPorTurno: 4,
      bonus: []
    },
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-umbrela",
    nome: "Umbrela",
    tipo: "arma",
    quantidade: 1,
    peso: 5,
    descricao: "Pente de 8 balas.",
    atributos: {
      danoPorAlcance: { curta: 400, media: 40, longa: 0 },
      municao: { capacidade: 8, atual: 8 },
      ataquesPorTurno: 3,
      bonus: ["+1 curta distância"]
    },
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-espada",
    nome: "Espada",
    tipo: "arma",
    quantidade: 1,
    peso: 10,
    descricao: "Espada de dano base 250.",
    atributos: {
      danoPorAlcance: { curta: 250 },
      ataquesPorTurno: 4,
      bonus: ["+1 em atacar e revidar"]
    },
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-machado-energizado",
    nome: "Machado energizado",
    tipo: "arma",
    quantidade: 1,
    peso: 10,
    descricao: "Machado exalando energia com dano base 350.",
    atributos: {
      danoPorAlcance: { curta: 350 },
      ataquesPorTurno: 2,
      especial: "Arremessável",
      bonus: ["+1 em atacar"]
    },
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-soco-ingles",
    nome: "Soco inglês",
    tipo: "arma",
    quantidade: 1,
    peso: 2,
    descricao: "Soco inglês, pode atacar 6 vezes por turno.",
    atributos: {
      danoPorAlcance: { curta: 200 },
      ataquesPorTurno: 6
    },
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-colete",
    nome: "Colete básico",
    tipo: "traje",
    quantidade: 1,
    peso: 0,
    descricao: "Proteção básica, caso não esteja equipado consome 10 de peso.",
    efeito: "+400 de proteção",
    atributos: { protecaoBase: 400 },
    dataCriacao: "2025-09-17"
  },
  {
    id: "uuid-pocao-cura",
    nome: "Poção de cura",
    tipo: "consumiveis",
    quantidade: 1,
    peso: 1,
    descricao: "Restaura 800 de vida.",
    efeito: "+800 de vida",
    atributos: { restaura: { vida: 800 }, duracao: "imediato" },
    dataCriacao: "2025-09-17"
  }
];