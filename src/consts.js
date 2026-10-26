(function(){
"use strict";
/* ---------- dietas modelo (horário em minutos depois de acordar) ---------- */
const TIPOS = {cafe:"Café da manhã",lanche:"Lanche",almoco:"Almoço",pre:"Pré-treino",jantar:"Jantar",ceia:"Ceia"};
const TEMPLATES = {
  emagrecer:{nome:"Emagrecer e perder gordura",meals:[
    {tipo:"cafe",off:20,nome:"Café da manhã",main:true,itens:["1 pão francês","2 ovos (ou 1, conforme a fome)","Café com leite"]},
    {tipo:"lanche",off:180,nome:"Lanche (opcional)",main:false,itens:["1 banana ou outra fruta da estação"]},
    {tipo:"almoco",off:330,nome:"Almoço",main:true,itens:["3–4 colheres de arroz","1 concha de feijão","1 porção de carne ou frango","Salada ou legumes à vontade"]},
    {tipo:"pre",off:600,nome:"Lanche pré-treino",main:true,itens:["1 pão francês com 1–2 ovos","ou 1 banana com aveia e leite"]},
    {tipo:"jantar",off:870,nome:"Jantar",main:true,itens:["3–4 colheres de arroz","1 concha de feijão","2 ovos ou porção de frango","Legumes ou salada"]}]},
  massa:{nome:"Ganhar massa muscular",meals:[
    {tipo:"cafe",off:20,nome:"Café da manhã",main:true,itens:["2 pães franceses","3 ovos","Café com leite","1 banana"]},
    {tipo:"lanche",off:180,nome:"Lanche da manhã",main:true,itens:["1 iogurte com 2 colheres de aveia","1 fruta"]},
    {tipo:"almoco",off:330,nome:"Almoço",main:true,itens:["5–6 colheres de arroz","1 concha de feijão","Porção grande de carne ou frango","Salada à vontade"]},
    {tipo:"pre",off:600,nome:"Lanche pré-treino",main:true,itens:["Pão com 2 ovos","ou banana com aveia e leite"]},
    {tipo:"jantar",off:870,nome:"Jantar",main:true,itens:["5 colheres de arroz","1 concha de feijão","Porção de frango ou carne","Legumes"]},
    {tipo:"ceia",off:960,nome:"Ceia",main:false,itens:["1 copo de leite ou 1 iogurte"]}]},
  saude:{nome:"Comer melhor e manter o peso",meals:[
    {tipo:"cafe",off:20,nome:"Café da manhã",main:true,itens:["1 pão francês ou 2 fatias de pão integral","1–2 ovos ou queijo branco","Café com leite","1 fruta"]},
    {tipo:"lanche",off:180,nome:"Lanche (opcional)",main:false,itens:["1 fruta ou 1 iogurte"]},
    {tipo:"almoco",off:330,nome:"Almoço",main:true,itens:["4 colheres de arroz","1 concha de feijão","1 porção de proteína","Metade do prato com salada e legumes"]},
    {tipo:"pre",off:600,nome:"Lanche da tarde",main:true,itens:["Iogurte com fruta","ou pão com queijo branco"]},
    {tipo:"jantar",off:840,nome:"Jantar",main:true,itens:["Prato parecido com o almoço, porção menor","ou omelete com salada"]}]}
};
const OBJETIVOS = [["emagrecer","Emagrecer e perder gordura"],["massa","Ganhar massa muscular"],["saude","Comer melhor e manter"]];
const CHIPS = {
  cafe:["Iogurte natural","Queijo branco","Requeijão light","Peito de peru","Tapioca","Bolacha recheada","Bolo"],
  lanche:["Maçã","Iogurte","Barrinha de cereal","Salgadinho","Biscoito recheado"],
  almoco:["Macarrão","Peixe","Ovo","Lasanha","Fritura","Batata frita"],
  pre:["Tapioca com queijo","Iogurte com fruta","Pão com queijo","Salgado de padaria","Pão de queijo"],
  jantar:["Omelete","Sopa","Cuscuz com ovo","Pizza","Hambúrguer","Miojo"],
  ceia:["Leite","Iogurte","Fruta","Chocolate","Biscoito"]
};
const ALTS = {
  cafe:["1 pote de iogurte natural (troca os ovos)","2 fatias de queijo branco no pão","Pão com requeijão light e peito de peru","Leite batido com banana e aveia"],
  lanche:["1 fruta (banana, maçã, mamão...)","1 iogurte natural","Pular, se estiver sem fome"],
  almoco:["Monte o prato: metade salada, 1/4 proteína, 1/4 arroz e feijão","Frango ou carne grelhada com arroz e feijão","Omelete de 2 ovos com legumes"],
  pre:["Banana com aveia e leite","Iogurte natural com fruta","Pão com 1 ovo ou queijo branco"],
  jantar:["Omelete de 2 ovos com salada","Frango com arroz, feijão e legumes","Sopa de legumes com frango desfiado"],
  ceia:["1 copo de leite","1 iogurte natural","1 fruta pequena"]
};
const DEFAULT_TREINOS = {1:"Glúteos",2:"Costas",3:"Quadríceps",4:"Ombro e tríceps",5:"Posterior",6:"",0:""};
const WD = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const WDL = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
const MES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

/* alimentos: [palavras, veredito, comentário] — ordem importa (específico antes do geral) */
const FOODS = [
  ["batata doce|mandioca cozida|aipim cozido","ok","Boa troca para o arroz, na mesma quantidade."],
  ["pao de queijo","mod","2 unidades pequenas no máximo, tem bastante gordura."],
  ["bolacha recheada|biscoito recheado|recheado|wafer","no","Muito açúcar e gordura, quase nada de proteína."],
  ["bolacha de agua e sal|cream cracker|torrada","mod","Pode de vez em quando, mas sacia pouco. Junte uma proteína (queijo branco, iogurte)."],
  ["bolo recheado|bolo de pote|torta doce","no","Doce de festa: muitas calorias numa fatia."],
  ["bolo","mod","1 fatia fina de bolo simples, só às vezes. Não ajuda a matar a fome por muito tempo."],
  ["coxinha|pastel|esfiha|esfirra|kibe|quibe|empada|salgado|enroladinho|risole","no","Salgado frito ou de massa folhada: gordura alta e pouca saciedade."],
  ["batata frita|frito|fritura|frita|nuggets|empanado","no","Fritura dobra as calorias do prato."],
  ["pizza","no","Muitas calorias por fatia, fácil passar do ponto."],
  ["hamburguer|hamburger|x-salada|x salada|x-burguer|x burguer|cachorro quente|lanche de lanchonete","no","Lanche de lanchonete costuma passar de 600 kcal."],
  ["miojo|macarrao instantaneo|lamen instantaneo","no","Muito sódio, pouca proteína e pouca fibra."],
  ["refrigerante|refri|coca|guarana|suco de caixa|suco em po|suco de saquinho|cha gelado","no","Bebida com açúcar: calorias que não matam a fome. Prefira zero, água ou café."],
  ["salgadinho|chips|doritos|ruffles|cheetos","no","Ultraprocessado: muita gordura e sódio."],
  ["chocolate|brigadeiro|sorvete|pudim|doce de leite|leite condensado|bala|bombom|nutella|doce","no","Doce no lugar de refeição deixa você com fome logo depois. Se a vontade apertou, veja a aba Doces."],
  ["biscoito|bolacha","mod","Biscoito sem recheio pode, mas em pouca quantidade (3–4 unidades) e com uma proteína junto."],
  ["iogurte grego zero|iogurte natural|iogurte desnatado|iogurte","ok","Boa proteína. Prefira natural ou zero açúcar."],
  ["requeijao light|cream cheese light","ok","Leve e combina com pão."],
  ["requeijao|cream cheese","mod","Use 1 colher fina. A versão light é melhor."],
  ["queijo branco|queijo minas|minas frescal|cottage|ricota|queijo coalho","ok","Proteína boa, substitui bem os ovos."],
  ["queijo mussarela|mussarela|muçarela|queijo prato|queijo","mod","Queijo amarelo tem mais gordura: 1 fatia só."],
  ["peito de peru|blanquet|presunto magro","ok","Proteína prática e leve."],
  ["presunto|mortadela|salame|salsicha|linguica|bacon","mod","Embutido tem bastante sódio e gordura. Use pouco e não todo dia."],
  ["frango|peixe|tilapia|atum|sardinha|carne moida|patinho|carne|bife|file|omelete|ovo|ovos","ok","Ótima proteína: mantém a fome sob controle."],
  ["whey|shake de proteina","ok","Proteína prática, bom para trocar os ovos."],
  ["leite","ok","Tem proteína. Já faz parte da sua dieta."],
  ["tapioca","mod","Tapioca é carboidrato puro. Vale como troca do pão, com recheio de queijo branco, frango ou ovo."],
  ["cuscuz","ok","Boa troca para o pão ou arroz. Junte uma proteína."],
  ["pao integral|pao frances|pao de forma|pao","ok","Faz parte da dieta. Junte uma proteína."],
  ["granola","mod","Granola costuma ter açúcar. Use 2 colheres, não mais."],
  ["aveia","ok","Fibra que sustenta bem."],
  ["barrinha|barra de cereal|barra de proteina","mod","Ok numa correria. Prefira as com menos de 100 kcal."],
  ["acai","mod","Açaí puro, pequeno e sem leite condensado. Com complementos vira sobremesa."],
  ["suco natural|suco de laranja|suco","mod","Suco natural tem o açúcar de várias frutas. Comer a fruta inteira sacia mais."],
  ["vitamina|smoothie","ok","Leite com fruta (sem açúcar) é ótimo, até como pré-treino."],
  ["castanha|amendoim|pasta de amendoim|nozes","mod","Gordura boa, mas calórica: um punhado pequeno ou 1 colher."],
  ["lasanha|strogonoff|estrogonofe|feijoada|parmegiana","mod","Prato pesado: metade da porção e muita salada junto."],
  ["macarrao","mod","Troque o arroz pelo macarrão na mesma quantidade (não coma os dois)."],
  ["batata doce|mandioca|aipim|macaxeira|batata cozida|pure|inhame","ok","Boa troca para o arroz, na mesma quantidade."],
  ["arroz|feijao|lentilha|grao de bico","ok","Faz parte da dieta, mantenha a porção."],
  ["salada|legume|verdura|brocolis|cenoura|abobrinha|chuchu|tomate|alface|pepino|beterraba","ok","Pode à vontade!"],
  ["sopa|caldo","ok","Sopa de legumes com proteína é ótima no jantar."],
  ["banana|maca|mamao|melao|melancia|laranja|pera|uva|abacaxi|morango|manga|goiaba|tangerina|mexerica|kiwi|fruta","ok","Fruta é sempre bem-vinda."],
  ["cafe|cha","ok","Sem açúcar, ou com adoçante, à vontade."]
];
const RANK = {ok:0, mod:1, no:2};
const VERD = {
  ok:{t:"Pode!", cls:"ok"},
  mod:{t:"Pode, com moderação", cls:"mod"},
  no:{t:"Melhor não", cls:"no"}
};

const SWEETS_OK = [
  ["Gelatina zero","1 pote pronto ou caseira",10],
  ["Bala ou chiclete sem açúcar","Engana a vontade",5],
  ["Morangos com 1 colher (chá) de leite condensado","Doce de verdade, porção pequena",70],
  ["Picolé de fruta (limão, morango, uva)","De padaria ou mercado, sem leite",75],
  ["Iogurte grego zero com canela","Cremoso, parece sobremesa",90],
  ["“Sorvete” de banana","Banana congelada batida com canela",100],
  ["Barrinha de cereal light","Leve na bolsa para emergências",80],
  ["Chocolate 70% cacau, 2 quadradinhos","Coma devagar, com um café",110],
  ["Paçoquinha (1 unidade)","Sacia rápido por ser de amendoim",105],
  ["Banana amassada com aveia e canela","Quentinha no micro-ondas",130],
  ["Pipoca de panela com canela","2 xícaras, pouco óleo",120]
];
const SWEETS_BAD = [
  ["Brigadeiro (1 unidade)","Difícil parar em um",100],
  ["Sorvete de massa, 2 bolas","",280],
  ["Fatia de bolo recheado","",350],
  ["Barra de chocolate ao leite 90 g","",480],
  ["Pacote de biscoito recheado","",700]
];

