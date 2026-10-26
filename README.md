# Foco Fit

App Android para seguir a dieta, o treino e o cardio, com um personagem que evolui. Avisa nos horários das refeições, do treino e da água.

## Instalar no celular

1. No celular, abra a página **Releases** deste repositório e baixe o `foco-fit.apk` da versão mais recente.
2. Toque no arquivo baixado. Se o Android pedir, permita **instalar apps desconhecidos** para o navegador.
3. Abra o Foco Fit e permita as notificações.

Versões novas instalam por cima e mantêm seus dados.

## Como funciona o código

- `src/` tem a página do app (`head.html`, `consts.js`, `logic.js`) e a ponte para as notificações nativas (`native-entry.js`).
- `npm run build` junta tudo em `www/index.html`; `npm run sync` copia para o projeto Android (Capacitor).
- A cada push na `main`, o GitHub Actions compila o APK e publica em Releases.
