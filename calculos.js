/* =================================================================
   CÁLCULOS — todas as contas do Nutre Compare Pro, num lugar só.

   Este arquivo não mexe na tela. Recebe dados, devolve resultado e
   um MEMORIAL (entradas, fórmula, passos, avisos) que a tela mostra
   em "Como essa conta é feita?".

   Invariantes (ver CLAUDE.md, seção 4) — não quebre:
   1. Dado ausente nunca vira zero: o cálculo é recusado e vira N/D.
   2. Inclusão é em matéria natural: valor_MN = valor_MS × MS% / 100.
   3. PDR e PNDR (% da PB) são ponderados pela proteína, não pela massa.
   4. Preço limite = Preço_ref × (nutriente_aval / nutriente_ref).
      É o preço equivalente NAQUELE nutriente, não um "preço justo".

   Qualquer mudança aqui: rode testes.html antes de publicar.
   Depende de dados.js (COMS, P, FAIXAS).
   ================================================================= */

/* ================= ACESSO AOS DADOS ================= */
function meta(p){const r=P.find(x=>x[0]===p);return r?{un:r[1],base:r[2],cat:r[3]}:null}
/* Cada linha de P pode ter um 6º elemento com o registro da aba FONTES
   por commodity: {ok, fonte, link, data, obs}. ok=true só quando o Status é
   DEFINITIVO/VERIFICADO e há fonte registrada. Sem registro → provisório. */
function get(com,p){
  const r=P.find(x=>x[0]===p); if(!r) return {v:null,un:"",base:"MS",prov:true,fonte:null};
  const i=COMS.indexOf(com); const v=(i<0)?null:r[4][i];
  const f=(i>=0&&r[5])?r[5][i]:null;
  return {v:(v===null||v===undefined)?null:v,un:r[1],base:r[2],
          prov:!(f&&f.ok),fonte:f&&f.fonte?f.fonte:null};
}
/* texto curto de fonte para o memorial */
function fonteTxt(d){return d.fonte?d.fonte+(d.prov?" (provisório)":""):"sem fonte registrada"}
function msPct(com){return get(com,"Matéria Seca").v}
function toMN(com,p){ /* valor_MN = valor_MS × MS% / 100 */
  const d=get(com,p); if(d.v===null) return {v:null,nota:null};
  if(d.base==="MN") return {v:d.v,nota:"já estava em matéria natural"};
  const ms=msPct(com); if(ms===null||ms<=0) return {v:null,nota:"Matéria Seca ausente"};
  return {v:d.v*ms/100,nota:`${fmt(d.v)} × ${fmt(ms)}% / 100 = ${fmt(d.v*ms/100)}`};
}

/* ================= LEITURA DE NÚMERO DIGITADO =================
   Aceita formato BR (12,5 · 1.200,50) e US (12.5 · 1,200.50).
   Devolve null se não entender — NUNCA zero. Zero só se digitarem 0.
   Não simplifique para replace(',','.'): foi o bug da v1.0, em que
   "1.200,50" virava "1.200.50" e o erro era engolido como zero.     */
function lerPercentual(texto){
  let s=String(texto==null?"":texto).replace(/%/g,"").replace(/\s/g,"");
  if(!s) return null;
  const temV=s.includes(","), temP=s.includes(".");
  if(temV&&temP){
    // o separador que aparece por último é o decimal; o outro é milhar
    if(s.lastIndexOf(",")>s.lastIndexOf(".")) s=s.replace(/\./g,"").replace(",",".");
    else s=s.replace(/,/g,"");
  }else if(temV){
    if((s.match(/,/g)||[]).length>1) return null;
    s=s.replace(",",".");
  }else if(temP){
    if((s.match(/\./g)||[]).length>1) return null;
  }
  if(!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}

/* ================= FORMATAÇÃO ================= */
function fmt(x,c=2){
  if(x===null||x===undefined||isNaN(x)) return "N/D";
  const s=x.toLocaleString("pt-BR",{minimumFractionDigits:c,maximumFractionDigits:c});
  return /^-0(,0+)?$/.test(s)?s.slice(1):s;   // -0,0001 arredonda para 0,00, não "-0,00"
}
function brl(x,c=2){return x===null||x===undefined||isNaN(x)?"N/D":"R$ "+fmt(x,c)}

/* ================= CUSTO POR NUTRIENTE ================= */
function custoPorNutriente(com,p,preco){
  const d=get(com,p);
  const m={ent:[["Preço da tonelada",brl(preco)],[`${p} (${d.base})`,d.v===null?"N/D":fmt(d.v)+" "+d.un],
                ["Fonte do dado",fonteTxt(d)]],
           form:"",passos:[],res:null,blk:null,avisos:[]};
  if(!preco||preco<=0){m.blk="preço não informado ou inválido.";return{v:null,un:null,m}}
  if(d.v===null){m.blk=`o valor de ${p} para ${com} não existe na planilha (N/D). `+
    `O sistema não substitui dado ausente por zero.`;return{v:null,un:null,m}}
  if(d.v<=0){m.blk=`${p} é zero ou negativo; a divisão seria inválida.`;return{v:null,un:null,m}}
  const u=d.un.toLowerCase(); let qtd,uc;
  if(u.includes("%")&&!u.includes("da pb")){
    qtd=d.v*10; uc="R$/kg"; m.form="Custo = Preço da tonelada / (valor % × 10)";
    m.passos.push(`Uma tonelada tem 1.000 kg, então ${fmt(d.v)}% equivale a ${fmt(d.v)} × 10 = ${fmt(qtd)} kg por tonelada.`);
  }else if(u.includes("mcal/kg")){
    qtd=d.v*1000; uc="R$/Mcal"; m.form="Custo = Preço da tonelada / (Mcal/kg × 1.000)";
    m.passos.push(`Uma tonelada tem 1.000 kg, então ${fmt(d.v)} Mcal/kg equivale a ${fmt(d.v)} × 1.000 = ${fmt(qtd)} Mcal por tonelada.`);
  }else{
    m.blk=`a unidade "${d.un}" não permite determinar a quantidade contida em uma tonelada. Custo por unidade não calculado.`;
    return{v:null,un:null,m};
  }
  if(d.base==="MS") m.avisos.push("Valor em base de matéria seca. O custo é por unidade de nutriente na matéria seca do ingrediente.");
  const r=preco/qtd;
  m.passos.push(`${brl(preco)} / ${fmt(qtd)} = ${brl(r)}`);
  m.res=`${brl(r)} por unidade (${uc})`;
  if(d.prov) m.avisos.push("Dado PROVISÓRIO: sem fonte verificada na aba FONTES.");
  return {v:r,un:uc,m};
}

/* ================= PREÇO LIMITE ================= */
function precoLimite(ref,aval,p,precoRef){
  const a=get(ref,p), b=get(aval,p);
  const m={ent:[[`Preço de ${ref}`,brl(precoRef)+" por tonelada"],
                [`${p} em ${ref}`,(a.v===null?"N/D":fmt(a.v)+" "+a.un)+` — fonte: ${fonteTxt(a)}`],
                [`${p} em ${aval}`,(b.v===null?"N/D":fmt(b.v)+" "+b.un)+` — fonte: ${fonteTxt(b)}`]],
           form:"",passos:[],res:null,blk:null,avisos:[]};
  if(!precoRef||precoRef<=0){m.blk=`preço de ${ref} não informado.`;return{v:null,m}}
  if(a.v===null||b.v===null){m.blk=`${p} de ${a.v===null?ref:aval} está N/D na planilha.`;return{v:null,m}}
  if(a.v<=0){m.blk=`${p} de ${ref} é zero; a razão seria indefinida.`;return{v:null,m}}
  if(a.un!==b.un){m.blk=`unidades incompatíveis: ${ref} em "${a.un}" e ${aval} em "${b.un}".`;return{v:null,m}}
  const razao=b.v/a.v, r=precoRef*razao;
  m.form="Preço limite = Preço da referência × (nutriente do avaliado / nutriente da referência)";
  m.passos.push(`Razão do nutriente: ${fmt(b.v)} / ${fmt(a.v)} = ${fmt(razao)}`);
  m.passos.push(`${brl(precoRef)} × ${fmt(razao)} = ${brl(r)}`);
  m.res=`${brl(r)} por tonelada`;
  m.avisos.push(`Este é o preço equivalente EM ${p.toUpperCase()}, não um preço justo global. Outro nutriente daria outro limite.`);
  if(a.prov||b.prov) m.avisos.push("Há dado PROVISÓRIO neste cálculo.");
  return {v:r,m};
}

function faixa(ref,av){return FAIXAS.find(f=>f.ref===ref&&f.av===av)||null}

/* ================= TROCA DE INGREDIENTE (aba Substituições) =================
   Compara, parâmetro a parâmetro, o ingrediente que entra (para) com o que sai (de).
   criterios = [{p, dir}]: dir +1 = mais é melhor, −1 = menos é melhor, 0 = só informar.
   Diferença relevante = variação de pelo menos `limiar`% sobre o valor de quem sai.
   Os dois valores vêm da mesma linha da base, então estão na mesma base (MS ou MN):
   não há conversão. Dado ausente vira item "nd" com motivo — nunca zero.        */
function compararTroca(de,para,criterios,limiar=10){
  const m={ent:[],form:`Diferença = valor em ${para} − valor em ${de}\n`+
    `Diferença % = diferença / valor em ${de} × 100`,passos:[],res:null,blk:null,avisos:[]};
  let prov=false;
  const itens=criterios.map(k=>{
    const a=get(de,k.p), b=get(para,k.p);
    const itProv=(a.prov&&a.v!==null)||(b.prov&&b.v!==null);
    if(itProv) prov=true;
    const it={p:k.p,un:a.un,base:a.base,a:a.v,b:b.v,dif:null,difPct:null,tipo:"nd",motivo:null,prov:itProv};
    m.ent.push([`${k.p} (${a.base})`,`${de} ${fmt(a.v)} · ${para} ${fmt(b.v)} ${a.un}`]);
    if(a.v===null||b.v===null){
      it.motivo=`${k.p} de ${a.v===null?de:para} está N/D na planilha.`;
      m.passos.push(`${k.p}: não comparado — ${it.motivo}`);
      return it;
    }
    it.dif=b.v-a.v;
    it.difPct=a.v!==0?it.dif/a.v*100:null;
    const relevante=it.difPct===null?it.dif!==0:Math.abs(it.difPct)>=limiar;
    it.tipo=!relevante?"similar":(k.dir===0?"neutro":(Math.sign(it.dif)===k.dir?"vantagem":"desvantagem"));
    m.passos.push(`${k.p}: ${fmt(b.v)} − ${fmt(a.v)} = ${it.dif>0?"+":""}${fmt(it.dif)} ${a.un}`+
      (it.difPct===null?"":` (${it.difPct>0?"+":""}${fmt(it.difPct)}%)`)+` → ${it.tipo}`);
    return it;
  });
  const n=t=>itens.filter(i=>i.tipo===t).length;
  m.res=`${n("vantagem")} vantagem(ns), ${n("desvantagem")} desvantagem(ns), `+
    `${n("neutro")} diferença(s) só informativa(s), ${n("similar")} parecido(s)`+(n("nd")?`, ${n("nd")} sem dado`:"");
  m.avisos.push(`Só conta como diferença o que varia ${fmt(limiar)}% ou mais em relação a ${de}. Abaixo disso, "parecido".`);
  m.avisos.push("Comparação por kg de produto na base do parâmetro. Não diz quanto incluir na ração.");
  if(prov) m.avisos.push("Há dado PROVISÓRIO nesta comparação.");
  return {itens,m};
}

/* ================= FORMULAÇÃO ================= */
/* f = {ingrediente: % de inclusão}, precos = {ingrediente: R$/ton}
   semCusto = ingredientes que o usuário decidiu deixar FORA do custo (ex.:
   Núcleo + Ureia). É uma exclusão declarada e mostrada no memorial — diferente
   de preço faltando, que continua invalidando a conta. */
function custoFormulacao(f,precos,semCusto=[]){
  const m={ent:[],form:"Custo = soma de (preço do ingrediente × % de inclusão / 100)",
           passos:[],res:null,blk:null,avisos:[]};
  let t=0,bad=false;
  for(const c in f){ if(f[c]<=0) continue;
    if(semCusto.includes(c)){
      m.passos.push(`${c}: ${fmt(f[c])}% — fora do custo (sem preço, por definição)`);
      m.avisos.push(`${c} (${fmt(f[c])}%) não entra no custo. O valor é o custo dos demais ingredientes por tonelada de ração.`);
      continue}
    const p=precos[c];
    if(!p||p<=0){m.avisos.push(`Preço de ${c} não informado; ingrediente ignorado.`);bad=true;continue}
    const x=p*f[c]/100; t+=x; m.passos.push(`${c}: ${brl(p)} × ${fmt(f[c])}% = ${brl(x)}`);
  }
  m.res=`${brl(t)} por tonelada`;
  if(bad) m.avisos.push("Custo incompleto: há ingrediente sem preço.");
  return {v:bad?null:t,m};
}

/* semPerfil = ingredientes SEM perfil nutricional cadastrado, por decisão do
   usuário (ex.: Núcleo + Ureia). Ficam fora da soma, com aviso explícito no
   memorial — o resultado é a contribuição dos DEMAIS ingredientes, não o perfil
   da ração. Isso NÃO é "dado ausente virou zero": um ingrediente fora dessa
   lista e sem dado continua bloqueando o cálculo (N/D). */
function avisoSemPerfil(f,semPerfil,m){
  semPerfil.filter(c=>(f[c]||0)>0).forEach(c=>m.avisos.push(
    `${c} (${fmt(f[c])}%) não tem perfil nutricional cadastrado e ficou fora da soma. `+
    `O valor é a contribuição dos demais ingredientes, não o total da ração.`));
}
function nutriFormulacao(f,p,semPerfil=[]){
  const mt=meta(p); const un=mt.un;
  const m={ent:[],form:"",passos:[],res:null,blk:null,avisos:[]};
  avisoSemPerfil(f,semPerfil,m);
  if(un.toLowerCase().includes("da pb")) return fracaoPB(f,p,un,m,semPerfil);
  m.form="Valor = soma de (valor do ingrediente em matéria natural × % de inclusão / 100)";
  let t=0;
  for(const c in f){ if(f[c]<=0) continue;
    if(semPerfil.includes(c)) continue;
    const d=get(c,p);
    if(d.v===null){m.blk=`${p} de ${c} está N/D. Com inclusão de ${fmt(f[c])}%, somar sem esse dado produziria um total subestimado.`;return{v:null,un,m}}
    const mn=toMN(c,p);
    if(mn.v===null){m.blk=`não foi possível converter ${p} de ${c} para matéria natural: Matéria Seca ausente.`;return{v:null,un,m}}
    const x=mn.v*f[c]/100; t+=x;
    m.passos.push(`${c}: ${fmt(mn.v)} × ${fmt(f[c])}% = ${fmt(x)}`+
      (d.base==="MS"?` [conversão MS→MN: ${mn.nota}]`:"")+` — fonte: ${fonteTxt(d)}`);
  }
  m.res=`${fmt(t)} ${un} (matéria natural)`;
  return {v:t,un,m};
}

/* PDR/PNDR: ponderados pela proteína que cada ingrediente aporta */
function fracaoPB(f,p,un,m,semPerfil=[]){
  m.form="Valor = soma de (fração do ingrediente × proteína que ele aporta) / proteína total da ração";
  m.avisos.push("Parâmetro expresso em % da PB. A média é ponderada pela proteína aportada por cada ingrediente, não pela massa. Ponderar pela massa daria um número inflado por ingredientes de baixa proteína.");
  let sp=0,spb=0;
  for(const c in f){ if(f[c]<=0) continue;
    if(semPerfil.includes(c)) continue;
    const d=get(c,p), pb=toMN(c,"Proteína Bruta");
    if(d.v===null||pb.v===null){m.blk=`${d.v===null?p:"Proteína Bruta"} de ${c} está N/D.`;return{v:null,un,m}}
    const ap=pb.v*f[c]/100; spb+=ap; sp+=d.v*ap;
    m.passos.push(`${c}: aporta ${fmt(ap)}% de PB na ração, com ${p} = ${fmt(d.v)}% da PB`);
  }
  if(spb<=0){m.blk="proteína total da ração é zero.";return{v:null,un,m}}
  const t=sp/spb;
  m.passos.push(`${fmt(sp)} / ${fmt(spb)} = ${fmt(t)}`);
  m.res=`${fmt(t)} ${un}`;
  return {v:t,un,m};
}

function totalDe(f,ings){return ings.reduce((a,c)=>a+(f[c]||0),0)}
function arred(x){return Math.round(x*100)/100}

/* ================= VÍNCULOS ENTRE INGREDIENTES =================
   Cada relação guarda um FATOR: quantos pontos de "para" se movem para
   cada 1 ponto de "de". Fator 1,0 é a troca 1:1. Fator 1,6 significa que
   1 ponto de "de" desloca 1,6 pontos de "para".
   Consequência: com fator diferente de 1 o TOTAL da formulação muda,
   porque o que entra e o que sai não são iguais. Isso é proposital e
   aparece na barra de total.
   rels = [{de, para, ratio, on}], ings = ingredientes selecionados.   */
function vinculosDe(c,rels,ings){
  const m=new Map();
  rels.forEach(r=>{
    if(!r.on) return;
    if(!ings.includes(r.de)||!ings.includes(r.para)) return;
    if(r.de===c && !m.has(r.para)) m.set(r.para, r.ratio);
    else if(r.para===c && !m.has(r.de)) m.set(r.de, r.ratio>1e-9?1/r.ratio:0);
  });
  return [...m].map(([p,R])=>({p,R}));
}

/* Move um ingrediente da formulação f respeitando seus vínculos.
   O deslocamento é limitado pelo que cada parceiro pode ceder ou receber
   e pelo teto de 100% do total. Altera f e devolve o valor aplicado. */
function moverVinculado(f,c,novo,rels,ings){
  novo=Math.max(0,Math.min(100,novo));
  const ant=f[c]||0;
  let d=novo-ant;
  const v=vinculosDe(c,rels,ings);
  if(!v.length||Math.abs(d)<1e-9){ f[c]=arred(novo); return f[c] }

  // limite imposto por cada parceiro: não pode passar de 0 nem de 100
  v.forEach(({p,R})=>{
    if(Math.abs(R)<1e-9) return;
    const cur=f[p]||0;
    if(d>0){ const lim=cur/R;          if(lim<d) d=lim }
    else   { const lim=(cur-100)/R;    if(lim>d) d=lim }
  });

  // limite imposto pelo total: com fator != 1 a soma se move
  const k=1-v.reduce((a,x)=>a+x.R,0);
  if(Math.abs(k)>1e-9){
    const tot=totalDe(f,ings);
    if(d*k>0){
      const max=(100-tot)/k;
      if(k>0 && d>max) d=Math.max(0,max);
      if(k<0 && d<max) d=Math.min(0,max);
    }
  }
  if(!isFinite(d)) d=0;

  v.forEach(({p,R})=>{f[p]=arred(Math.max(0,Math.min(100,(f[p]||0)-d*R)))});
  f[c]=arred(Math.max(0,Math.min(100,ant+d)));
  return f[c];
}

/* ================= COMPLETAR AUTOMATICAMENTE (v3) =================
   Problema: o usuário trava alguns ingredientes da reestruturada e pede que
   o sistema preencha os demais ("livres") de modo que
     (1) o total feche no MESMO total da formulação original;
     (2) cada critério escolhido (1 ou 2 nutrientes, ex.: Proteína Bruta e
         energia) fique a no máximo `tol` PONTOS do valor da original — cada
         critério com a sua tolerância, na sua unidade;
     (3) entre as combinações que atendem (1) e (2), escolher conforme o modo:
         "custo"   → a mais barata (padrão);
         "proximo" → a que fica mais perto da original nos critérios (o menor
                     afastamento, medido como fração da tolerância de cada
                     um); havendo empate, a mais barata.

   Por que dois critérios: com 1 critério e 2 ingredientes livres sempre existe
   solução exata, e a tolerância só serve para baratear. Com 2 critérios quase
   nunca dá para acertar os dois, e a tolerância passa a decidir se há solução.

   Método (exato, sem biblioteca): é programação linear com 1 igualdade (total)
   e K faixas (critérios, K ≤ 2). A melhor solução sempre usa no máximo K+1
   ingredientes livres com quantidade maior que zero, com os critérios "no
   limite" resolvendo um sistema linear pequeno. O código testa todas essas
   combinações (ingredientes sozinhos, pares e trios) e fica com a melhor.
   Os candidatos aparecem no memorial e podem ser conferidos à mão.

   Ingredientes em `semPerfil` (ex.: Núcleo + Ureia) são sempre mantidos como
   estão e não contam nos nutrientes — nem na original, nem na reestruturada —
   por isso precisam ter o mesmo percentual nas duas para a comparação valer.

   Não altera nada: devolve {f: nova formulação ou null, m: memorial, ...}.  */

/* Sistema linear pequeno (até 3×3), eliminação de Gauss com pivô. null se não tem solução única. */
function resolverSistema(A,b){
  const n=b.length, M=A.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<n;c++){
    let p=c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[p][c])) p=r;
    if(Math.abs(M[p][c])<1e-12) return null;
    [M[c],M[p]]=[M[p],M[c]];
    for(let r=0;r<n;r++){ if(r===c) continue; const k=M[r][c]/M[c][c];
      for(let j=c;j<=n;j++) M[r][j]-=k*M[c][j]; }
  }
  return M.map((r,i)=>r[n]/r[i]);
}
function subconjuntos(arr,k){
  if(k===0) return [[]]; if(arr.length<k) return [];
  const [h,...t]=arr;
  return subconjuntos(t,k-1).map(s=>[h,...s]).concat(subconjuntos(t,k));
}
/* Folga numérica de um critério: os percentuais são arredondados a 2 casas, o
   que desloca o nutriente em até ~0,011 ponto de inclusão × o maior teor. Sem
   ela, um resultado do próprio sistema poderia ser recusado ao reaplicar. */
function folgaCriterio(nutriente,ings){
  let mx=0; ings.forEach(c=>{const mn=toMN(c,nutriente); if(mn.v!==null) mx=Math.max(mx,Math.abs(mn.v)/100)});
  return 0.011*mx;
}

function completarPorCusto(o){
  const {fOrig,fAtual,ings,travados,precos}=o;
  const semPerfil=o.semPerfil||[], modo=o.modo==="proximo"?"proximo":"custo";
  const crits=(o.criterios&&o.criterios.length)?o.criterios:[{nutriente:o.nutriente,tol:o.tol}];
  const m={ent:[],form:"",passos:[],res:null,blk:null,avisos:[]};
  const falha=t=>{m.blk=t;return {f:null,m}};
  if(crits.length>2) return falha("o ajuste aceita no máximo dois critérios.");
  if(crits.length===2&&crits[0].nutriente===crits[1].nutriente)
    return falha("os dois critérios são o mesmo parâmetro. Escolha parâmetros diferentes.");
  for(const k of crits){
    const mt=meta(k.nutriente);
    if(!mt) return falha(`parâmetro "${k.nutriente}" não existe na base.`);
    if(mt.un.toLowerCase().includes("da pb"))
      return falha(`${k.nutriente} é uma fração da proteína (${mt.un}) e não pode ser usado como critério.`);
    if(!(k.tol>=0)) return falha(`tolerância de ${k.nutriente} inválida.`);
  }

  const sub=f=>{const r={};ings.forEach(c=>r[c]=f[c]||0);return r};
  const total=arred(totalDe(fOrig,ings));
  if(total<=0) return falha("a formulação original está vazia.");
  if(total>100.001) return falha("a formulação original passa de 100%.");

  const fixos=ings.filter(c=>travados.includes(c)||semPerfil.includes(c));
  const livres=ings.filter(c=>!fixos.includes(c));
  if(!livres.length) return falha("todos os ingredientes estão travados. Destrave pelo menos um para o sistema ajustar.");
  const somaFix=fixos.reduce((s,c)=>s+(fAtual[c]||0),0);
  const R=total-somaFix;                     // pontos que os livres precisam somar
  if(R<-0.001) return falha(`os ingredientes travados somam ${fmt(somaFix)}% e passam do total de ${fmt(total)}%. Reduza algum travado.`);
  const Rr=Math.max(0,R);

  // preço de cada livre
  const pr={};
  for(const c of livres){const p=precos[c];
    if(!p||p<=0) return falha(`preço de ${c} não informado. Informe a cotação ou trave esse ingrediente — o sistema não escolhe o mais barato sem preço.`);
    pr[c]=p;}

  // por critério: meta, o que os mantidos já aportam, aporte por ponto de cada livre
  const K=[];
  for(const k of crits){
    const mt=meta(k.nutriente), alvo=nutriFormulacao(sub(fOrig),k.nutriente,semPerfil);
    if(alvo.v===null) return falha(`não foi possível calcular ${k.nutriente} da original: ${alvo.m.blk}`);
    let nutFix=0;
    for(const c of fixos){const v=fAtual[c]||0; if(semPerfil.includes(c)||v<=0) continue;
      const mn=toMN(c,k.nutriente);
      if(mn.v===null) return falha(`${k.nutriente} de ${c} está N/D; não dá para saber quanto ele aporta.`);
      nutFix+=mn.v*v/100;}
    const a={};
    for(const c of livres){const mn=toMN(c,k.nutriente);
      if(mn.v===null) return falha(`${k.nutriente} de ${c} está N/D. Tire ${c} da formulação (ou deixe em 0% e travado), escolha outro critério ou cadastre o dado.`);
      a[c]=mn.v/100;}
    K.push({nutriente:k.nutriente,un:mt.un,tol:k.tol,alvo:alvo.v,nutFix,a,T:alvo.v-nutFix,
            folga:folgaCriterio(k.nutriente,ings)});
  }

  const eps=1e-9;
  const custoDe=x=>Object.keys(x).reduce((s,c)=>s+pr[c]*x[c]/100,0);
  const nutDe=(k,x)=>Object.keys(x).reduce((s,c)=>s+k.a[c]*x[c],0);

  /* Todos os "cantos" possíveis para as tolerâncias dadas: 1 a K+1 ingredientes,
     com (quantidade − 1) critérios exatamente no piso ou no teto da faixa. */
  function enumerar(tols){
    const cands=[];
    const dentro=x=>K.every((k,i)=>{const n=nutDe(k,x);return n>=k.T-tols[i]-k.folga&&n<=k.T+tols[i]+k.folga});
    const ladosDe=i=>tols[i]>eps?[K[i].T-tols[i],K[i].T+tols[i]]:[K[i].T];
    for(let s=1;s<=Math.min(K.length+1,livres.length);s++){
      // quais critérios ficam no limite: s−1 deles
      const escolhas=subconjuntos(K.map((_,i)=>i),s-1);
      subconjuntos(livres,s).forEach(S=>escolhas.forEach(ativos=>{
        const combos=ativos.reduce((acc,i)=>acc.flatMap(c=>ladosDe(i).map(l=>[...c,l])),[[]]);
        combos.forEach(lados=>{
          const A=[S.map(()=>1),...ativos.map(i=>S.map(c=>K[i].a[c]))], b=[Rr,...lados];
          const sol=resolverSistema(A,b); if(!sol) return;
          if(s>1&&sol.some(v=>v<=eps)) return;          // quantidade zero já é coberta por um grupo menor
          const x={}; S.forEach((c,j)=>x[c]=sol[j]);
          if(dentro(x)) cands.push(x);
        });
      }));
    }
    return cands;
  }

  /* Menor afastamento possível, como fração da tolerância (z). z ≤ 1 significa
     que existe solução dentro das tolerâncias. Tolerância zero = exigência exata. */
  const tolN=K.map(k=>Math.max(k.tol,1e-6));
  function menorAfastamento(){
    let z=Infinity;
    livres.forEach(c=>{z=Math.min(z,Math.max(...K.map((k,i)=>Math.abs(k.a[c]*Rr-k.T)/tolN[i])))});
    if(K.length===1){
      subconjuntos(livres,2).forEach(S=>{
        const sol=resolverSistema([[1,1],S.map(c=>K[0].a[c])],[Rr,K[0].T]);
        if(sol&&sol.every(v=>v>=-eps)) z=0;});
    }else{
      subconjuntos(livres,2).forEach(S=>[1,-1].forEach(s1=>[1,-1].forEach(s2=>{
        const sol=resolverSistema([[1,1,0],[K[0].a[S[0]],K[0].a[S[1]],-s1*tolN[0]],
                                   [K[1].a[S[0]],K[1].a[S[1]],-s2*tolN[1]]],[Rr,K[0].T,K[1].T]);
        if(sol&&sol[0]>=-eps&&sol[1]>=-eps&&sol[2]>=-eps) z=Math.min(z,sol[2]);})));
      subconjuntos(livres,3).forEach(S=>{
        const sol=resolverSistema([[1,1,1],S.map(c=>K[0].a[c]),S.map(c=>K[1].a[c])],[Rr,K[0].T,K[1].T]);
        if(sol&&sol.every(v=>v>=-eps)) z=0;});
    }
    return Math.max(0,z);
  }

  const txt=x=>Object.keys(x).map(c=>`${c} ${fmt(x[c])}%`).join(" + ");
  const faixa=k=>`${fmt(k.alvo-k.tol)} a ${fmt(k.alvo+k.tol)}`;
  K.forEach((k,i)=>m.ent.push([K.length>1?`Critério ${i+1}`:"Meta",
    `${k.nutriente} da original = ${fmt(k.alvo)} ${k.un} → aceito de ${faixa(k)}`]));
  m.ent.push(["Total a fechar",`${fmt(total)}% (o mesmo da original)`],
    ["Mantidos como estão",fixos.length?fixos.map(c=>`${c} ${fmt(fAtual[c]||0)}%`).join("; "):"nenhum"],
    ["Calculados pelo sistema",livres.map(c=>`${c} (${K.map(k=>`${k.nutriente} ${fmt(k.a[c]*100)} ${k.un}`).join(", ")} na MN; ${brl(pr[c])}/t)`).join("; ")],
    ["Escolha",modo==="custo"?"a combinação mais barata":"a combinação mais parecida com a original"]);
  m.form=modo==="custo"
    ? "Entre as combinações dos ingredientes livres que fecham o total e mantêm os critérios na faixa, escolher a de menor custo"
    : "Entre as combinações que fecham o total, escolher a de menor afastamento da original (como fração da tolerância de cada critério); no empate, a de menor custo";
  avisoSemPerfil(sub(fAtual),semPerfil,m);

  const z=menorAfastamento();
  const perto=z*1.0000001+1e-9;                         // tolerâncias mínimas que ainda têm solução
  let cands=(modo==="proximo")?(z<=1+1e-6?enumerar(tolN.map(t=>t*perto)):[]):enumerar(K.map(k=>k.tol));

  if(!cands.length){
    // mostra o mais perto que dá para chegar, sem aplicar
    const prox=enumerar(tolN.map(t=>t*perto)).sort((x,y)=>custoDe(x)-custoDe(y))[0];
    const det=prox?K.map(k=>`${k.nutriente} fica em ${fmt(nutDe(k,prox)+k.nutFix)} ${k.un} (meta de ${faixa(k)})`).join("; "):"";
    return falha(`não existe combinação dentro da tolerância. O mais perto que os ingredientes livres (${livres.join(", ")}) `+
      `chegam, fechando ${fmt(Rr)}%: ${det}${prox?` — com ${txt(prox)}`:""}. `+
      `Destrave outro ingrediente, mude um travado ou aumente a tolerância.`);
  }
  cands.sort((x,y)=>custoDe(x)-custoDe(y));
  // a mesma combinação pode sair de dois sistemas diferentes: mostra uma vez só
  const vistos=new Set();
  cands=cands.filter(x=>{const k=livres.map(c=>arred(x[c]||0)).join("|"); if(vistos.has(k)) return false; vistos.add(k); return true});
  const melhor=cands[0];
  if(modo==="proximo") m.passos.push(`Menor afastamento possível: ${fmt(z*100)}% da tolerância `+
    `(${K.map(k=>`${k.nutriente} ±${fmt(Math.max(k.tol,0)*z)}`).join("; ")}).`);
  cands.slice(0,8).forEach((x,i)=>m.passos.push(
    `${i===0?"✔ ":""}${txt(x)} → ${K.map(k=>`${k.nutriente} ${fmt(nutDe(k,x)+k.nutFix)} ${k.un}`).join(", ")}; `+
    `custo destes ${brl(custoDe(x))}/t${i===0?(modo==="custo"?" (menor custo)":" (escolhida)"):""}`));
  if(cands.length>8) m.passos.push(`… e mais ${cands.length-8} combinações mais caras.`);

  // monta a formulação, arredonda a 2 casas e acerta o centavo de arredondamento no maior
  const f=sub(fAtual);
  livres.forEach(c=>f[c]=arred(melhor[c]||0));
  const dif=arred(Rr-livres.reduce((s,c)=>s+f[c],0));
  if(Math.abs(dif)>0){const maior=livres.reduce((x,y)=>f[y]>f[x]?y:x); f[maior]=arred(f[maior]+dif)}

  const crit=K.map(k=>{const obt=nutriFormulacao(f,k.nutriente,semPerfil).v;
    return {nutriente:k.nutriente,un:k.un,alvo:k.alvo,obtido:obt,tol:k.tol}});
  m.res=`${livres.map(c=>`${c} ${fmt(f[c])}%`).join(", ")} → `+crit.map(k=>
    `${k.nutriente} ${fmt(k.obtido)} ${k.un} (original ${fmt(k.alvo)}; diferença ${arred(k.obtido-k.alvo)>0?"+":""}${fmt(k.obtido-k.alvo)})`).join(" · ");
  if(modo==="custo"&&K.some(k=>k.tol>eps)) m.avisos.push("O menor custo costuma ficar no limite de alguma tolerância: o sistema usa a folga que você deu. Para ficar mais perto da original, reduza a tolerância ou use “mais parecida com a original”.");
  if(modo==="proximo") m.avisos.push("Aqui o custo é consequência: a combinação foi escolhida por ficar perto da original, não por ser a mais barata.");
  m.avisos.push(`Só ${K.map(k=>k.nutriente).join(" e ")} ${K.length>1?"foram preservados":"foi preservado"}. Os outros nutrientes podem ter mudado — confira na comparação abaixo.`);
  return {f,m,crit,alvo:crit[0].alvo,obtido:crit[0].obtido,custoLivres:custoDe(melhor),afastamento:z};
}
