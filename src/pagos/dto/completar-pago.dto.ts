import { IsString, MaxLength, MinLength } from 'class-validator';

export class CompletarPagoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  metodo_pago!: string;
}