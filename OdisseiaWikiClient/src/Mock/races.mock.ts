import { Raca } from "../models/Races";

export const racasMock: Raca[] = [
  {
    Idraca: 1,
    Nome: "Humano",
    StatusJson: {
      status: { vida: 1000, estamina: 75, mana: 50, capacidadeCarga: 15 },
      atributoInicial: "resistencia",
      passivas: ["Adaptabilidade", "Conexões Sociais", "Versatilidade"]
    },
    Imagem: "assets_dynamic/racas/humano/u82be71e-c50c-4e06-8d79-9ea7a77f1zbh.jpeg",
    Variantes: [],
    DataCriacao: "2025-09-17"
  },
  {
    Idraca: 2,
    Nome: "Elfo",
    StatusJson: {
      status: { vida: 1000, estamina: 75, mana: 75, capacidadeCarga: 10 },
      atributoInicial: "sabedoria",
      passivas: ["Visão no Escuro", "Afinidade Mágica", "Graça Natural"]
    },
    Imagem: "assets_dynamic/racas/elfo/s82be25e-c50c-4e05-8d78-9ea7d77f1daf.jpeg",
    Variantes: ["Alto Elfo", "Elfo Negro", "Elfo da Floresta"],
    DataCriacao: "2025-09-17"
  },
  {
    Idraca: 3,
    Nome: "Anão",
    StatusJson: {
      status: { vida: 1250, estamina: 80, mana: 40, capacidadeCarga: 20 },
      atributoInicial: "resistencia",
      passivas: ["Resistência a Veneno", "Mestre das Forjas", "Tenacidade"]
    },
    Imagem: "assets_dynamic/racas/anao/b52be15e-c50c-4e05-8a78-9ea7u71f1daw.jpeg",
    Variantes: [],
    DataCriacao: "2025-09-17"
  },
  {
    Idraca: 4,
    Nome: "Orc",
    StatusJson: {
      status: { vida: 1500, estamina: 75, mana: 50, capacidadeCarga: 25 },
      atributoInicial: "resistencia",
      passivas: ["Resistência a Veneno", "Mestre das Forjas", "Tenacidade"]
    },
    Imagem: "assets_dynamic/racas/orc/a82be25e-c50c-4e09-8d79-9ea7d77f1dbf.jpeg",
    Variantes: ["Brutorquiano", "Hominorc"],
    DataCriacao: "2025-09-17"
  }
];