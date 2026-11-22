export type RolCofre = 'comprador' | 'comerciante';
export interface CofreIdentity {
  authId: string;
  userId: number;
  email: string;
  nombre: string;
  compradorId: number | null;
  comercianteId: number | null;
  staff: boolean;
  revisor: boolean;
}
export function parsePositiveId(value: unknown): number {
  const text = String(value ?? '');
  const num = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(num) || num <= 0) throw new Error('Identificador invalido');
  return num;
}
export function compareCents(amount: unknown, expectedCents: number): boolean {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return false;
  return Math.round(amount * 100) === expectedCents && Math.abs(amount * 100 - expectedCents) < 0.01;
}
