import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript');}catch{
 try { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'); }
 catch { console.error('Instala TypeScript o ejecuta npm install');process.exit(2); }
}
const root=path.resolve(import.meta.dirname,'..');
let sources=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(p))sources.push(p)}}
walk(path.join(root,'src'));sources.push(path.join(root,'App.tsx'));
let errors=0,imports=0;
for(const file of sources){
 const source=fs.readFileSync(file,'utf8');
 const out=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 for(const d of out.diagnostics??[]){if(d.category===ts.DiagnosticCategory.Error){console.error(`${path.relative(root,file)}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`);errors++}}
 const tree=ts.createSourceFile(file,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
 for(const node of tree.statements){if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
  const target=node.moduleSpecifier.text;
  if(target.startsWith('.')) {imports++;const targetPath=path.resolve(path.dirname(file),target);if(!['.ts','.tsx','.js','.jsx','/index.ts','/index.tsx'].some(ext=>fs.existsSync(targetPath+ext))){console.error(`Import no encontrado: ${path.relative(root,file)} → ${target}`);errors++}}
 }}
}
console.log(`${sources.length} archivos TS/TSX verificados; ${imports} imports internos; ${errors} errores estructurales.`);
if(errors)process.exit(1);
