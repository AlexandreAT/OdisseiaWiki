using System.Text.Json;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public class MesaEntidadeConfigDto
{
    public int Idmesa { get; set; }
    public MesaEntidadeTipo TipoEntidade { get; set; }
    public string Identidade { get; set; } = null!;
    public JsonElement ConfigJson { get; set; }
    public int Idusuario { get; set; }
    public DateTime DataCriacao { get; set; }
    public DateTime DataAtualizacao { get; set; }
}
