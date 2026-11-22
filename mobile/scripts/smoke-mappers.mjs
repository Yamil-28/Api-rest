import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let ts;
try { ts=require('typescript'); } catch { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'); }
const file=new URL('../src/api/mapper.ts',import.meta.url);
const source=fs.readFileSync(file,'utf8');
const code=ts.transpileModule(source,{fileName:'mapper.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={}; vm.runInNewContext(code,{exports,console}, {timeout:1000});
const p=exports.mapPaquetes({total:1,paquetes:[{id:204,comprador_id:1,comerciante_id:1,codigo_interno:'PK-204',numero_seguimiento:'TRK-204',descripcion:'Audífonos',estado:'RECIBIDO'}]});
assert.equal(p.total,1);assert.equal(p.paquetes[0].codigo_interno,'PK-204');
const a=exports.mapAvisos({total:1,avisos:[{id:'paquete-204',paquete_id:204,titulo:'Actualización del paquete',mensaje:'Listo para retirar',estado:'PENDIENTE_RETIRO'}]});
assert.equal(a.avisos[0].descripcion,'Listo para retirar');assert.equal(a.avisos[0].paqueteId,204);assert.equal(a.avisos[0].estado,'POSITIVO');
console.log('Pruebas de mapeo NestJS → frontend: OK');
