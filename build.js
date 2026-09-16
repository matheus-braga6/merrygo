#!/usr/bin/env node
'use strict';

/**
 * MerryGo - build
 *
 * Fonte da verdade: src/merrygo.js (classe MerryGo, sem export nem module.exports).
 * A partir dela este script gera:
 *
 *   dist/merrygo.js      script clássico / CommonJS: expõe window.MerryGo e module.exports.
 *                        É o "main", "browser" e "jsdelivr" do package.json (CDN, <script src>, require()).
 *   dist/merrygo.esm.js  ES module: export default MerryGo (import MerryGo from 'merrygo-carousel').
 *                        É o "module" do package.json.
 *   docs/js/merrygo.js   cópia idêntica do src, usada pela landing e pelos exemplos em docs/.
 *
 * Uso:
 *   npm run build            gera os três arquivos
 *   node build.js --check    não escreve nada; sai com código 1 se algum arquivo gerado estiver desatualizado
 *
 * Os arquivos gerados NÃO devem ser editados à mão: qualquer edição é sobrescrita no próximo build.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src', 'merrygo.js');
const pkg = require(path.join(ROOT, 'package.json'));
const CHECK = process.argv.includes('--check');

function fail(message) {
  console.error(`\n[build] ERRO: ${message}\n`);
  process.exit(1);
}

const src = fs.readFileSync(SRC, 'utf8');
const EOL = src.includes('\r\n') ? '\r\n' : '\n';

// 1) Sanidade do src
if (!/\bclass\s+MerryGo\b/.test(src)) {
  fail('classe MerryGo não encontrada em src/merrygo.js');
}
if (/^\s*(export\s|module\.exports\b)/m.test(src)) {
  fail('src/merrygo.js não deve conter "export" nem "module.exports": os rodapés são adicionados pelo build');
}

// 2) Versão: quando o src declarar MerryGo.version (a partir da 2.0.0), precisa bater com o package.json
const versionMatch = src.match(/MerryGo\.version\s*=\s*['"]([^'"]+)['"]|static\s+version\s*=\s*['"]([^'"]+)['"]/);
const srcVersion = versionMatch ? (versionMatch[1] || versionMatch[2]) : null;
if (srcVersion && srcVersion !== pkg.version) {
  fail(`versão divergente: src declara ${srcVersion}, package.json está em ${pkg.version}`);
}

// 3) Saídas
const body = src.replace(/\s+$/, '');

const outputs = {
  'dist/merrygo.js': body + [
    '',
    '',
    "if (typeof window !== 'undefined') {",
    '  window.MerryGo = MerryGo;',
    '}',
    '',
    "if (typeof module !== 'undefined' && module.exports) {",
    '  module.exports = MerryGo;',
    '}',
    ''
  ].join(EOL),
  'dist/merrygo.esm.js': body + ['', '', 'export default MerryGo;', ''].join(EOL),
  'docs/js/merrygo.js': src
};

let stale = 0;

for (const [relative, content] of Object.entries(outputs)) {
  const absolute = path.join(ROOT, relative);
  const current = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : null;
  const upToDate = current === content;

  if (CHECK) {
    console.log(`[build] ${upToDate ? 'ok          ' : 'DESATUALIZADO'} ${relative}`);
    if (!upToDate) stale++;
    continue;
  }

  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, 'utf8');
  console.log(`[build] ${upToDate ? 'inalterado' : 'gerado    '} ${relative} (${Buffer.byteLength(content, 'utf8')} bytes)`);
}

if (CHECK) {
  if (stale) fail(`${stale} arquivo(s) desatualizado(s). Rode "npm run build".`);
  console.log('[build] tudo atualizado.');
} else {
  const note = srcVersion ? '' : ' (src ainda não declara MerryGo.version; esperado até a 2.0.0)';
  console.log(`[build] concluído: merrygo-carousel ${pkg.version}${note}`);
}
