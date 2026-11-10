// Isolated browser acceptance page. Removed by the next production build.
import {readFile,writeFile} from 'node:fs/promises';
let html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; form-action \'none\'">\n<script>window.KIZUNA_EXPANSION_PREVIEW=true;window.KIZUNA_CONFIG={};</script>');
html=html.replace(/<script[^>]+src="kizuna-config\.js"[^>]*><\/script>/g,'');
html=html.replace('</body>','<div style="position:fixed;bottom:6px;left:8px;z-index:999999;padding:6px 10px;background:#233951;color:#fff;border:1px solid #8bdde4;border-radius:8px;font:12px sans-serif;pointer-events:none">APERÇU LOCAL · catalogue proposé · aucun compte connecté</div></body>');
await writeFile(new URL('../public/expansion-preview.html',import.meta.url),html);
console.log('public/expansion-preview.html: network writes blocked; proposal cards enabled only on localhost.');
