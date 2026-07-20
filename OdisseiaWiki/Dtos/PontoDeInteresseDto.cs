using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Dtos
{
    public class PontoDeInteresseDto
    {
        [MaxLength(100)]
        public string? Nome { get; set; }

        [MaxLength(300)]
        public string? Descricao { get; set; }

        [MaxLength(2048)]
        public string? Imagem { get; set; }

        // Compatibilidade de leitura com os registros antigos vinculados a InfoLore.
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? Id { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Titulo { get; set; }
    }
}
