/* =================================================================
   DADOS DE TESTE — usados SÓ pela testes.html. NÃO são dados reais.

   São os valores fictícios da fase de desenvolvimento, congelados
   aqui porque as contas dos testes foram feitas à mão com eles.
   Assim, trocar a base real (dados.js) nunca quebra os testes.

   Não edite este arquivo para atualizar dados: use dados.js.
   ================================================================= */

/* Commodities, na ordem em que os valores aparecem em cada linha de P */
const COMS=["Milho","Sorgo","Farelo de Algodão","Caroço de Algodão","DDGS","Farelo de Soja"];

/* Cor de cada commodity nas barras e sliders */
const CORES={"Milho":"#10b981","Sorgo":"#f59e0b","Farelo de Algodão":"#3b82f6",
  "Caroço de Algodão":"#8b5cf6","DDGS":"#ec4899","Farelo de Soja":"#14b8a6"};

/* [Parâmetro, Unidade, Base (MS ou MN), Categoria,
    [Milho, Sorgo, Far.Algodão, Caroço Algodão, DDGS, Farelo de Soja]] */
const P=[
 ["Matéria Seca","%","MN","Bromatológico",[87.5,87.0,89.0,91.0,89.0,88.5]],
 ["Proteína Bruta","%","MS","Bromatológico",[9.5,10.5,42.0,23.0,30.0,51.5]],
 ["Extrato Etéreo","%","MS","Bromatológico",[4.2,3.2,2.0,18.0,9.5,2.0]],
 ["Fibra Bruta","%","MS","Bromatológico",[2.5,2.8,14.0,24.0,8.0,4.0]],
 ["FDN","%","MS","Bromatológico",[12.0,14.0,30.0,45.0,32.0,14.0]],
 ["FDA","%","MS","Bromatológico",[3.5,5.0,20.0,34.0,14.0,8.0]],
 ["Matéria Mineral","%","MS","Bromatológico",[1.4,1.8,6.5,4.0,4.8,6.5]],
 ["NDT","%","MS","Energia",[88.0,84.0,68.0,88.0,84.0,82.0]],
 ["Energia Metabolizável - Aves","Mcal/kg","MS","Energia",[3.40,3.20,2.10,2.60,2.80,2.55]],
 ["Energia Metabolizável - Suínos","Mcal/kg","MS","Energia",[3.45,3.30,2.40,2.80,3.10,3.60]],
 ["Energia Metabolizável - Bovinos","Mcal/kg","MS","Energia",[3.20,3.05,2.55,3.20,3.05,2.98]],
 ["PDR","% da PB","MS","Fração proteica",[55.0,58.0,55.0,50.0,40.0,65.0]],
 ["PNDR","% da PB","MS","Fração proteica",[45.0,42.0,45.0,50.0,60.0,35.0]],
 ["Cálcio","%","MS","Mineral",[0.03,0.04,0.20,0.15,null,0.30]],
 ["Fósforo Total","%","MS","Mineral",[0.28,0.30,1.10,0.65,0.85,0.65]],
 ["Lisina","%","MS","Aminoácido",[0.28,0.24,1.75,1.00,0.85,3.20]],
 ["Metionina","%","MS","Aminoácido",[0.20,0.17,0.60,0.40,0.55,0.72]],
 ["Treonina","%","MS","Aminoácido",[0.34,0.33,1.35,0.75,1.10,2.00]],
 ["Triptofano","%","MS","Aminoácido",[0.07,0.10,0.50,0.28,0.22,0.70]],
];
/* Cálcio do DDGS deixado como null de propósito: demonstra o tratamento N/D. */

/* Faixas do semáforo de preço. Par sem faixa cadastrada não recebe semáforo. */
const FAIXAS=[{ref:"Farelo de Soja",av:"DDGS",verde:75,amarelo:82,fonte:"Regra de mercado — CONFIRMAR ORIGEM"},
              {ref:"Milho",av:"Sorgo",verde:90,amarelo:95,fonte:"Regra de mercado — CONFIRMAR ORIGEM"}];

/* Cotações que aparecem preenchidas ao abrir o app (R$/ton) */
const PRECOS_INI={"Milho":1200,"Sorgo":1100,"Farelo de Algodão":1750,
  "Caroço de Algodão":1500,"DDGS":1400,"Farelo de Soja":2200};
