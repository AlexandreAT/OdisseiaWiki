# Prova de conceito do combate automático

Esta camada recebe um `GameBattleInput` construído pelo backend a partir de dois snapshots independentes e das regras executáveis de uma versão publicada do Sistema. A ordem dos atores no contrato é a ordem dos turnos. A ordem das ações de cada ator é sua prioridade. O simulador só lê a entrada e devolve estado final e eventos; não consulta a ficha original, a Mesa ou o banco.

Restrições deliberadas desta etapa:

- Um ator por lado, um ataque de `1D20` por ativação e uma ação por turno. Rajadas, múltiplos inimigos, efeitos narrativos, condições, XP e recompensas aguardam contratos próprios.
- Faixas de resultado, escolha entre total/natural e dano por código precisam estar resolvidos no input. Natural 1/20 só tem tratamento especial se houver uma faixa publicada com `RequiresNatural`. O dano crítico também é explícito em `DamageByResultCode`.
- Mana e estamina são gastos ao executar a ação, inclusive quando o teste falha. A munição é consumida por ativação. Após esgotar a arma, a primeira passagem seguinte tenta as outras ações equipadas sem recarregar; numa passagem posterior, só recarrega quando nenhuma delas está executável, consumindo o turno. Uma arma sem alternativa pode recarregar no turno seguinte. Uma reserva explícita é finita; sem reserva configurada, a run permite recargas durante o encontro. O carregador volta cheio após o combate. O log mantém o consumo real.
- `CooldownTurns = N` impede a ação pelos próximos N turnos do próprio ator. A prioridade é reavaliada no início de cada turno.
- Escudo absorve até seu valor numérico e termina no primeiro impacto positivo; proteção é uma reserva com transbordo e armadura absorve por golpe sem desgaste. A combinação exige `DefenseOrder` explícita. Quebra da armadura, tipos de dano e resistências ainda não têm contrato executável.
- `MaxRounds`, `MaxEvents` e `MaxRoundsWithoutDamage` encerram batalhas longas de modo inconclusivo. Progresso significa redução de vida, escudo ou proteção; golpes inteiramente absorvidos por armadura não reiniciam esse contador. O limite de eventos reserva o pior caso de um turno inteiro para nunca truncar uma ação pela metade.

`SeededGameRunRandomSource` permite repetir a resolução a partir de uma seed definida pelo servidor. O log guarda todos os dados rolados; uma futura `GameRunBattle` deve persistir o log e os snapshots antes da animação. A seed e as regras executáveis não devem ser aceitas do cliente como autoridade para mutações da run.
