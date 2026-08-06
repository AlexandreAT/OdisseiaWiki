using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgSeeder
{
    private static List<SistemaItemEscopo> CriarCatalogoItens()
    {
        List<SistemaItemEscopo> catalogo = new();
        CriarCatalogoArmas(catalogo);
        CriarCatalogoTrajes(catalogo);
        CriarCatalogoConsumiveis(catalogo);
        CriarCatalogoAcessorios(catalogo);
        CriarCatalogoImplantes(catalogo);
        CriarCatalogoOutros(catalogo);
        return catalogo;
    }

    private static void CriarCatalogoArmas(ICollection<SistemaItemEscopo> catalogo)
    {
        SistemaItemEscopo arma = AdicionarEscopo(
            catalogo,
            null,
            SistemaItemEscopoNivel.Tipo,
            "ARMA",
            "Arma",
            1,
            "Armas mantêm seus valores reais no item; este catálogo fornece campos, escalas e referências conhecidas.",
            campos:
            [
                Campo("TIPO_ARMA", "Tipo de arma", SistemaItemCampoTipo.Codigo, 1),
                Campo("TIPO_DANO", "Tipo de dano", SistemaItemCampoTipo.Codigo, 2),
                Campo("DANO_BASE", "Dano base", SistemaItemCampoTipo.Inteiro, 3, "dano"),
                Campo("DANO_POR_ALCANCE_CURTA", "Dano em curta distância", SistemaItemCampoTipo.Inteiro, 4, "dano"),
                Campo("DANO_POR_ALCANCE_MEDIA", "Dano em média distância", SistemaItemCampoTipo.Inteiro, 5, "dano"),
                Campo("DANO_POR_ALCANCE_LONGA", "Dano em longa distância", SistemaItemCampoTipo.Inteiro, 6, "dano"),
                Campo("DANO_POR_ALCANCE_EM_AREA", "Dano em área", SistemaItemCampoTipo.Inteiro, 7, "dano"),
                Campo("DANO_POR_ALCANCE_PRECISO", "Dano preciso", SistemaItemCampoTipo.Inteiro, 8, "dano"),
                Campo("CADENCIA", "Cadência por turno", SistemaItemCampoTipo.Inteiro, 9),
                Campo("CAPACIDADE_USO", "Usos antes da pausa", SistemaItemCampoTipo.Inteiro, 10),
                Campo("CAPACIDADE_MUNICAO", "Capacidade de munição", SistemaItemCampoTipo.Inteiro, 11),
                Campo("GASTO_ESTAMINA_POR_ATAQUE", "Estamina por ação", SistemaItemCampoTipo.Inteiro, 12),
                Campo("ACERTO", "Dado de acerto", SistemaItemCampoTipo.Codigo, 13),
                Campo("DURACAO_EFEITO", "Duração do efeito", SistemaItemCampoTipo.Texto, 14),
                Campo("EFEITO", "Efeito", SistemaItemCampoTipo.Texto, 15),
                Campo("BONUS", "Bônus", SistemaItemCampoTipo.Lista, 16),
                Campo("ESPECIAL", "Especial", SistemaItemCampoTipo.Texto, 17),
            ],
            referencias:
            [
                Referencia(SistemaItemReferenciaTipo.TipoDano, "CORTANTE", "Cortante", 1),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "IMPACTO_PROJETIL", "Projétil", 2),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "PERFURACAO", "Perfurante", 3),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "CONTINUO", "Contínuo", 4),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "IMPACTO", "Impacto", 5),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "MAGICO", "Mágico", 6),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "AREA", "Área", 7),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "VERDADEIRO", "Verdadeiro", 8),
                Referencia(SistemaItemReferenciaTipo.TipoDano, "QUEDA", "Queda", 9),
                Referencia(SistemaItemReferenciaTipo.Alcance, "CURTA", "Curta distância", 10),
                Referencia(SistemaItemReferenciaTipo.Alcance, "MEDIA", "Média distância", 11),
                Referencia(SistemaItemReferenciaTipo.Alcance, "LONGA", "Longa distância", 12),
                Referencia(SistemaItemReferenciaTipo.Alcance, "EM_AREA", "Em área", 13),
                Referencia(SistemaItemReferenciaTipo.Alcance, "PRECISO", "Preciso", 14),
                Referencia(SistemaItemReferenciaTipo.Outro, "D6", "D6", 15),
                Referencia(SistemaItemReferenciaTipo.Outro, "D8", "D8", 16),
                Referencia(SistemaItemReferenciaTipo.Outro, "D20", "D20", 17),
            ]);

        SistemaItemEscopo fogo = AdicionarEscopo(catalogo, arma, SistemaItemEscopoNivel.Categoria,
            "ARMA_FOGO", "Arma de fogo", 1);
        AdicionarArquetipoArma(catalogo, fogo, "PISTOLA_REVOLVER", "Pistola / Revólver", 1,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 1_000, 250),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 350, 120),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 500, 150));
        AdicionarArquetipoArma(catalogo, fogo, "SMG", "SMG", 2,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 1_000, 150),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 350, 125),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 500, 80));
        AdicionarArquetipoArma(catalogo, fogo, "RIFLE_ASSALTO", "Rifle de assalto", 3,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 1_000, 80),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 350, 200),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 500, 125));
        AdicionarArquetipoArma(catalogo, fogo, "SHOTGUN", "Shotgun", 4,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 1_000, 550),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 350, 100));
        AdicionarArquetipoArma(catalogo, fogo, "RIFLE_ATIRADOR", "Rifle de atirador", 5,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 1_000, 500),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 350, 350),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 500, 450));
        AdicionarArquetipoArma(catalogo, fogo, "RIFLE_PRECISAO", "Rifle de precisão", 6,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 1_000, 1_000),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 350, 200),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 500, 500));

        SistemaItemEscopo branca = AdicionarEscopo(catalogo, arma, SistemaItemEscopoNivel.Categoria,
            "ARMA_BRANCA", "Arma branca", 2);
        AdicionarArquetipoArma(catalogo, branca, "ARMA_BRANCA_COMUM", "Arma branca comum", 1,
            ("DANO_BASE", "Dano base", 700, 250));
        AdicionarArquetipoArma(catalogo, branca, "ARMA_BRANCA_MENOR", "Arma branca menor", 2,
            ("DANO_BASE", "Dano base", 700, 150));
        AdicionarArquetipoArma(catalogo, branca, "ARMA_ENERGIZADA", "Arma energizada", 3,
            ("DANO_BASE", "Dano base", 700, 400));
        AdicionarArquetipoArma(catalogo, branca, "ARMA_FOTONS", "Arma de fótons", 4,
            ("DANO_BASE", "Dano base", 700, 500));
        AdicionarArquetipoArma(catalogo, branca, "SABRE_LUZ", "Sabre de luz", 5,
            ("DANO_BASE", "Dano base", 700, 700));

        SistemaItemEscopo corpo = AdicionarEscopo(catalogo, arma, SistemaItemEscopoNivel.Categoria,
            "CORPO_A_CORPO", "Corpo a corpo", 3);
        AdicionarArquetipoArma(catalogo, corpo, "DESARMADO", "Desarmado", 1,
            ("DANO_BASE", "Dano base", 700, 100));
        AdicionarArquetipoArma(catalogo, corpo, "PROTESE", "Prótese", 2,
            ("DANO_BASE", "Dano base", 700, 200));
        AdicionarArquetipoArma(catalogo, corpo, "SOCO_INGLES", "Soco inglês", 3,
            ("DANO_BASE", "Dano base", 700, 200));

        SistemaItemEscopo continuo = AdicionarEscopo(catalogo, arma, SistemaItemEscopoNivel.Categoria,
            "DANO_CONTINUO", "Dano contínuo", 4);
        AdicionarArquetipoArma(catalogo, continuo, "DANO_CONTINUO", "Arma de dano contínuo", 1,
            ("DANO_BASE", "Dano inicial", 400, 400));

        SistemaItemEscopo projeteis = AdicionarEscopo(catalogo, arma, SistemaItemEscopoNivel.Categoria,
            "ARCOS_BESTAS", "Arcos e bestas", 5);
        AdicionarArquetipoArma(catalogo, projeteis, "ARCO", "Arco", 1,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 100, 100),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 300, 300),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 400, 400));
        AdicionarArquetipoArma(catalogo, projeteis, "CROSSBOW", "Crossbow / Besta", 2,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 100, 100),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 300, 250),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 400, 350));

        SistemaItemEscopo pesadas = AdicionarEscopo(catalogo, arma, SistemaItemEscopoNivel.Categoria,
            "ARMAS_PESADAS", "Armas pesadas", 6);
        AdicionarArquetipoArma(catalogo, pesadas, "ARMA_PESADA", "Arma pesada", 1,
            ("DANO_POR_ALCANCE_CURTA", "Curta distância", 1_800, 1_800),
            ("DANO_POR_ALCANCE_MEDIA", "Média distância", 800, 800),
            ("DANO_POR_ALCANCE_LONGA", "Longa distância", 400, 400));
        AdicionarArquetipoArma(catalogo, pesadas, "ARMA_PESADA_AREA", "Arma pesada de dano em área", 2,
            ("DANO_POR_ALCANCE_EM_AREA", "Dano em área", 2_000, 2_000),
            ("DANO_POR_ALCANCE_PRECISO", "Dano preciso", 6_000, 6_000));
    }

    private static void CriarCatalogoTrajes(ICollection<SistemaItemEscopo> catalogo)
    {
        SistemaItemEscopo traje = AdicionarEscopo(
            catalogo,
            null,
            SistemaItemEscopoNivel.Tipo,
            "TRAJE",
            "Traje",
            2,
            "Proteções, armaduras e escudos mantêm o valor real no traje; as faixas representam a escala visual e a referência comum.",
            campos:
            [
                Campo("TIPO_TRAJE", "Subcategoria de traje", SistemaItemCampoTipo.Codigo, 1),
                Campo("PROTECAO_BASE", "Proteção base", SistemaItemCampoTipo.Inteiro, 2, "defesa"),
                Campo("ESCUDO_BASE", "Escudo base", SistemaItemCampoTipo.Inteiro, 3, "defesa"),
                Campo("ARMADURA_BASE", "Armadura base", SistemaItemCampoTipo.Inteiro, 4, "defesa"),
                Campo("RESISTENCIAS", "Resistências", SistemaItemCampoTipo.Lista, 5),
                Campo("PENALIDADES", "Penalidades", SistemaItemCampoTipo.Lista, 6),
                Campo("EFEITO", "Efeito", SistemaItemCampoTipo.Texto, 7),
                Campo("ESPECIAL", "Especial", SistemaItemCampoTipo.Texto, 8),
            ],
            referencias:
            [
                Referencia(SistemaItemReferenciaTipo.TipoDefesa, "PROTECAO", "Proteção", 1),
                Referencia(SistemaItemReferenciaTipo.TipoDefesa, "ESCUDO", "Escudo", 2),
                Referencia(SistemaItemReferenciaTipo.TipoDefesa, "ARMADURA", "Armadura", 3),
            ]);
        SistemaItemEscopo protecoes = AdicionarEscopo(catalogo, traje, SistemaItemEscopoNivel.Categoria,
            "PROTECOES", "Proteções vestíveis", 1);
        AdicionarArquetipoDefesa(catalogo, protecoes, "COLETE", "Colete", 1, 800, 0, 0);
        AdicionarArquetipoDefesa(catalogo, protecoes, "TRAJE", "Traje completo", 2, 800, 0, 200);
        AdicionarArquetipoDefesa(catalogo, protecoes, "ARMOR_CORE", "ArmorCore", 3, 1_200, 0, 300);
    }

    private static void CriarCatalogoConsumiveis(ICollection<SistemaItemEscopo> catalogo)
    {
        SistemaItemEscopo consumivel = AdicionarEscopo(
            catalogo,
            null,
            SistemaItemEscopoNivel.Tipo,
            "CONSUMIVEIS",
            "Consumível",
            3,
            "Referências gerais para poções, seringas, alimentos, bebidas e itens médicos.",
            campos:
            [
                Campo("RESTAURA_VIDA", "Restauração de vida", SistemaItemCampoTipo.Inteiro, 1, "vida"),
                Campo("RESTAURA_ESTAMINA", "Restauração de estamina", SistemaItemCampoTipo.Inteiro, 2, "estamina"),
                Campo("RESTAURA_MANA", "Restauração de mana", SistemaItemCampoTipo.Inteiro, 3, "mana"),
                Campo("DURACAO", "Duração", SistemaItemCampoTipo.Texto, 4),
                Campo("EFEITO", "Efeito", SistemaItemCampoTipo.Texto, 5),
                Campo("ESPECIAL", "Especial", SistemaItemCampoTipo.Texto, 6),
            ],
            faixas:
            [
                Faixa("RESTAURA_VIDA", "Restauração de vida", 1_500, 1_500, 1, "vida"),
                Faixa("RESTAURA_ESTAMINA", "Restauração de estamina", 100, 40, 2, "estamina"),
                Faixa("RESTAURA_MANA", "Restauração de mana", 100, 35, 3, "mana"),
            ]);
        SistemaItemEscopo suporte = AdicionarEscopo(catalogo, consumivel, SistemaItemEscopoNivel.Categoria,
            "SUPORTE", "Suporte", 1);
        AdicionarEscopo(catalogo, suporte, SistemaItemEscopoNivel.Arquetipo, "POCAO", "Poção", 1);
        AdicionarEscopo(catalogo, suporte, SistemaItemEscopoNivel.Arquetipo, "SERINGA", "Seringa", 2);
        AdicionarEscopo(catalogo, suporte, SistemaItemEscopoNivel.Arquetipo, "KIT_MEDICO", "Kit médico", 3);
        SistemaItemEscopo alimento = AdicionarEscopo(catalogo, consumivel, SistemaItemEscopoNivel.Categoria,
            "ALIMENTACAO", "Alimentação", 2);
        AdicionarEscopo(catalogo, alimento, SistemaItemEscopoNivel.Arquetipo, "COMIDA", "Comida", 1);
        AdicionarEscopo(catalogo, alimento, SistemaItemEscopoNivel.Arquetipo, "BEBIDA", "Bebida", 2);
    }

    private static void CriarCatalogoAcessorios(ICollection<SistemaItemEscopo> catalogo)
    {
        SistemaItemEscopo acessorio = AdicionarEscopo(
            catalogo,
            null,
            SistemaItemEscopoNivel.Tipo,
            "ACESSORIO",
            "Acessório",
            4,
            "Acessórios e equipamentos utilitários equipáveis.",
            campos:
            [
                Campo("SLOT", "Slot", SistemaItemCampoTipo.Texto, 1),
                Campo("BONUS", "Bônus", SistemaItemCampoTipo.Lista, 2),
                Campo("DURACAO", "Duração", SistemaItemCampoTipo.Texto, 3),
                Campo("EFEITO", "Efeito", SistemaItemCampoTipo.Texto, 4),
            ]);
        SistemaItemEscopo equipavel = AdicionarEscopo(catalogo, acessorio, SistemaItemEscopoNivel.Categoria,
            "EQUIPAVEL", "Equipável", 1);
        AdicionarEscopo(catalogo, equipavel, SistemaItemEscopoNivel.Arquetipo, "VISOR", "Visor", 1);
        AdicionarEscopo(catalogo, equipavel, SistemaItemEscopoNivel.Arquetipo, "BOLSA_MOCHILA", "Bolsa / Mochila", 2);
        AdicionarEscopo(catalogo, equipavel, SistemaItemEscopoNivel.Arquetipo, "UTILITARIO", "Utilitário", 3);
    }

    private static void CriarCatalogoImplantes(ICollection<SistemaItemEscopo> catalogo)
    {
        SistemaItemEscopo implante = AdicionarEscopo(
            catalogo,
            null,
            SistemaItemEscopoNivel.Tipo,
            "IMPLANTE",
            "Prótese / Implante",
            5,
            "Próteses e implantes usam a região corporal como arquétipo para referências de bônus, sem limitar exceções do mestre.",
            campos:
            [
                Campo("PARTE_CORPO", "Parte do corpo", SistemaItemCampoTipo.Codigo, 1),
                Campo("LADO", "Lado", SistemaItemCampoTipo.Codigo, 2),
                Campo("MATERIAL", "Material", SistemaItemCampoTipo.Codigo, 3),
                Campo("MODELO", "Modelo", SistemaItemCampoTipo.Texto, 4),
                Campo("SLOTS_MODIFICACAO", "Slots de modificação", SistemaItemCampoTipo.Inteiro, 5),
                Campo("SLOTS_LACRIMA", "Slots de Lácrima", SistemaItemCampoTipo.Inteiro, 6),
                Campo("NECESSITA_AMPUTACAO", "Necessita amputação", SistemaItemCampoTipo.Booleano, 7),
                Campo("BONUS_VIDA", "Bônus de vida", SistemaItemCampoTipo.Inteiro, 8, "vida"),
                Campo("BONUS_ESTAMINA", "Bônus de estamina", SistemaItemCampoTipo.Inteiro, 9, "estamina"),
                Campo("BONUS_MANA", "Bônus de mana", SistemaItemCampoTipo.Inteiro, 10, "mana"),
                Campo("BONUS_RESISTENCIA", "Bônus de resistência", SistemaItemCampoTipo.Inteiro, 11),
                Campo("BONUS_FORCA", "Bônus de força", SistemaItemCampoTipo.Inteiro, 12),
                Campo("BONUS_AGILIDADE", "Bônus de agilidade", SistemaItemCampoTipo.Inteiro, 13),
                Campo("BONUS_PRECISAO", "Bônus de precisão", SistemaItemCampoTipo.Inteiro, 14),
                Campo("BONUS_SABEDORIA", "Bônus de sabedoria", SistemaItemCampoTipo.Inteiro, 15),
                Campo("ESPECIAIS", "Efeitos especiais", SistemaItemCampoTipo.Lista, 16),
                Campo("MODIFICACOES", "Modificações", SistemaItemCampoTipo.Lista, 17),
                Campo("LACRIMAS", "Lácrimas", SistemaItemCampoTipo.Lista, 18),
                Campo("EFEITO", "Efeito", SistemaItemCampoTipo.Texto, 19),
            ],
            faixas:
            [
                Faixa("SLOTS_MODIFICACAO", "Slots de modificação", 3, 3, 1),
                Faixa("SLOTS_LACRIMA", "Slots de Lácrima", 3, 3, 2),
            ],
            referencias:
            [
                Referencia(SistemaItemReferenciaTipo.ParteCorpo, "MAO", "Mão", 1),
                Referencia(SistemaItemReferenciaTipo.ParteCorpo, "BRACO", "Braço", 2),
                Referencia(SistemaItemReferenciaTipo.ParteCorpo, "PE", "Pé", 3),
                Referencia(SistemaItemReferenciaTipo.ParteCorpo, "PERNA", "Perna", 4),
                Referencia(SistemaItemReferenciaTipo.ParteCorpo, "CORPO", "Corpo", 5),
                Referencia(SistemaItemReferenciaTipo.ParteCorpo, "OCULAR", "Ocular", 6),
                Referencia(SistemaItemReferenciaTipo.ParteCorpo, "OUTRO", "Outro", 7),
                Referencia(SistemaItemReferenciaTipo.Lado, "DIREITO", "Direito", 8),
                Referencia(SistemaItemReferenciaTipo.Lado, "ESQUERDO", "Esquerdo", 9),
                Referencia(SistemaItemReferenciaTipo.Lado, "AMBOS", "Ambos", 10),
                Referencia(SistemaItemReferenciaTipo.Lado, "NAO_SE_APLICA", "Não se aplica", 11),
                Referencia(SistemaItemReferenciaTipo.Material, "SIMPLES", "Simples", 12),
                Referencia(SistemaItemReferenciaTipo.Material, "CARBONO", "Carbono", 13),
                Referencia(SistemaItemReferenciaTipo.Material, "BLINDADA", "Blindada", 14),
                Referencia(SistemaItemReferenciaTipo.Material, "ARCANA", "Arcana", 15),
                Referencia(SistemaItemReferenciaTipo.Material, "TITANIO", "Titânio", 16),
                Referencia(SistemaItemReferenciaTipo.Material, "SICMITHRIL", "Sicmithril", 17),
                Referencia(SistemaItemReferenciaTipo.Material, "OUTRO", "Outro", 18),
            ]);
        SistemaItemEscopo protese = AdicionarEscopo(catalogo, implante, SistemaItemEscopoNivel.Categoria,
            "PROTESE_IMPLANTE", "Prótese / Implante", 1);
        AdicionarArquetipoImplante(catalogo, protese, "MAO", "Mão", 1, 100, 10, 10, 0, 0, 0, 0, 0);
        AdicionarArquetipoImplante(catalogo, protese, "BRACO", "Braço", 2, 200, 20, 20, 0, 1, 1, 0, 0);
        AdicionarArquetipoImplante(catalogo, protese, "PE", "Pé", 3, 100, 10, 10, 0, 0, 0, 0, 0);
        AdicionarArquetipoImplante(catalogo, protese, "PERNA", "Perna", 4, 150, 30, 20, 0, 0, 1, 0, 0);
        AdicionarArquetipoImplante(catalogo, protese, "CORPO", "Corpo", 5, 200, 30, 30, 1, 0, 0, 0, 0);
        AdicionarArquetipoImplante(catalogo, protese, "OCULAR", "Ocular", 6, 0, 0, 0, 0, 0, 1, 1, 0);
        AdicionarArquetipoImplante(catalogo, protese, "OUTRO", "Outro", 7, 200, 30, 30, 1, 1, 1, 1, 1);
    }

    private static void CriarCatalogoOutros(ICollection<SistemaItemEscopo> catalogo)
    {
        SistemaItemEscopo outro = AdicionarEscopo(
            catalogo,
            null,
            SistemaItemEscopoNivel.Tipo,
            "OUTRO",
            "Outro",
            6,
            "Itens utilitários, materiais, componentes e sucata sem um modelo mecânico mais específico.",
            campos:
            [
                Campo("DURACAO", "Duração", SistemaItemCampoTipo.Texto, 1),
                Campo("EFEITO", "Efeito", SistemaItemCampoTipo.Texto, 2),
                Campo("ESPECIAL", "Especial", SistemaItemCampoTipo.Texto, 3),
            ]);
        SistemaItemEscopo geral = AdicionarEscopo(catalogo, outro, SistemaItemEscopoNivel.Categoria,
            "GERAL", "Geral", 1);
        AdicionarEscopo(catalogo, geral, SistemaItemEscopoNivel.Arquetipo, "UTILITARIO", "Utilitário", 1);
        AdicionarEscopo(catalogo, geral, SistemaItemEscopoNivel.Arquetipo, "MODIFICACAO", "Item de modificação", 2);
        AdicionarEscopo(catalogo, geral, SistemaItemEscopoNivel.Arquetipo, "SUCATA", "Sucata / Componente", 3);
    }

    private static void AdicionarArquetipoArma(
        ICollection<SistemaItemEscopo> catalogo,
        SistemaItemEscopo categoria,
        string codigo,
        string nome,
        int ordem,
        params (string CodigoCampo, string Nome, decimal Maximo, decimal Referencia)[] faixas) =>
        AdicionarEscopo(
            catalogo,
            categoria,
            SistemaItemEscopoNivel.Arquetipo,
            codigo,
            nome,
            ordem,
            faixas: faixas.Select((faixa, index) => Faixa(
                faixa.CodigoCampo,
                faixa.Nome,
                faixa.Maximo,
                faixa.Referencia,
                index + 1,
                "dano")).ToList());

    private static void AdicionarArquetipoDefesa(
        ICollection<SistemaItemEscopo> catalogo,
        SistemaItemEscopo categoria,
        string codigo,
        string nome,
        int ordem,
        decimal protecao,
        decimal escudo,
        decimal armadura) =>
        AdicionarEscopo(
            catalogo,
            categoria,
            SistemaItemEscopoNivel.Arquetipo,
            codigo,
            nome,
            ordem,
            faixas:
            [
                Faixa("PROTECAO_BASE", "Proteção base", 1_200, protecao, 1, "defesa"),
                Faixa("ESCUDO_BASE", "Escudo base", 3_000, escudo, 2, "defesa"),
                Faixa("ARMADURA_BASE", "Armadura base", 500, armadura, 3, "defesa"),
            ]);

    private static void AdicionarArquetipoImplante(
        ICollection<SistemaItemEscopo> catalogo,
        SistemaItemEscopo categoria,
        string codigo,
        string nome,
        int ordem,
        decimal vida,
        decimal estamina,
        decimal mana,
        decimal resistencia,
        decimal forca,
        decimal agilidade,
        decimal precisao,
        decimal sabedoria) =>
        AdicionarEscopo(
            catalogo,
            categoria,
            SistemaItemEscopoNivel.Arquetipo,
            codigo,
            nome,
            ordem,
            faixas:
            [
                Faixa("BONUS_VIDA", "Bônus de vida", 1_000, vida, 1, "vida"),
                Faixa("BONUS_ESTAMINA", "Bônus de estamina", 100, estamina, 2, "estamina"),
                Faixa("BONUS_MANA", "Bônus de mana", 100, mana, 3, "mana"),
                Faixa("BONUS_RESISTENCIA", "Bônus de resistência", 6, resistencia, 4),
                Faixa("BONUS_FORCA", "Bônus de força", 6, forca, 5),
                Faixa("BONUS_AGILIDADE", "Bônus de agilidade", 6, agilidade, 6),
                Faixa("BONUS_PRECISAO", "Bônus de precisão", 6, precisao, 7),
                Faixa("BONUS_SABEDORIA", "Bônus de sabedoria", 6, sabedoria, 8),
            ]);

    private static SistemaItemEscopo AdicionarEscopo(
        ICollection<SistemaItemEscopo> catalogo,
        SistemaItemEscopo? pai,
        SistemaItemEscopoNivel nivel,
        string codigo,
        string nome,
        int ordem,
        string? descricao = null,
        IEnumerable<SistemaItemCampo>? campos = null,
        IEnumerable<SistemaItemFaixa>? faixas = null,
        IEnumerable<SistemaItemReferencia>? referencias = null)
    {
        SistemaItemEscopo escopo = new()
        {
            EscopoPai = pai,
            Nivel = nivel,
            Codigo = codigo,
            CodigoCaminho = pai is null ? codigo : $"{pai.CodigoCaminho}/{codigo}",
            Nome = nome,
            Descricao = descricao,
            Ordem = ordem,
            Ativo = true,
            Campos = campos?.ToList() ?? new List<SistemaItemCampo>(),
            Faixas = faixas?.ToList() ?? new List<SistemaItemFaixa>(),
            Referencias = referencias?.ToList() ?? new List<SistemaItemReferencia>(),
        };
        pai?.Filhos.Add(escopo);
        catalogo.Add(escopo);
        return escopo;
    }

    private static SistemaItemCampo Campo(
        string codigo,
        string nome,
        SistemaItemCampoTipo tipo,
        int ordem,
        string? unidade = null) => new()
    {
        Codigo = codigo,
        Nome = nome,
        Tipo = tipo,
        Unidade = unidade,
        Obrigatorio = false,
        Ordem = ordem,
    };

    private static SistemaItemFaixa Faixa(
        string codigoCampo,
        string nome,
        decimal maximo,
        decimal referencia,
        int ordem,
        string? unidade = null) => new()
    {
        CodigoCampo = codigoCampo,
        Nome = nome,
        ValorMinimo = 0,
        ValorMaximo = maximo,
        ValorReferencia = referencia,
        Unidade = unidade,
        Descricao = "O máximo define a escala conhecida do arquétipo amplo; a referência marca o maior valor comum conhecido nesta categoria.",
        Ordem = ordem,
    };

    private static SistemaItemReferencia Referencia(
        SistemaItemReferenciaTipo tipo,
        string codigo,
        string nome,
        int ordem) => new()
    {
        Tipo = tipo,
        Codigo = codigo,
        Nome = nome,
        Valor = codigo,
        Ordem = ordem,
    };
}
