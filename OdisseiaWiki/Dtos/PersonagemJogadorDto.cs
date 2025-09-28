public class PersonagemJogadorDto
{
    public int Idmesa { get; set; }
    public int Idusuario { get; set; }
    public string? InfoSecundariasJson { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Alinhamento { get; set; }
    public string? Historia { get; set; }
    public List<string>? Costumes { get; set; }
    public List<string>? Tracos { get; set; }
    public string? Imagem { get; set; }
    public int? Nanites { get; set; }
    public int Idcidade { get; set; }
    public int Idraca { get; set; }

    public object? InventarioJson { get; set; }
    public object? Skills { get; set; }
    public object? Magia { get; set; }
    public object? StatusJson { get; set; }
    public List<string>? PersonagemsVinculados { get; set; }
    public DateTime DataCriacao { get; set; }
}
