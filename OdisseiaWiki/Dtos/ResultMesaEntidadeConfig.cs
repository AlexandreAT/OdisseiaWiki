namespace OdisseiaWiki.Dtos;

public class ResultMesaEntidadeConfig
{
    public bool Sucesso { get; set; }
    public string? MensagemErro { get; set; }
    public MesaEntidadeConfigDto? Configuracao { get; set; }

    public static ResultMesaEntidadeConfig Ok(MesaEntidadeConfigDto configuracao) => new() { Sucesso = true, Configuracao = configuracao };
    public static ResultMesaEntidadeConfig Fail(string mensagem) => new() { Sucesso = false, MensagemErro = mensagem };
}
