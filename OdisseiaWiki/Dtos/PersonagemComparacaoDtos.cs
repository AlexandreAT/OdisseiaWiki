namespace OdisseiaWiki.Dtos;

public enum PersonagemComparacaoOrigem
{
    Npc,
    Jogador,
}

public sealed class PersonagemComparacaoStatusDto
{
    public decimal Vida { get; set; }
    public decimal Estamina { get; set; }
    public decimal Mana { get; set; }
    public decimal Resistencia { get; set; }
    public decimal Agilidade { get; set; }
    public decimal Sabedoria { get; set; }
    public decimal Precisao { get; set; }
    public decimal Forca { get; set; }
    public decimal Escudo { get; set; }
    public decimal Protecao { get; set; }
    public decimal Armadura { get; set; }
    public decimal Outras { get; set; }
    public int Nivel { get; set; } = 1;
}

public sealed class PersonagemComparacaoDto
{
    public int Id { get; set; }
    public PersonagemComparacaoOrigem Origem { get; set; }
    public string? Nome { get; set; }
    public string? Imagem { get; set; }
    public int? IdMesa { get; set; }
    public string? MesaNome { get; set; }
    public int QuantidadeSkills { get; set; }
    public PersonagemComparacaoStatusDto Status { get; set; } = new();
    public PersonagemComparacaoSistemaDto? SistemaRuntime { get; set; }
    public PersonagemVisibilidadeDto Visibilidade { get; set; } = PersonagemVisibilidadeDefaults.Npc();
}

public sealed class PersonagemComparacaoSistemaDto
{
    public int? IdSistemaRpg { get; set; }
    public int? IdSistemaVersao { get; set; }
    public string CodigoSistema { get; set; } = "ODISSEIA";
    public string? NomeSistema { get; set; }
    public string NumeroVersao { get; set; } = "LEGACY";
    public bool UsaFallbackLegado { get; set; }
    public Dictionary<string, decimal> Escalas { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class PersonagemComparacaoPesquisaResultadoDto
{
    public bool AcessoPermitido { get; set; } = true;
    public List<PersonagemComparacaoDto> Personagens { get; set; } = new();
}
