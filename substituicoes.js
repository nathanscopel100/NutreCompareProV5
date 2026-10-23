/* =================================================================
   SUBSTITUIÇÕES — conteúdo da aba "Mapa de Substituições".

   ⚠ RASCUNHO (23/10/2026), escrito pela IA a pedido do Nathan, com base em
   conhecimento geral de nutrição animal. NÃO tem fonte registrada e NÃO foi
   revisado por nutricionista. O app mostra esse aviso na aba.

   Aqui ficam só TEXTOS e JULGAMENTOS (o que substitui o quê, em que espécie,
   com que cuidado). Os números das vantagens/desvantagens NÃO moram aqui:
   são calculados na hora a partir da base (dados.js) por compararTroca(),
   em calculos.js.

   Níveis: "ok" = aconselhável · "restr" = possível com restrições ·
           "nao" = não recomendado.
   Nenhum limite de inclusão em % foi escrito de propósito: limite é regra
   nutricional e precisa de fonte.
   ================================================================= */

const SUBST_RASCUNHO=true;

/* Diferença menor que isto (em % sobre quem sai) aparece como "parecido". */
const LIMIAR_TROCA=10;

/* Parâmetros comparados em cada espécie e o sentido:
   +1 = mais é melhor · −1 = menos é melhor · 0 = só informar (depende da dieta). */
const SUBST_ESPECIES=[
  {nome:"Bovino de corte",criterios:[
    {p:"Proteína Bruta",dir:1},{p:"Energia Metabolizável - Bovinos",dir:1},{p:"NDT",dir:1},
    {p:"Extrato Etéreo",dir:0},{p:"FDN",dir:0},{p:"FDA",dir:-1},{p:"PNDR",dir:0}]},
  {nome:"Bovino de leite",criterios:[
    {p:"Proteína Bruta",dir:1},{p:"Energia Metabolizável - Bovinos",dir:1},{p:"NDT",dir:1},
    {p:"PNDR",dir:1},{p:"Extrato Etéreo",dir:0},{p:"FDN",dir:0},{p:"FDA",dir:-1}]},
  {nome:"Aves",criterios:[
    {p:"Proteína Bruta",dir:1},{p:"Energia Metabolizável - Aves",dir:1},{p:"Lisina",dir:1},
    {p:"Metionina",dir:1},{p:"Treonina",dir:1},{p:"Fibra Bruta",dir:-1},{p:"FDN",dir:-1},
    {p:"Extrato Etéreo",dir:0}]},
  {nome:"Suínos",criterios:[
    {p:"Proteína Bruta",dir:1},{p:"Energia Metabolizável - Suínos",dir:1},{p:"Lisina",dir:1},
    {p:"Treonina",dir:1},{p:"Triptofano",dir:1},{p:"Fibra Bruta",dir:-1},{p:"FDN",dir:-1},
    {p:"Extrato Etéreo",dir:0}]},
];

/* Restrição de uso da própria commodity numa espécie (aparece no topo do fluxograma). */
const SUBST_USO={
  "Caroço de Algodão":{"Aves":["nao","Gossipol livre e fibra alta: não é usado para aves."],
                       "Suínos":["nao","Gossipol livre e fibra alta: não é usado para suínos."]},
  "Farelo de Glúten 21":{"Aves":["restr","Fibra alta e energia baixa para aves: uso limitado."],
                         "Suínos":["restr","Fibra alta e energia baixa para suínos: uso limitado."]},
  "Farelo de Amendoim":{"Bovino de corte":["restr","Risco de aflatoxina: só usar lote com laudo."],
                        "Bovino de leite":["restr","Aflatoxina passa para o leite (M1): só lote com laudo."],
                        "Aves":["restr","Aves são muito sensíveis à aflatoxina: só lote com laudo."],
                        "Suínos":["restr","Suínos são sensíveis à aflatoxina: só lote com laudo."]},
  "Farelo de Algodão":{"Aves":["restr","Gossipol e lisina baixa: uso limitado."],
                       "Suínos":["restr","Gossipol e lisina baixa: uso limitado."]},
  "DDGS":{"Aves":["restr","Fibra, lisina de digestibilidade variável e micotoxinas concentradas: uso limitado."],
          "Suínos":["restr","Fibra, gordura insaturada e micotoxinas concentradas: uso limitado."]},
};

/* de = sai da ração · para = entra no lugar.
   geral = o que muda na troca · esp = {espécie: [nível, quando/como usar]} */
const SUBST=[
  /* ---------- Milho ---------- */
  {de:"Milho",para:"Sorgo",geral:"Substituto energético mais direto do milho: perfil parecido, normalmente mais barato.",esp:{
    "Bovino de corte":["ok","Moer fino ou flocular: grão inteiro de sorgo tem amido pouco aproveitado no rúmen."],
    "Bovino de leite":["ok","Mesmo cuidado de processamento; floculado funciona bem em vacas de alta produção."],
    "Aves":["ok","Usar híbrido de baixo tanino. Tem menos pigmento: pele e gema mais claras, pode exigir pigmentante."],
    "Suínos":["ok","Usar híbrido de baixo tanino e moagem fina."]}},
  {de:"Milho",para:"Gérmen Magro",geral:"Coproduto da moagem do milho: menos amido e mais fibra que o grão.",esp:{
    "Bovino de corte":["ok","Boa troca parcial: a fibra digestível ajuda a reduzir o risco de acidose."],
    "Bovino de leite":["ok","Troca parcial; conferir a gordura do lote, que varia entre fornecedores."],
    "Aves":["restr","Só parcial: energia menor e fibra maior. Reajustar a energia da ração."],
    "Suínos":["restr","Só parcial: mais fibra reduz a energia; gordura pode rançar em estocagem longa."]}},
  {de:"Milho",para:"Farelo de Glúten 21",geral:"Troca energia de amido por fibra digestível e mais proteína.",esp:{
    "Bovino de corte":["ok","Comum em confinamento: reduz amido e risco de acidose. Conferir umidade e enxofre do lote."],
    "Bovino de leite":["ok","Troca parcial; a fibra digestível ajuda a sustentar a gordura do leite."],
    "Aves":["nao","Fibra alta e energia baixa para aves: não substitui o milho."],
    "Suínos":["nao","Fibra alta e energia baixa para suínos em crescimento: não substitui o milho."]}},
  {de:"Milho",para:"DDGS",geral:"Troca parte do amido por proteína, gordura e fibra.",esp:{
    "Bovino de corte":["ok","Troca parcial; traz proteína junto com energia. Atenção ao enxofre e à gordura total da dieta."],
    "Bovino de leite":["restr","Só parcial: gordura insaturada em excesso pode derrubar a gordura do leite."],
    "Aves":["restr","Só parcial: energia menor, lisina pouco digestível, micotoxinas concentradas."],
    "Suínos":["restr","Só parcial: gordura insaturada deixa o toucinho mole; atenção a micotoxinas."]}},

  /* ---------- Sorgo ---------- */
  {de:"Sorgo",para:"Milho",geral:"Volta ao energético de referência: perfil parecido, mais pigmento e amido mais digestível.",esp:{
    "Bovino de corte":["ok","Troca direta; o amido do milho é mais aproveitado no rúmen."],
    "Bovino de leite":["ok","Troca direta."],
    "Aves":["ok","Troca direta; melhora a cor de pele e gema."],
    "Suínos":["ok","Troca direta."]}},
  {de:"Sorgo",para:"Gérmen Magro",geral:"Menos amido e mais fibra que o sorgo.",esp:{
    "Bovino de corte":["ok","Troca parcial; fibra digestível reduz risco de acidose."],
    "Bovino de leite":["ok","Troca parcial; conferir a gordura do lote."],
    "Aves":["restr","Só parcial: energia menor e fibra maior."],
    "Suínos":["restr","Só parcial: energia menor e fibra maior."]}},
  {de:"Sorgo",para:"Farelo de Glúten 21",geral:"Troca amido por fibra digestível e mais proteína.",esp:{
    "Bovino de corte":["ok","Comum em confinamento; conferir umidade e enxofre do lote."],
    "Bovino de leite":["ok","Troca parcial."],
    "Aves":["nao","Fibra alta e energia baixa para aves."],
    "Suínos":["nao","Fibra alta e energia baixa para suínos."]}},

  /* ---------- Gérmen Magro ---------- */
  {de:"Gérmen Magro",para:"Milho",geral:"Mais amido e energia, menos fibra.",esp:{
    "Bovino de corte":["ok","Mais amido: aumentar aos poucos, com adaptação, para evitar acidose."],
    "Bovino de leite":["ok","Mais amido: ajustar a fibra efetiva da dieta."],
    "Aves":["ok","Troca direta; ganha energia."],
    "Suínos":["ok","Troca direta; ganha energia."]}},
  {de:"Gérmen Magro",para:"Sorgo",geral:"Mais amido, menos fibra; precisa de processamento do grão.",esp:{
    "Bovino de corte":["ok","Moer fino ou flocular; adaptar ao amido."],
    "Bovino de leite":["ok","Moer fino ou flocular."],
    "Aves":["ok","Híbrido de baixo tanino; menos pigmento."],
    "Suínos":["ok","Híbrido de baixo tanino; moagem fina."]}},
  {de:"Gérmen Magro",para:"Farelo de Glúten 21",geral:"Os dois são fibrosos; o glúten tem mais proteína.",esp:{
    "Bovino de corte":["ok","Troca direta; conferir umidade e enxofre."],
    "Bovino de leite":["ok","Troca direta."],
    "Aves":["nao","Fibra alta e energia baixa para aves."],
    "Suínos":["nao","Fibra alta e energia baixa para suínos."]}},

  /* ---------- Farelo de Glúten 21 ---------- */
  {de:"Farelo de Glúten 21",para:"DDGS",geral:"Os dois são coprodutos do milho com fibra digestível; o DDGS tem mais proteína e gordura.",esp:{
    "Bovino de corte":["ok","Troca direta; atenção à gordura total e ao enxofre."],
    "Bovino de leite":["ok","Atenção à gordura insaturada, que pode baixar a gordura do leite."],
    "Aves":["restr","Só parcial: lisina pouco digestível e micotoxinas."],
    "Suínos":["restr","Só parcial: gordura insaturada e micotoxinas."]}},
  {de:"Farelo de Glúten 21",para:"Caroço de Algodão",geral:"Troca por fonte de gordura, fibra e proteína ao mesmo tempo.",esp:{
    "Bovino de corte":["restr","Limitar pela gordura total e pelo gossipol; evitar em touros reprodutores."],
    "Bovino de leite":["ok","Clássico em leite; limitar pela gordura total e pelo gossipol."],
    "Aves":["nao","Gossipol e fibra: não indicado."],
    "Suínos":["nao","Gossipol e fibra: não indicado."]}},
  {de:"Farelo de Glúten 21",para:"Gérmen Magro",geral:"Perfil fibroso parecido, com menos proteína.",esp:{
    "Bovino de corte":["ok","Pode exigir uma fonte de proteína complementar."],
    "Bovino de leite":["ok","Pode exigir uma fonte de proteína complementar."],
    "Aves":["restr","Fibra alta; só parcial."],
    "Suínos":["restr","Fibra alta; só parcial."]}},
  {de:"Farelo de Glúten 21",para:"Milho",geral:"Troca fibra digestível por amido; perde proteína.",esp:{
    "Bovino de corte":["ok","Mais amido: adaptar para evitar acidose; repor a proteína."],
    "Bovino de leite":["ok","Mais amido: ajustar fibra efetiva e proteína."],
    "Aves":["ok","Ganha energia; repor a proteína."],
    "Suínos":["ok","Ganha energia; repor a proteína."]}},

  /* ---------- Caroço de Algodão ---------- */
  {de:"Caroço de Algodão",para:"Farelo de Glúten 21",geral:"Perde gordura e energia, mantém fibra digestível.",esp:{
    "Bovino de corte":["ok","Repor energia se a gordura do caroço fazia falta."],
    "Bovino de leite":["ok","Repor energia; a gordura do leite tende a se manter pela fibra."],
    "Aves":["nao","Caroço não é usado em aves; troca sem aplicação prática."],
    "Suínos":["nao","Caroço não é usado em suínos; troca sem aplicação prática."]}},
  {de:"Caroço de Algodão",para:"DDGS",geral:"Troca por coproduto com proteína e gordura moderada, menos fibra.",esp:{
    "Bovino de corte":["ok","Atenção ao enxofre e à gordura total."],
    "Bovino de leite":["ok","Atenção à gordura insaturada."],
    "Aves":["nao","Caroço não é usado em aves; troca sem aplicação prática."],
    "Suínos":["nao","Caroço não é usado em suínos; troca sem aplicação prática."]}},
  {de:"Caroço de Algodão",para:"Farelo de Algodão",geral:"Mantém a origem; sobe a proteína e perde a gordura e parte da energia.",esp:{
    "Bovino de corte":["ok","Repor energia; gossipol continua presente."],
    "Bovino de leite":["ok","Repor energia; gossipol continua presente."],
    "Aves":["nao","Caroço não é usado em aves; troca sem aplicação prática."],
    "Suínos":["nao","Caroço não é usado em suínos; troca sem aplicação prática."]}},

  /* ---------- Farelo de Soja ---------- */
  {de:"Farelo de Soja",para:"DDGS",geral:"Substitui parte da proteína com mais energia e fibra; como a PB é menor, entra mais DDGS por ponto de soja.",esp:{
    "Bovino de corte":["ok","Traz mais PNDR; atenção ao enxofre e à gordura total."],
    "Bovino de leite":["ok","Troca parcial; PNDR alto ajuda, mas a lisina é baixa: conferir aminoácidos."],
    "Aves":["restr","Lisina baixa e de digestibilidade variável: exige aminoácidos industriais."],
    "Suínos":["restr","Lisina baixa e gordura insaturada (toucinho mole): só parcial."]}},
  {de:"Farelo de Soja",para:"Farelo de Algodão",geral:"Proteína vegetal mais barata, com mais fibra e menos lisina.",esp:{
    "Bovino de corte":["ok","Boa troca; o gossipol limita o uso em touros reprodutores."],
    "Bovino de leite":["ok","Troca parcial, respeitando o limite de gossipol."],
    "Aves":["restr","Gossipol (descolore a gema em poedeiras) e lisina baixa: parcial e com aminoácidos."],
    "Suínos":["restr","Gossipol e lisina baixa: parcial e evitar em leitões."]}},
  {de:"Farelo de Soja",para:"Farelo de Amendoim",geral:"PB parecida com a da soja, mas mais pobre em lisina e metionina.",esp:{
    "Bovino de corte":["restr","Exigir laudo de aflatoxina do lote."],
    "Bovino de leite":["restr","A aflatoxina passa para o leite (M1): só com laudo e controle rigoroso."],
    "Aves":["restr","Aves são muito sensíveis à aflatoxina; corrigir lisina e metionina."],
    "Suínos":["restr","Sensíveis à aflatoxina; corrigir lisina."]}},
  {de:"Farelo de Soja",para:"Farelo de Glúten 21",geral:"PB muito menor: só substitui uma parte da soja.",esp:{
    "Bovino de corte":["restr","A proteína precisa ser reajustada, por exemplo com ureia, a critério do nutricionista."],
    "Bovino de leite":["restr","Reajustar proteína e aminoácidos; troca só parcial."],
    "Aves":["nao","PB e energia baixas e fibra alta para aves."],
    "Suínos":["nao","PB e energia baixas e fibra alta para suínos."]}},

  /* ---------- Farelo de Algodão ---------- */
  {de:"Farelo de Algodão",para:"Farelo de Soja",geral:"Sobe a PB e melhora os aminoácidos; costuma ser mais caro.",esp:{
    "Bovino de corte":["ok","Troca direta; elimina o gossipol."],
    "Bovino de leite":["ok","Troca direta; elimina o gossipol."],
    "Aves":["ok","Troca direta; elimina o risco de gossipol e melhora a lisina."],
    "Suínos":["ok","Troca direta; melhora a lisina."]}},
  {de:"Farelo de Algodão",para:"DDGS",geral:"Proteína menor, mais energia e gordura.",esp:{
    "Bovino de corte":["ok","Atenção ao enxofre e à gordura total."],
    "Bovino de leite":["ok","Atenção à gordura insaturada."],
    "Aves":["restr","Lisina pouco digestível e micotoxinas: só parcial."],
    "Suínos":["restr","Gordura insaturada e micotoxinas: só parcial."]}},
  {de:"Farelo de Algodão",para:"Farelo de Amendoim",geral:"Proteína parecida ou maior, menos fibra; risco de aflatoxina.",esp:{
    "Bovino de corte":["restr","Exigir laudo de aflatoxina."],
    "Bovino de leite":["restr","A aflatoxina passa para o leite: só com laudo."],
    "Aves":["restr","Muito sensíveis à aflatoxina; corrigir aminoácidos."],
    "Suínos":["restr","Sensíveis à aflatoxina; corrigir lisina."]}},
  {de:"Farelo de Algodão",para:"Caroço de Algodão",geral:"Mesma origem; traz gordura e fibra junto com menos proteína.",esp:{
    "Bovino de corte":["restr","Limitar pela gordura total e pelo gossipol."],
    "Bovino de leite":["ok","Clássico em leite; limitar pela gordura total e pelo gossipol."],
    "Aves":["nao","Gossipol e fibra: não indicado."],
    "Suínos":["nao","Gossipol e fibra: não indicado."]}},

  /* ---------- DDGS ---------- */
  {de:"DDGS",para:"Farelo de Soja",geral:"Mais proteína e melhor lisina; perde gordura e parte da energia.",esp:{
    "Bovino de corte":["ok","Troca direta; menos PNDR e menos enxofre."],
    "Bovino de leite":["ok","Troca direta; o PNDR cai."],
    "Aves":["ok","Troca direta; melhora a lisina digestível."],
    "Suínos":["ok","Troca direta; melhora a lisina e a firmeza do toucinho."]}},
  {de:"DDGS",para:"Farelo de Algodão",geral:"Proteína parecida ou maior, menos gordura, gossipol presente.",esp:{
    "Bovino de corte":["ok","Gossipol limita o uso em touros reprodutores."],
    "Bovino de leite":["ok","Respeitar o limite de gossipol."],
    "Aves":["restr","Gossipol e lisina baixa: só parcial."],
    "Suínos":["restr","Gossipol e lisina baixa: só parcial."]}},
  {de:"DDGS",para:"Farelo de Glúten 21",geral:"Menos proteína e gordura, mais fibra.",esp:{
    "Bovino de corte":["ok","Troca direta; conferir a proteína da dieta."],
    "Bovino de leite":["ok","Conferir proteína e PNDR."],
    "Aves":["nao","Fibra alta e energia baixa para aves."],
    "Suínos":["nao","Fibra alta e energia baixa para suínos."]}},
  {de:"DDGS",para:"Farelo de Amendoim",geral:"Mais proteína, menos gordura e fibra; risco de aflatoxina.",esp:{
    "Bovino de corte":["restr","Exigir laudo de aflatoxina."],
    "Bovino de leite":["restr","A aflatoxina passa para o leite: só com laudo."],
    "Aves":["restr","Muito sensíveis à aflatoxina."],
    "Suínos":["restr","Sensíveis à aflatoxina."]}},

  /* ---------- Farelo de Amendoim ---------- */
  {de:"Farelo de Amendoim",para:"Farelo de Soja",geral:"Troca segura: PB parecida, lisina melhor e sem o risco de aflatoxina do amendoim.",esp:{
    "Bovino de corte":["ok","Troca direta."],
    "Bovino de leite":["ok","Troca direta; elimina o risco de aflatoxina no leite."],
    "Aves":["ok","Troca direta; melhora lisina e metionina."],
    "Suínos":["ok","Troca direta; melhora a lisina."]}},
  {de:"Farelo de Amendoim",para:"Farelo de Algodão",geral:"Proteína menor, mais fibra, gossipol presente.",esp:{
    "Bovino de corte":["ok","Gossipol limita o uso em touros reprodutores."],
    "Bovino de leite":["ok","Respeitar o limite de gossipol."],
    "Aves":["restr","Gossipol e lisina baixa: só parcial."],
    "Suínos":["restr","Gossipol e lisina baixa: só parcial."]}},
  {de:"Farelo de Amendoim",para:"DDGS",geral:"Proteína menor, mais gordura e fibra.",esp:{
    "Bovino de corte":["ok","Atenção ao enxofre e à gordura total."],
    "Bovino de leite":["ok","Atenção à gordura insaturada."],
    "Aves":["restr","Lisina pouco digestível e micotoxinas: só parcial."],
    "Suínos":["restr","Gordura insaturada e micotoxinas: só parcial."]}},
];
