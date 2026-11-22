/** Validacion independiente de NestJS, reutilizable en pruebas. */
export interface ArchivoComprobante {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
export interface ComprobanteValido { mime: string; extension: 'jpg' | 'png' | 'webp' | 'pdf'; nombre: string }
const MAX_BYTES = 5 * 1024 * 1024;
const SAFE_MIMES = new Set(['image/jpeg','image/png','image/webp','application/pdf','application/octet-stream']);
export function validarComprobante(file?: ArchivoComprobante): ComprobanteValido {
  if (!file || !Buffer.isBuffer(file.buffer)) throw new Error('Selecciona una imagen o un PDF');
  if (!Number.isInteger(file.size) || file.size < 32 || file.size > MAX_BYTES || file.buffer.length !== file.size)
    throw new Error('El comprobante debe ocupar entre 32 bytes y 5 MB');
  if (!SAFE_MIMES.has(String(file.mimetype || '').toLowerCase())) throw new Error('Tipo de archivo no permitido');
  const b = file.buffer;
  let extension: ComprobanteValido['extension'];
  let mime: string;
  if (b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {extension='png'; mime='image/png';}
  else if (b[0]===0xff && b[1]===0xd8 && b[2]===0xff) {extension='jpg'; mime='image/jpeg';}
  else if (b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP') {extension='webp';mime='image/webp';}
  else if (b.toString('ascii',0,5)==='%PDF-') {extension='pdf';mime='application/pdf';}
  else throw new Error('El archivo no parece ser una imagen JPG, PNG, WebP o PDF valido');
  if (file.mimetype !== 'application/octet-stream' && file.mimetype !== mime)
    throw new Error('El tipo declarado no coincide con el contenido del archivo');
  // El nombre se muestra solo al revisor, nunca se utiliza para la ruta del objeto.
  const nombre = String(file.originalname || `comprobante.${extension}`)
    .replace(/[\\/\\\\\x00-\x1f<>:\"|?*]/g, '_').slice(0,120);
  return {extension,mime,nombre};
}
