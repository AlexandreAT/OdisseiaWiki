import { Personagem } from "../models/Characters";

export const personagensMock: Personagem[] = [
  {
    Idpersonagem: 1,
    Nome: "Sute",
    Idraca: 1,
    Idcidade: 1,
    Historia: "Um jovem aventureiro curioso e leal, sempre ajuda os necessitados.",
    StatusJson: {
      status: { vida: 1200, estamina: 50, mana: 35, capacidadeCarga: 30 },
      atributos: {
        principais: { resistencia: 3, agilidade: 4, sabedoria: 3, precisao: 4, forca: 3 },
        secundarios: { sanidade: 4, coragem: 3, inteligencia: 4, percepcao: 3, labia: 2, intimidacao: 2 }
      },
      nivel: 1,
      xp: 0,
      defesas: { armadura: 100, protecao: 800, escudo: 0, outras: 0 }
    },
    Alinhamento: "neutro_bondoso",
    Tracos: ["curioso", "leal"],
    Costumes: ["Sempre ajuda os necessitados"],
    Imagem: "src/assets/Token Sute.png",
    InventarioJson: [
      {
        id: "uuid-inv-1",
        idItemBase: "uuid-espada",
        nome: "Espada",
        tipo: "arma",
        quantidade: 1,
        atributos: { danoPorAlcance: { curta: 250 }, ataquesPorTurno: 4, bonus: ["+1 em atacar e revidar"] }
      },
      {
        id: "uuid-inv-2",
        idItemBase: "uuid-pocao-cura",
        nome: "Poção de cura",
        tipo: "consumiveis",
        quantidade: 2,
        atributos: { restaura: { vida: 800 }, duracao: "imediato" }
      },
      {
        id: "uuid-inv-3",
        idItemBase: "uuid-colete",
        nome: "Colete básico",
        tipo: "traje",
        quantidade: 1,
        efeito: "+400 de proteção",
        atributos: { protecaoBase: 400 }
      }
    ],
    PersonagemsVinculados: [],
    Nanites: 0,
    Tags: ["Aventureiro", "Jovem", "Herói"],
    Visivel: true,
    DataCriacao: "2024-01-10"
  },
  {
    Idpersonagem: 2,
    Nome: "Gunther",
    Idraca: 2,
    Idcidade: 2,
    Historia: "Guerreiro orgulhoso e bravo, segue o código de honra dos guerreiros.",
    StatusJson: {
      status: { vida: 2000, estamina: 80, mana: 20, capacidadeCarga: 40 },
      atributos: {
        principais: { resistencia: 5, agilidade: 3, sabedoria: 2, precisao: 3, forca: 5 },
        secundarios: { sanidade: 4, coragem: 5, inteligencia: 3, percepcao: 4, labia: 2, intimidacao: 5 }
      },
      nivel: 2,
      xp: 0,
      defesas: { armadura: 150, protecao: 600, escudo: 1200, outras: 0 }
    },
    Alinhamento: "leal_neutro",
    Tracos: ["orgulhoso", "bravo"],
    Costumes: ["Segue o código de honra dos guerreiros"],
    Imagem: "src/assets/Token Gunther.png",
    InventarioJson: [
      {
        id: "uuid-inv-4",
        idItemBase: "uuid-machado-energizado",
        nome: "Machado energizado",
        tipo: "arma",
        quantidade: 1,
        atributos: { danoPorAlcance: { curta: 350 }, ataquesPorTurno: 2, especial: "Arremessável", bonus: ["+1 em atacar"] }
      },
      {
        id: "uuid-inv-5",
        idItemBase: "uuid-pocao-cura",
        nome: "Poção de cura",
        tipo: "consumiveis",
        quantidade: 2,
        atributos: { restaura: { vida: 800 }, duracao: "imediato" }
      },
      {
        id: "uuid-inv-6",
        idItemBase: "uuid-colete",
        nome: "Colete básico",
        tipo: "traje",
        quantidade: 1,
        efeito: "+400 de proteção",
        atributos: { protecaoBase: 400 }
      }
    ],
    PersonagemsVinculados: [],
    Nanites: 0,
    Tags: ["Guerreiro", "Honorável", "Tank"],
    Visivel: true,
    DataCriacao: "2024-01-11"
  },
  {
    Idpersonagem: 3,
    Nome: "Laraki",
    Idraca: 3,
    Idcidade: undefined,
    Historia: "Impulsivo e bondoso, canta histórias antigas em tavernas.",
    StatusJson: {
      status: { vida: 1500, estamina: 40, mana: 50, capacidadeCarga: 20 },
      atributos: {
        principais: { resistencia: 2, agilidade: 5, sabedoria: 4, precisao: 3, forca: 2 },
        secundarios: { sanidade: 5, coragem: 3, inteligencia: 4, percepcao: 4, labia: 5, intimidacao: 1 }
      },
      nivel: 1,
      xp: 0,
      defesas: { armadura: 0, protecao: 400, escudo: 0, outras: 0 }
    },
    Alinhamento: "caotico_bondoso",
    Tracos: ["impulsivo", "bondoso"],
    Costumes: ["Canta histórias antigas em tavernas"],
    Imagem: "src/assets/Token Laraki.png",
    InventarioJson: [
      {
        id: "uuid-inv-7",
        idItemBase: "uuid-lanterna",
        nome: "Lanterna",
        tipo: "outro",
        quantidade: 1
      },
      {
        id: "uuid-inv-8",
        idItemBase: "uuid-pocao-cura",
        nome: "Poção de cura",
        tipo: "consumiveis",
        quantidade: 3,
        atributos: { restaura: { vida: 800 }, duracao: "imediato" }
      }
    ],
    PersonagemsVinculados: [],
    Nanites: 0,
    Tags: ["Bardo", "Viajante", "Suporte"],
    Visivel: true,
    DataCriacao: "2024-01-12"
  },
  {
    Idpersonagem: 4,
    Nome: "Tigre",
    Idraca: 4,
    Idcidade: undefined,
    Historia: "Calculista e leal, sempre em vigília pela matilha.",
    StatusJson: {
      status: { vida: 2500, estamina: 60, mana: 0, capacidadeCarga: 50 },
      atributos: {
        principais: { resistencia: 5, agilidade: 5, sabedoria: 2, precisao: 3, forca: 5 },
        secundarios: { sanidade: 5, coragem: 5, inteligencia: 2, percepcao: 3, labia: 2, intimidacao: 5 }
      },
      nivel: 3,
      xp: 0,
      defesas: { armadura: 200, protecao: 800, escudo: 1200, outras: 0 }
    },
    Alinhamento: "neutro",
    Tracos: ["calculista", "leal"],
    Costumes: ["Sempre em vigília pela matilha"],
    Imagem: "src/assets/Token Tigre.png",
    InventarioJson: [
      {
        id: "uuid-inv-9",
        idItemBase: "uuid-vector",
        nome: "Vector",
        tipo: "arma",
        quantidade: 1,
        atributos: { danoPorAlcance: { curta: 150, media: 100, longa: 60 }, municao: { capacidade: 50, atual: 50 }, ataquesPorTurno: 5, bonus: ["+1 média distância"] }
      },
      {
        id: "uuid-inv-10",
        idItemBase: "uuid-colete",
        nome: "Colete básico",
        tipo: "traje",
        quantidade: 1,
        efeito: "+400 de proteção",
        atributos: { protecaoBase: 400 }
      }
    ],
    PersonagemsVinculados: [],
    Nanites: 0,
    Tags: ["Tanque", "Líder", "Atirador"],
    Visivel: true,
    DataCriacao: "2024-01-13"
  },
  {
    Idpersonagem: 5,
    Nome: "Faevh",
    Idraca: 1,
    Idcidade: 3,
    Historia: "Curioso e impulsivo, gosta de mexer com magias proibidas.",
    StatusJson: {
      status: { vida: 1800, estamina: 55, mana: 80, capacidadeCarga: 25 },
      atributos: {
        principais: { resistencia: 3, agilidade: 4, sabedoria: 4, precisao: 3, forca: 3 },
        secundarios: { sanidade: 4, coragem: 3, inteligencia: 4, percepcao: 4, labia: 3, intimidacao: 2 }
      },
      nivel: 1,
      xp: 0,
      defesas: { armadura: 150, protecao: 600, escudo: 0, outras: 0 }
    },
    Alinhamento: "caotico_neutro",
    Tracos: ["curioso", "impulsivo"],
    Costumes: ["Gosta de mexer com magias proibidas"],
    Imagem: "src/assets/Token Faevh.png",
    InventarioJson: [
      {
        id: "uuid-inv-11",
        idItemBase: "uuid-umbrela",
        nome: "Umbrela",
        tipo: "arma",
        quantidade: 1,
        atributos: { danoPorAlcance: { curta: 400, media: 40, longa: 0 }, municao: { capacidade: 8, atual: 8 }, ataquesPorTurno: 3, bonus: ["+1 curta distância"] }
      },
      {
        id: "uuid-inv-12",
        idItemBase: "uuid-pocao-cura",
        nome: "Poção de cura",
        tipo: "consumiveis",
        quantidade: 2,
        atributos: { restaura: { vida: 800 }, duracao: "imediato" }
      },
      {
        id: "uuid-inv-13",
        idItemBase: "uuid-soco-ingles",
        nome: "Soco inglês",
        tipo: "arma",
        quantidade: 1,
        atributos: { danoPorAlcance: { curta: 200 }, ataquesPorTurno: 6 }
      }
    ],
    PersonagemsVinculados: [],
    Nanites: 0,
    Tags: ["Mago", "Experimental", "DPS"],
    Visivel: true,
    DataCriacao: "2024-01-14"
  }
];