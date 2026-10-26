// Junta as partes do app em www/index.html (o mesmo código da versão web, com o módulo nativo).
import {buildSync} from "esbuild";
import {readFileSync, writeFileSync, mkdirSync, cpSync, existsSync} from "node:fs";
const r = p => readFileSync(new URL("../src/" + p, import.meta.url), "utf8");
mkdirSync(new URL("../www/", import.meta.url), {recursive: true});
const head = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#130A26">
<link rel="stylesheet" href="fonts/fonts.css">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>`;
const page = r("head.html").replace(/<link rel="(preconnect|stylesheet)" href="https:\/\/fonts[^>]*>\n?/g, "");
buildSync({entryPoints:[new URL("../src/native-entry.js", import.meta.url).pathname],bundle:true,format:"iife",minify:true,outfile:new URL("../www/native.js", import.meta.url).pathname});
const html = head + page + "<script src=\"native.js\"></script>\n<script>\n" + r("consts.js") + r("logic.js") + "</script>\n</body></html>\n";
writeFileSync(new URL("../www/index.html", import.meta.url), html);
if (existsSync(new URL("../src/fonts", import.meta.url))) cpSync(new URL("../src/fonts", import.meta.url), new URL("../www/fonts", import.meta.url), {recursive: true});
console.log("www/index.html", html.length, "bytes");
