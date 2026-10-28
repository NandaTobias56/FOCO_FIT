/* ---------- biblioteca de exercícios ----------
   [id, nome, grupo, equipamento, vídeo do YouTube (id), dicas de execução, erro comum]
   Os vídeos são de professores brasileiros no YouTube. Sem vídeo, o app abre a busca no YouTube. */
const GRUPOS = {
  gluteo:["Glúteos","#FF4F9A"], quadriceps:["Quadríceps","#FF9A3C"], posterior:["Posterior","#FFD84A"], panturrilha:["Panturrilha","#B9774A"],
  costas:["Costas","#3CDCF7"], peito:["Peito","#9C6BFF"], ombro:["Ombro","#3DE38D"], triceps:["Tríceps","#FF6464"], biceps:["Bíceps","#F4A8FF"],
  abdomen:["Abdômen","#8BEBFB"], outro:["Outro","#9AA3B5"]
};
const EXERCICIOS = [
  ["elev_pelvica","Elevação pélvica","gluteo","Barra e banco","hzSp2bDerCU",["Costas apoiadas no banco na altura das escápulas","Pés afastados na largura do quadril, canelas na vertical no topo","Suba empurrando com os calcanhares e segure 1 segundo contraindo o glúteo"],"Arquear a lombar no topo em vez de contrair o glúteo"],
  ["agach_sumo","Agachamento sumô","gluteo","Halter ou kettlebell","WB_4TySrqNA",["Pés bem afastados e pontas para fora","Joelhos acompanham a direção dos pés","Desça com o tronco firme e suba apertando o glúteo"],"Deixar os joelhos caírem para dentro"],
  ["abdutora","Cadeira abdutora","gluteo","Máquina","50qHGus1TZk",["Quadril bem encaixado no banco","Abra as pernas com controle e segure 1 segundo","Volte devagar, sem deixar o peso bater"],"Usar impulso e deixar a carga bater na volta"],
  ["coice_polia","Glúteo coice na polia","gluteo","Polia baixa e tornozeleira","S2_Rsx-Ud2w",["Tronco levemente inclinado e abdômen firme","Leve a perna para trás pelo glúteo, sem girar o quadril","Volte devagar até sentir o glúteo alongar"],"Compensar arqueando a lombar"],
  ["gluteo_4apoios","Glúteo 4 apoios","gluteo","Caneleira","HXYhJMsui_I",["Mãos embaixo dos ombros e joelhos embaixo do quadril","Suba a perna até a coxa ficar alinhada ao tronco","Abdômen contraído o tempo todo"],"Subir demais a perna e arquear a coluna"],
  ["bulgaro","Agachamento búlgaro","gluteo","Halteres e banco","gmDBJYTgRUA",["Pé de trás apoiado no banco","Tronco levemente inclinado para frente para focar no glúteo","Desça até o joelho de trás quase tocar o chão"],"Ficar com o pé da frente perto demais do banco"],
  ["afundo","Afundo","gluteo","Halteres","FM2Butrvejo",["Passo largo e tronco firme","Desça reto, os dois joelhos perto de 90°","Empurre com o calcanhar da frente para subir"],"Joelho da frente entrando para dentro"],
  ["step_up","Subida no banco","gluteo","Banco e halteres","BGtG8a-wAsc",["Pé inteiro apoiado em cima do banco","Suba com a força da perna da frente, sem impulso da de trás","Desça devagar"],"Dar impulso com a perna de baixo"],
  ["ponte","Ponte de glúteo no solo","gluteo","Peso do corpo ou anilha","MmmgKMkT2A0",["Deitada, joelhos dobrados e pés no chão","Suba o quadril até alinhar joelhos, quadril e ombros","Segure 2 segundos no topo"],"Empurrar com a ponta dos pés em vez dos calcanhares"],
  ["agach_livre","Agachamento livre","quadriceps","Barra","rM6SDUdl9fs",["Pés na largura dos ombros e barra apoiada no trapézio","Desça como se fosse sentar, peito aberto","Joelhos acompanham as pontas dos pés"],"Tirar o calcanhar do chão ou arredondar a coluna"],
  ["leg_press","Leg press 45°","quadriceps","Máquina","waAxlYvtCcI",["Lombar e quadril sempre colados no banco","Desça até o joelho chegar perto de 90°","Não trave os joelhos ao estender"],"Descer demais e tirar o quadril do banco"],
  ["extensora","Cadeira extensora","quadriceps","Máquina","mruTNzILY3U",["Joelho alinhado com o eixo da máquina","Estenda e segure 1 segundo no topo","Desça devagar, em 2 a 3 segundos"],"Jogar o peso com impulso"],
  ["hack","Agachamento hack","quadriceps","Máquina","gEYYCvNI6hI",["Costas inteiras apoiadas","Pés no meio da plataforma","Desça controlando e suba sem travar os joelhos"],"Descer rápido e quicar no fundo"],
  ["goblet","Agachamento goblet","quadriceps","Halter ou kettlebell","DF9sXArkDUw",["Segure o peso junto ao peito","Desça entre as pernas mantendo o tronco alto","Cotovelos por dentro dos joelhos no fundo"],"Inclinar o tronco demais para frente"],
  ["agach_smith","Agachamento no Smith","quadriceps","Smith","",["Pés um pouco à frente da barra","Desça até as coxas ficarem paralelas ao chão","Suba empurrando o chão"],"Pés muito para trás, forçando o joelho"],
  ["stiff","Stiff","posterior","Barra ou halteres","d6B1gWaEtmA",["Joelhos levemente dobrados e fixos","Leve o quadril para trás deslizando a barra rente às pernas","Desça até sentir o posterior alongar, coluna reta"],"Arredondar as costas para descer mais"],
  ["terra_romeno","Levantamento terra romeno","posterior","Barra","jSomWOwLiGE",["Comece em pé, barra encostada nas coxas","Quadril para trás, joelhos levemente flexionados","Suba contraindo glúteo e posterior"],"Transformar em agachamento dobrando muito os joelhos"],
  ["flexora_deitada","Mesa flexora","posterior","Máquina","8Nat6GRiEoc",["Quadril colado no banco","Puxe o rolo até perto do glúteo","Volte devagar sem estender totalmente de forma brusca"],"Tirar o quadril do banco para ajudar"],
  ["flexora_sentada","Cadeira flexora","posterior","Máquina","_TDeIBSoKzk",["Joelho alinhado ao eixo da máquina","Trave a coxa com o apoio de cima","Flexione e volte em 3 segundos"],"Sair do banco com o quadril"],
  ["good_morning","Bom dia (good morning)","posterior","Barra","",["Barra no trapézio e joelhos levemente dobrados","Incline o tronco levando o quadril para trás","Coluna neutra do começo ao fim"],"Usar carga alta antes de dominar o movimento"],
  ["panturrilha_pe","Panturrilha em pé","panturrilha","Máquina ou step","cklp_Xh5V8M",["Calcanhar desce abaixo do step","Suba na ponta dos pés e segure 1 segundo","Movimento lento, sem quicar"],"Fazer meia amplitude e rápido"],
  ["panturrilha_sent","Panturrilha sentada","panturrilha","Máquina","",["Joelhos a 90° com o apoio sobre as coxas","Amplitude completa","Segure 1 segundo em cima"],"Quicar no fundo do movimento"],
  ["puxada_frente","Puxada frontal","costas","Polia alta","BOW9my4J_ek",["Pegada um pouco mais aberta que os ombros","Peito para cima e puxe a barra até o alto do peito","Pense em levar os cotovelos para baixo"],"Puxar com os braços e jogar o tronco para trás"],
  ["remada_baixa","Remada baixa","costas","Polia baixa com triângulo","2YebbYuuBJQ",["Coluna reta e joelhos levemente dobrados","Puxe o triângulo até o umbigo","Junte as escápulas no final"],"Balançar o tronco para frente e para trás"],
  ["remada_curvada","Remada curvada","costas","Barra","_vO2dAnz__c",["Tronco inclinado uns 45° e coluna reta","Puxe a barra em direção ao umbigo","Cotovelos perto do corpo"],"Levantar o tronco a cada repetição"],
  ["serrote","Remada unilateral (serrote)","costas","Halter e banco","VoGNKTI5wG8",["Joelho e mão apoiados no banco","Puxe o halter em direção ao quadril","Desça até alongar as costas"],"Girar o tronco para subir o peso"],
  ["pulldown","Pulldown braços estendidos","costas","Polia alta","3uIW1Wmc2_I",["Braços quase retos o tempo todo","Leve a barra até as coxas pela força das costas","Volte devagar até a altura da cabeça"],"Dobrar os cotovelos e virar tríceps"],
  ["barra_fixa","Barra fixa (ou graviton)","costas","Barra ou máquina","",["Comece pendurada com os braços estendidos","Puxe até o queixo passar a barra","Desça controlando"],"Balançar o corpo para subir"],
  ["supino_reto","Supino reto","peito","Barra","pCPyqW60Wuk",["Escápulas juntas e pés firmes no chão","Desça a barra até a linha do peito","Empurre sem tirar o glúteo do banco"],"Abrir demais os cotovelos e forçar o ombro"],
  ["supino_incl","Supino inclinado com halteres","peito","Halteres","G-i3jMIbDmo",["Banco a 30° ou 45°","Desça os halteres ao lado do peito","Suba aproximando os halteres"],"Bater os halteres e perder o controle"],
  ["voador","Voador (peck deck)","peito","Máquina","zEcIgGm7fxU",["Banco ajustado com as mãos na altura do peito","Feche os braços contraindo o peito","Volte devagar até alongar"],"Abrir demais e forçar o ombro"],
  ["flexao","Flexão de braço","peito","Peso do corpo","HaaWL7Gt4Cs",["Mãos um pouco mais abertas que os ombros","Corpo reto como uma prancha","Iniciante: faça com os joelhos no chão"],"Deixar o quadril cair"],
  ["desenvolvimento","Desenvolvimento com halteres","ombro","Halteres","eufDL9MmF8A",["Sentada, costas apoiadas","Halteres na altura das orelhas","Suba sem travar os cotovelos"],"Arquear a lombar para empurrar"],
  ["elev_lateral","Elevação lateral","ombro","Halteres","gURBTU9VSJg",["Cotovelos levemente dobrados","Suba até a altura dos ombros","Desça em 3 segundos"],"Subir com impulso e encolher os ombros"],
  ["elev_frontal","Elevação frontal","ombro","Halteres","jhxLYSm_P-k",["Braços quase retos","Suba até a linha dos ombros","Sem balançar o tronco"],"Usar o corpo para subir o peso"],
  ["crucifixo_inv","Crucifixo inverso","ombro","Halteres ou máquina","G3DXKpk5AJA",["Tronco inclinado e coluna reta","Abra os braços pela parte de trás do ombro","Segure 1 segundo no topo"],"Juntar as escápulas e virar exercício de costas"],
  ["triceps_corda","Tríceps na corda","triceps","Polia alta com corda","7le1JRUUagM",["Cotovelos colados ao corpo","Estenda e abra a corda no final","Volte só até 90°"],"Mexer os cotovelos para frente e para trás"],
  ["triceps_testa","Tríceps testa","triceps","Barra W ou halteres","VakpIeaaeXA",["Deitada, braços apontando para o teto","Desça o peso em direção à testa só dobrando o cotovelo","Suba sem abrir os cotovelos"],"Abrir os cotovelos para os lados"],
  ["triceps_frances","Tríceps francês","triceps","Halter","gB-QMYMlHLs",["Sentada, halter atrás da cabeça","Cotovelos apontando para cima e fixos","Estenda até em cima"],"Abrir demais os cotovelos"],
  ["mergulho_banco","Mergulho no banco","triceps","Banco","qAKB1H2kz2g",["Mãos na beirada do banco, dedos para frente","Desça até o cotovelo fazer 90°","Costas perto do banco"],"Descer demais e forçar o ombro"],
  ["rosca_direta","Rosca direta","biceps","Barra","nUSmTWGzOqA",["Cotovelos colados ao corpo","Suba sem balançar o tronco","Desça em 3 segundos"],"Jogar o corpo para trás para subir"],
  ["rosca_alternada","Rosca alternada","biceps","Halteres","",["Um braço de cada vez","Gire a palma para cima enquanto sobe","Cotovelo parado"],"Balançar o halter"],
  ["rosca_martelo","Rosca martelo","biceps","Halteres","pTyVDap5HaI",["Palmas viradas uma para a outra","Suba até a altura do ombro","Cotovelos fixos"],"Subir rápido e descer sem controle"],
  ["prancha","Prancha","abdomen","Peso do corpo","Yu0wjtD5FkU",["Cotovelos embaixo dos ombros","Corpo reto da cabeça aos pés","Contraia abdômen e glúteo e respire"],"Deixar o quadril cair ou subir demais"],
  ["abd_supra","Abdominal supra","abdomen","Colchonete","hnnr0Jz73vA",["Joelhos dobrados e pés no chão","Suba só as escápulas, olhando para o teto","Solte o ar ao subir"],"Puxar o pescoço com as mãos"],
  ["elev_pernas","Abdominal infra (elevação de pernas)","abdomen","Colchonete","lsfYFbfE45o",["Lombar colada no chão","Suba as pernas juntas","Desça devagar sem encostar no chão"],"Tirar a lombar do chão"]
];
const EXM = {}; EXERCICIOS.forEach(([id,nome,grupo,equip,v,dicas,erro])=>EXM[id]={id,nome,grupo,equip,v,dicas,erro});
/* ordem de escolha por grupo quando o app monta um treino */
const PICKS = {
  gluteo:["elev_pelvica","bulgaro","abdutora","coice_polia","agach_sumo","afundo","step_up","gluteo_4apoios"],
  quadriceps:["agach_livre","leg_press","extensora","afundo","hack","goblet","bulgaro"],
  posterior:["stiff","flexora_deitada","flexora_sentada","terra_romeno","elev_pelvica","good_morning"],
  panturrilha:["panturrilha_pe","panturrilha_sent"],
  costas:["puxada_frente","remada_baixa","serrote","remada_curvada","pulldown","barra_fixa"],
  peito:["supino_reto","supino_incl","voador","flexao"],
  ombro:["desenvolvimento","elev_lateral","elev_frontal","crucifixo_inv"],
  triceps:["triceps_corda","triceps_testa","triceps_frances","mergulho_banco"],
  biceps:["rosca_direta","rosca_martelo","rosca_alternada"],
  abdomen:["prancha","abd_supra","elev_pernas"]
};
/* palavras no nome do treino -> grupos trabalhados */
const DAY_GROUPS = [
  [/corpo todo|full|geral/,["quadriceps","costas","peito","gluteo","ombro","abdomen"]],
  [/inferior|perna/,["quadriceps","gluteo","posterior","panturrilha"]],
  [/superior/,["costas","peito","ombro","triceps","biceps"]],
  [/glut|bumbum/,["gluteo"]],[/quadri|coxa/,["quadriceps"]],[/posterior/,["posterior"]],[/panturr/,["panturrilha"]],
  [/costa/,["costas"]],[/peito|peitoral/,["peito"]],[/ombro/,["ombro"]],[/tricep/,["triceps"]],[/bicep/,["biceps"]],
  [/braco/,["biceps","triceps"]],[/abd|core/,["abdomen"]]
];
const NIVEIS = [["iniciante","Iniciante"],["intermediario","Intermediário"],["avancado","Avançado"]];
const FOCOS = [["equilibrado","Equilibrado"],["inferiores","Glúteos e pernas"],["superiores","Parte de cima"]];
const SPLITS = {
  equilibrado:{1:["Corpo todo"],2:["Corpo todo A","Corpo todo B"],3:["Inferiores","Superiores","Corpo todo"],4:["Inferiores A","Peito, ombro e tríceps","Inferiores B","Costas e bíceps"],
    5:["Peito e tríceps","Costas e bíceps","Pernas","Ombro e abdômen","Glúteos e posterior"],6:["Peito e tríceps","Costas e bíceps","Quadríceps","Ombro e abdômen","Glúteos e posterior","Corpo todo"]},
  inferiores:{1:["Corpo todo"],2:["Glúteos e posterior","Quadríceps e glúteos"],3:["Glúteos e posterior","Superiores","Quadríceps e glúteos"],4:["Glúteos","Costas e bíceps","Quadríceps","Ombro e tríceps"],
    5:["Glúteos","Costas","Quadríceps","Ombro e tríceps","Posterior"],6:["Glúteos","Costas e bíceps","Quadríceps","Ombro e tríceps","Posterior e glúteos","Inferiores"]},
  superiores:{1:["Corpo todo"],2:["Superiores A","Inferiores"],3:["Peito, ombro e tríceps","Inferiores","Costas e bíceps"],4:["Peito e tríceps","Inferiores","Costas e bíceps","Ombro e abdômen"],
    5:["Peito e tríceps","Costas e bíceps","Inferiores","Ombro e abdômen","Superiores"],6:["Peito e tríceps","Costas e bíceps","Inferiores A","Ombro e abdômen","Superiores","Inferiores B"]}
};
