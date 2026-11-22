import test from 'node:test';
import assert from 'node:assert/strict';
import { validarComprobante } from '../src/cofre/comprobante.validation.ts';
function file(buffer, type, name) { return { buffer, size:buffer.length, mimetype:type, originalname:name }; }
const pad=Buffer.alloc(32,0);
test('acepta PNG real',()=> {
 const b=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pad]);
 assert.equal(validarComprobante(file(b,'image/png','prueba.png')).extension,'png');
});
test('acepta JPEG y lo nombra jpg',()=> {
 const b=Buffer.concat([Buffer.from([255,216,255,224]),pad]);
 assert.equal(validarComprobante(file(b,'image/jpeg','pago.jpg')).extension,'jpg');
});
test('acepta PDF con firma',()=> {
 const b=Buffer.concat([Buffer.from('%PDF-1.7\n'),pad]);
 assert.equal(validarComprobante(file(b,'application/pdf','pago.pdf')).mime,'application/pdf');
});
test('acepta WebP',()=> {
 const b=Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WEBP'),pad]);
 assert.equal(validarComprobante(file(b,'image/webp','pago.webp')).extension,'webp');
});
test('rechaza MIME de imagen con archivo PDF',()=> {
 const b=Buffer.concat([Buffer.from('%PDF-1.7\n'),pad]);
 assert.throws(()=>validarComprobante(file(b,'image/jpeg','fraude.jpg')),/no coincide/);
});
test('rechaza archivo de texto disfrazado de PDF',()=> {
 const b=Buffer.concat([Buffer.from('TEXT'),pad]);
 assert.throws(()=>validarComprobante(file(b,'application/pdf','fraude.pdf')),/no parece/);
});
test('rechaza contenido mayor que 5 MB',()=> {
 const b=Buffer.alloc(5*1024*1024+1);b.set(Buffer.from('%PDF-'));
 assert.throws(()=>validarComprobante(file(b,'application/pdf','grande.pdf')),/5 MB/);
});
test('rechaza contenido no recibido',()=> {
 assert.throws(()=>validarComprobante(undefined),/Selecciona/);
});
