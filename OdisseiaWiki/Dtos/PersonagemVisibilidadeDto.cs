using OdisseiaWiki.Models;

namespace OdisseiaWiki.Dtos;

/// <summary>
/// Defines which parts of a character sheet may be shown to viewers.
/// This is intentionally independent from the whole-character <c>Visivel</c> flag.
/// </summary>
public sealed class PersonagemVisibilidadeDto
{
    public bool Vida { get; set; }
    public bool Estamina { get; set; }
    public bool Mana { get; set; }
    public bool CapacidadeCarga { get; set; }
    public bool AtributosPrincipais { get; set; }
    public bool AtributosSecundarios { get; set; }
    public bool Defesas { get; set; }
    public bool Imagem { get; set; }
    public bool Historia { get; set; }
    public bool Raca { get; set; }
    public bool Cidade { get; set; }
    public bool Nome { get; set; }
    public bool Alinhamento { get; set; }
    public bool TracosPersonalidade { get; set; }
    public bool PersonagensRelacionados { get; set; }
    public bool Inventario { get; set; }
    public bool Proteses { get; set; }
    public bool Passivas { get; set; }
    public bool Ultimate { get; set; }
    public bool Skills { get; set; }
    public bool Magias { get; set; }
    public bool Galeria { get; set; }
    public bool Xp { get; set; }
    public bool Nivel { get; set; }
}

public sealed class AtualizarVisivelDto
{
    public bool Visivel { get; set; }
}

public sealed class ResultPersonagemVisibilidade
{
    public bool Sucesso { get; init; }
    public bool NaoEncontrado { get; init; }
    public bool SemPermissao { get; init; }
    public string? MensagemErro { get; init; }
    public PersonagemVisibilidadeDto? Visibilidade { get; init; }

    public static ResultPersonagemVisibilidade Ok(PersonagemVisibilidadeDto visibilidade) => new()
    {
        Sucesso = true,
        Visibilidade = visibilidade,
    };

    public static ResultPersonagemVisibilidade NotFound(string mensagem) => new()
    {
        NaoEncontrado = true,
        MensagemErro = mensagem,
    };

    public static ResultPersonagemVisibilidade Forbidden(string mensagem) => new()
    {
        SemPermissao = true,
        MensagemErro = mensagem,
    };
}

public static class PersonagemVisibilidadeDefaults
{
    public static PersonagemVisibilidadeDto Npc() => new()
    {
        Vida = true,
        Estamina = true,
        Mana = true,
        CapacidadeCarga = true,
        AtributosPrincipais = true,
        AtributosSecundarios = true,
        Defesas = true,
        Imagem = true,
        Historia = false,
        Raca = true,
        Cidade = true,
        Nome = true,
        Alinhamento = true,
        TracosPersonalidade = true,
        PersonagensRelacionados = true,
        Inventario = false,
        Proteses = true,
        Passivas = false,
        Ultimate = false,
        Skills = false,
        Magias = false,
        Galeria = true,
        Xp = false,
        Nivel = false,
    };

    public static PersonagemVisibilidadeDto Jogador() => new()
    {
        Vida = true,
        Estamina = true,
        Mana = true,
        CapacidadeCarga = true,
        AtributosPrincipais = true,
        AtributosSecundarios = true,
        Defesas = true,
        Imagem = true,
        Historia = true,
        Raca = true,
        Cidade = true,
        Nome = true,
        Alinhamento = true,
        TracosPersonalidade = true,
        PersonagensRelacionados = true,
        Inventario = true,
        Proteses = true,
        Passivas = true,
        Ultimate = true,
        Skills = true,
        Magias = true,
        Galeria = true,
        Xp = true,
        Nivel = true,
    };

    public static PersonagemVisibilidadeDto FromEntity(
        PersonagemVisibilidade? configuracao,
        bool personagemJogador)
    {
        if (configuracao is null)
            return personagemJogador ? Jogador() : Npc();

        return new PersonagemVisibilidadeDto
        {
            Vida = configuracao.Vida,
            Estamina = configuracao.Estamina,
            Mana = configuracao.Mana,
            CapacidadeCarga = configuracao.CapacidadeCarga,
            AtributosPrincipais = configuracao.AtributosPrincipais,
            AtributosSecundarios = configuracao.AtributosSecundarios,
            Defesas = configuracao.Defesas,
            Imagem = configuracao.Imagem,
            Historia = configuracao.Historia,
            Raca = configuracao.Raca,
            Cidade = configuracao.Cidade,
            Nome = configuracao.Nome,
            Alinhamento = configuracao.Alinhamento,
            TracosPersonalidade = configuracao.TracosPersonalidade,
            PersonagensRelacionados = configuracao.PersonagensRelacionados,
            Inventario = configuracao.Inventario,
            Proteses = configuracao.Proteses,
            Passivas = configuracao.Passivas,
            Ultimate = configuracao.Ultimate,
            Skills = configuracao.Skills,
            Magias = configuracao.Magias,
            Galeria = configuracao.Galeria,
            Xp = configuracao.Xp,
            Nivel = configuracao.Nivel,
        };
    }

    public static void ApplyToEntity(
        PersonagemVisibilidade configuracao,
        PersonagemVisibilidadeDto dto)
    {
        configuracao.Vida = dto.Vida;
        configuracao.Estamina = dto.Estamina;
        configuracao.Mana = dto.Mana;
        configuracao.CapacidadeCarga = dto.CapacidadeCarga;
        configuracao.AtributosPrincipais = dto.AtributosPrincipais;
        configuracao.AtributosSecundarios = dto.AtributosSecundarios;
        configuracao.Defesas = dto.Defesas;
        configuracao.Imagem = dto.Imagem;
        configuracao.Historia = dto.Historia;
        configuracao.Raca = dto.Raca;
        configuracao.Cidade = dto.Cidade;
        configuracao.Nome = dto.Nome;
        configuracao.Alinhamento = dto.Alinhamento;
        configuracao.TracosPersonalidade = dto.TracosPersonalidade;
        configuracao.PersonagensRelacionados = dto.PersonagensRelacionados;
        configuracao.Inventario = dto.Inventario;
        configuracao.Proteses = dto.Proteses;
        configuracao.Passivas = dto.Passivas;
        configuracao.Ultimate = dto.Ultimate;
        configuracao.Skills = dto.Skills;
        configuracao.Magias = dto.Magias;
        configuracao.Galeria = dto.Galeria;
        configuracao.Xp = dto.Xp;
        configuracao.Nivel = dto.Nivel;
    }

    public static PersonagemVisibilidade CreateEntity(
        int? idPersonagem,
        int? idPersonagemJogador,
        PersonagemVisibilidadeDto dto) => new()
    {
        Idpersonagem = idPersonagem,
        IdpersonagemJogador = idPersonagemJogador,
        DataCriacao = DateTime.UtcNow,
        DataAtualizacao = DateTime.UtcNow,
        Vida = dto.Vida,
        Estamina = dto.Estamina,
        Mana = dto.Mana,
        CapacidadeCarga = dto.CapacidadeCarga,
        AtributosPrincipais = dto.AtributosPrincipais,
        AtributosSecundarios = dto.AtributosSecundarios,
        Defesas = dto.Defesas,
        Imagem = dto.Imagem,
        Historia = dto.Historia,
        Raca = dto.Raca,
        Cidade = dto.Cidade,
        Nome = dto.Nome,
        Alinhamento = dto.Alinhamento,
        TracosPersonalidade = dto.TracosPersonalidade,
        PersonagensRelacionados = dto.PersonagensRelacionados,
        Inventario = dto.Inventario,
        Proteses = dto.Proteses,
        Passivas = dto.Passivas,
        Ultimate = dto.Ultimate,
        Skills = dto.Skills,
        Magias = dto.Magias,
        Galeria = dto.Galeria,
        Xp = dto.Xp,
        Nivel = dto.Nivel,
    };
}
