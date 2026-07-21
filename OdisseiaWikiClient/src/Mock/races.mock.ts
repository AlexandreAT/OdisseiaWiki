import { Raca } from "../models/Races";

export const racasMock: Raca[] = [
  {
    Idraca: 1,
    Nome: "Humano",
    StatusJson: {
      status: { vida: 1000, vidaMaxima: 1000, estamina: 75, estaminaMaxima: 75, mana: 50, manaMaxima: 50, capacidadeCarga: 15 },
      atributoInicial: "resistencia",
      passivas: [{ nome: "Adaptabilidade" }, { nome: "Conexões Sociais" }, { nome: "Versatilidade" }]
    },
    Imagem: "assets_dynamic/racas/humano/u82be71e-c50c-4e06-8d79-9ea7a77f1zbh.jpeg",
    Variacoes: [],
    Visivel: true,
    DataCriacao: "2025-09-17"
  },
  {
    Idraca: 2,
    Nome: "Elfo",
    StatusJson: {
      status: { vida: 1000, vidaMaxima: 1000, estamina: 75, estaminaMaxima: 75, mana: 75, manaMaxima: 75, capacidadeCarga: 10 },
      atributoInicial: "sabedoria",
      passivas: [{ nome: "Visão no Escuro" }, { nome: "Afinidade Mágica" }, { nome: "Graça Natural" }]
    },
    Imagem: "assets_dynamic/racas/elfo/s82be25e-c50c-4e05-8d78-9ea7d77f1daf.jpeg",
    Variacoes: [{ nome: "Alto Elfo" }, { nome: "Elfo Negro" }, { nome: "Elfo da Floresta" }],
    Visivel: true,
    DataCriacao: "2025-09-17"
  },
  {
    Idraca: 3,
    Nome: "Anão",
    StatusJson: {
      status: { vida: 1250, vidaMaxima: 1250, estamina: 80, estaminaMaxima: 80, mana: 40, manaMaxima: 40, capacidadeCarga: 20 },
      atributoInicial: "resistencia",
      passivas: [{ nome: "Resistência a Veneno" }, { nome: "Mestre das Forjas" }, { nome: "Tenacidade" }]
    },
    Imagem: "assets_dynamic/racas/anao/b52be15e-c50c-4e05-8a78-9ea7u71f1daw.jpeg",
    Variacoes: [],
    Visivel: true,
    DataCriacao: "2025-09-17"
  },
  {
    Idraca: 4,
    Nome: "Orc",
    StatusJson: {
      status: { vida: 1500, vidaMaxima: 1500, estamina: 75, estaminaMaxima: 75, mana: 50, manaMaxima: 50, capacidadeCarga: 25 },
      atributoInicial: "resistencia",
      passivas: [{ nome: "Resistência a Veneno" }, { nome: "Mestre das Forjas" }, { nome: "Tenacidade" }]
    },
    Imagem: "assets_dynamic/racas/orc/a82be25e-c50c-4e09-8d79-9ea7d77f1dbf.jpeg",
    Variacoes: [{ nome: "Brutorquiano" }, { nome: "Hominorc" }],
    Visivel: true,
    DataCriacao: "2025-09-17"
  }
];
