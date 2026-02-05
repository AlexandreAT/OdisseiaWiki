namespace OdisseiaWiki.Dtos
{
    public class PersonagemDto
    {
        public string Nome { get; set; } = null!;
        public int Idraca { get; set; }
        public int? Idcidade { get; set; }
        public string? Historia { get; set; }
        public string? Imagem { get; set; }
        public List<string>? GaleriaImagem { get; set; }
        public List<string>? Costumes { get; set; }
        public string? Alinhamento { get; set; }
        public List<string>? Tracos { get; set; }
        public int? Nanites { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; } = true;

        public PersonagemStatus? StatusJson { get; set; }
        public List<Item>? InventarioJson { get; set; }
        public List<Skills>? Skills { get; set; }
        public List<Magia>? Magia { get; set; }
        public List<int>? PersonagemsVinculados { get; set; }
    }

    // ---- Subtipos ----

    public class PersonagemStatus
    {
        public StatusBase status { get; set; } = null!;
        public Atributos atributos { get; set; } = null!;
        public int nivel { get; set; }
        public int xp { get; set; }
        public Defesas defesas { get; set; } = null!;
    }

    public class StatusBase
    {
        public int vida { get; set; }
        public int estamina { get; set; }
        public int mana { get; set; }
        public int capacidadeCarga { get; set; }
    }

    public class Atributos
    {
        public Principais principais { get; set; } = null!;
        public Secundarios secundarios { get; set; } = null!;
    }

    public class Principais
    {
        public int resistencia { get; set; }
        public int agilidade { get; set; }
        public int sabedoria { get; set; }
        public int precisao { get; set; }
        public int forca { get; set; }
    }

    public class Secundarios
    {
        public int sanidade { get; set; }
        public int coragem { get; set; }
        public int inteligencia { get; set; }
        public int percepcao { get; set; }
        public int labia { get; set; }
        public int intimidacao { get; set; }
    }

    public class Defesas
    {
        public int armadura { get; set; }
        public int protecao { get; set; }
        public int escudo { get; set; }
        public int outras { get; set; }
    }

    // ---- Inventário, Skills e Magia ----

    public class Item
    {
        public string id { get; set; } = null!;
        public string? idItemBase { get; set; }
        public string nome { get; set; } = null!;
        public string tipo { get; set; } = null!;
        public int quantidade { get; set; }
        public int? peso { get; set; }
        public string descricao { get; set; } = "";
        public object? atributos { get; set; }
    }

    public class Skills
    {
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
        public string id { get; set; } = null!;
        public string nome { get; set; } = null!;
        public string tipo { get; set; } = null!;
        public string[] elemento { get; set; } = Array.Empty<string>();
        public string custo { get; set; } = "";
        public object atributos { get; set; } = new { };
    }
}
