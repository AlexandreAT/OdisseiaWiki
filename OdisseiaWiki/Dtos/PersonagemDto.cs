using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Dtos
{
    public class PersonagemDto
    {
        public string Nome { get; set; } = null!;
        public int Idraca { get; set; }
        public int? Idcidade { get; set; }
        public JsonElement? Historia { get; set; }
        public string? Imagem { get; set; }
        public List<ImagemGaleriaDto>? GaleriaImagem { get; set; }
        public List<string>? Costumes { get; set; }
        public string? Alinhamento { get; set; }
        public List<string>? Tracos { get; set; }
        public int? Nanites { get; set; }
        public List<string>? Tags { get; set; }
        public List<int>? Implantes { get; set; }
        public int? Idpassiva { get; set; }
        public bool Visivel { get; set; } = true;
        public bool Destaque { get; set; } = false;
        public int? IdSistemaRpg { get; set; }
        public int? IdSistemaVersao { get; set; }
        public bool? AcompanharPublicacaoAtual { get; set; }
        public Ultimate? Ultimate { get; set; }

        public PersonagemStatus? StatusJson { get; set; }
        public List<Item>? InventarioJson { get; set; }
        public List<Skills>? Skills { get; set; }
        public List<Magia>? Magia { get; set; }
        public List<int>? PersonagemsVinculados { get; set; }
    }

    public class PersonagemStatus : PersonagemFichaStatus
    {
        public bool generico { get; set; }
        public List<PersonagemVariante> variantes { get; set; } = new();
    }

    public class PersonagemVariante
    {
        public string id { get; set; } = "";
        public string nome { get; set; } = "";
        public PersonagemFichaStatus statusJson { get; set; } = null!;
        public List<Item> inventarioJson { get; set; } = new();
        public List<Skills> skills { get; set; } = new();
        public List<Magia> magia { get; set; } = new();
    }

    public class PersonagemFichaStatus
    {
        public StatusBase status { get; set; } = null!;
        public Atributos atributos { get; set; } = null!;
        public int nivel { get; set; }
        public int xp { get; set; }
        public int pontos { get; set; }
        public int pontosAtributo { get; set; }
        public int pontosSkill { get; set; }
        public int pontosUltimate { get; set; }
        public List<string> condicioes { get; set; } = new();
        public Defesas defesas { get; set; } = null!;
    }

    public abstract class PersonagemCamposNumericos
    {
        [JsonExtensionData]
        public Dictionary<string, JsonElement>? CamposAdicionais { get; set; }
    }

    public class StatusBase : PersonagemCamposNumericos
    {
        public int vida { get; set; }
        public int vidaMaxima { get; set; }
        public int estamina { get; set; }
        public int estaminaMaxima { get; set; }
        public int mana { get; set; }
        public int manaMaxima { get; set; }
        public int capacidadeCarga { get; set; }
    }

    public class Atributos
    {
        public Principais principais { get; set; } = null!;
        public Secundarios secundarios { get; set; } = null!;
    }

    public class Principais : PersonagemCamposNumericos
    {
        public int resistencia { get; set; }
        public int agilidade { get; set; }
        public int sabedoria { get; set; }
        public int precisao { get; set; }
        public int forca { get; set; }
    }

    public class Secundarios : PersonagemCamposNumericos
    {
        public int sanidade { get; set; }
        public int coragem { get; set; }
        public int inteligencia { get; set; }
        public int percepcao { get; set; }
        public int labia { get; set; }
        public int intimidacao { get; set; }
    }

    public class Defesas : PersonagemCamposNumericos
    {
        public int armadura { get; set; }
        public int protecao { get; set; }
        public int escudo { get; set; }
        public int outras { get; set; }
    }

    public class Item
    {
        public string id { get; set; } = null!;
        public string? idItemBase { get; set; }
        public string nome { get; set; } = null!;
        public string tipo { get; set; } = null!;
        public int quantidade { get; set; }
        public int? peso { get; set; }
        public int? discricao { get; set; }
        public string descricao { get; set; } = "";
        public string? efeito { get; set; }
        public string? imagem { get; set; }
        public object? atributos { get; set; }
        public List<string>? tags { get; set; }
    }

    public class Skills
    {
        public string? imagem { get; set; }
        public string? efeito { get; set; }
        public string id { get; set; } = null!;
        public string nome { get; set; } = null!;
        public string tipo { get; set; } = null!;
        public string[] elemento { get; set; } = Array.Empty<string>();
        public string custo { get; set; } = "";
        public int nivel { get; set; }
        public object atributos { get; set; } = new { };
    }

    public class Magia
    {
        public string? imagem { get; set; }
        public string? efeito { get; set; }
        public string id { get; set; } = null!;
        public string nome { get; set; } = null!;
        public string tipo { get; set; } = null!;
        public string[] elemento { get; set; } = Array.Empty<string>();
        public string custo { get; set; } = "";
        public object atributos { get; set; } = new { };
    }

    public class Ultimate
    {
        public string id { get; set; } = null!;
        public string nome { get; set; } = null!;
        public string tipo { get; set; } = null!;
        public string[] elemento { get; set; } = Array.Empty<string>();
        public string custo { get; set; } = "";
        public int nivel { get; set; }
        public object atributos { get; set; } = new();
    }
}
