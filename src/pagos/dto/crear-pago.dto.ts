import {
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearPagoDto {
  @IsInt()
  @Min(1)
  paquete_id!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  referencia!: string;
}