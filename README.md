# Foco Fit

App Android para seguir a dieta, o treino e o cardio, com um personagem que evolui. Avisa nos horários das refeições, do treino e da água.

## Instalar no celular

1. No celular, abra a página **Releases** deste repositório e baixe o `foco-fit.apk` da versão mais recente.
2. Toque no arquivo baixado. Se o Android pedir, permita **instalar apps desconhecidos** para o navegador.
3. Abra o Foco Fit e permita as notificações.

Versões novas instalam por cima e mantêm seus dados.

## Modo professor

Na primeira tela (ou em Evolução > Área do professor), o personal cadastra os alunos, monta o treino com vídeo de cada exercício e a dieta pelo objetivo, e envia por link ou QR code. O aluno abre o link e o plano entra no app dele. No fim da semana o aluno toca em "Enviar relatório" e o professor recebe dieta, treinos, cargas, peso e um recado. Tudo fica no aparelho de cada um; os dados viajam só dentro do link.

## Como funciona o código

- `src/` tem a página do app: `head.html` (estilos), `consts.js`, `exercises.js` (biblioteca de exercícios e vídeos), `logic.js` (dieta, jogo e telas do aluno), `treino.js` (treino guiado, editor, links de plano e relatório), `pro.js` (modo professor) e `boot.js` (início). `native-entry.js` é a ponte para as notificações, links `focofit://` e o QR code.
- `npm run build` junta tudo em `www/index.html`; `npm run sync` copia para o projeto Android (Capacitor).
- A cada push na `main`, o GitHub Actions compila o APK e publica em Releases.
