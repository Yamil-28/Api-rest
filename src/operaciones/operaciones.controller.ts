import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Body,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service.js';

type Tabla = 'paquetes' | 'pagos' | 'entregas';

const configuracionTablas: Record<
  Tabla,
  {
    columnas: string;
    campos: readonly string[];
    camposRequeridos: readonly string[];
    camposEnteros: readonly string[];
    camposNumericos: readonly string[];
    camposNulos: readonly string[];
    camposEnum: Partial<Record<string, readonly string[]>>;
  }
> = {
  paquetes: {
    columnas:
      'id, comerciante_id, comprador_id, codigo_interno, numero_seguimiento, descripcion, fecha_recepcion, estado',
    campos: [
      'id',
      'comerciante_id',
      'comprador_id',
      'codigo_interno',
      'numero_seguimiento',
      'descripcion',
      'fecha_recepcion',
      'estado',
    ],
    camposRequeridos: [
      'comerciante_id',
      'comprador_id',
      'codigo_interno',
      'fecha_recepcion',
      'estado',
    ],
    camposEnteros: ['id', 'comerciante_id', 'comprador_id'],
    camposNumericos: [],
    camposNulos: ['numero_seguimiento', 'descripcion'],
    camposEnum: {
      estado: ['RECIBIDO', 'ALMACENADO', 'ENTREGADO', 'CANCELADO'],
    },
  },
  pagos: {
    columnas: 'id, paquete_id, monto, fecha, metodo_pago, estado, referencia',
    campos: [
      'id',
      'paquete_id',
      'monto',
      'fecha',
      'metodo_pago',
      'estado',
      'referencia',
    ],
    camposRequeridos: ['paquete_id', 'monto', 'fecha', 'estado'],
    camposEnteros: ['id', 'paquete_id'],
    camposNumericos: ['monto'],
    camposNulos: ['metodo_pago', 'referencia'],
    camposEnum: {},
  },
  entregas: {
    columnas:
      'id, paquete_id, comprador_id, codigo_recojo_id, usuario_entrega_id, fecha, observaciones',
    campos: [
      'id',
      'paquete_id',
      'comprador_id',
      'codigo_recojo_id',
      'usuario_entrega_id',
      'fecha',
      'observaciones',
    ],
    camposRequeridos: ['paquete_id', 'comprador_id', 'fecha'],
    camposEnteros: [
      'id',
      'paquete_id',
      'comprador_id',
      'codigo_recojo_id',
      'usuario_entrega_id',
    ],
    camposNumericos: [],
    camposNulos: ['codigo_recojo_id', 'usuario_entrega_id', 'observaciones'],
    camposEnum: {},
  },
};

@Controller()
export class OperacionesController {
  private readonly logger = new Logger(OperacionesController.name);
  private readonly paquetesLocales = new Map<number, Record<string, unknown>>();
  private siguientePaqueteLocalId = 1;

  constructor(private readonly supabase: SupabaseService) {}

  @Post('paquetes')
  @ApiTags('Paquetes')
  @ApiOperation({
    summary: 'Crear o actualizar un paquete por ID',
    description:
      'Si se envía un ID existente, actualiza ese paquete; si no, crea un paquete.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        comerciante_id: { type: 'integer' },
        comprador_id: { type: 'integer' },
        codigo_interno: { type: 'string' },
        numero_seguimiento: { type: 'string', nullable: true },
        descripcion: { type: 'string', nullable: true },
        fecha_recepcion: { type: 'string', format: 'date-time' },
        estado: {
          type: 'string',
          enum: ['RECIBIDO', 'ALMACENADO', 'ENTREGADO', 'CANCELADO'],
        },
      },
      required: [
        'comerciante_id',
        'comprador_id',
        'codigo_interno',
        'fecha_recepcion',
        'estado',
      ],
      additionalProperties: false,
    },
  })
  @ApiResponse({ status: 201, description: 'Paquete creado o actualizado' })
  async guardarPaquete(@Body() body: unknown) {
    return this.guardar('paquetes', body, 'No se pudo guardar el paquete');
  }

  @Post('pagos')
  @ApiTags('Pagos')
  @ApiOperation({
    summary: 'Crear o actualizar un pago por ID',
    description:
      'Si se envía un ID existente, actualiza ese pago; si no, crea un pago.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        paquete_id: { type: 'integer' },
        monto: { type: 'number' },
        fecha: { type: 'string', format: 'date-time' },
        metodo_pago: { type: 'string', nullable: true },
        estado: { type: 'string' },
        referencia: { type: 'string', nullable: true },
      },
      required: ['paquete_id', 'monto', 'fecha', 'estado'],
      additionalProperties: false,
    },
  })
  @ApiResponse({ status: 201, description: 'Pago creado o actualizado' })
  async guardarPago(@Body() body: unknown) {
    return this.guardar('pagos', body, 'No se pudo guardar el pago');
  }

  @Post('envios')
  @ApiTags('Envios')
  @ApiOperation({
    summary: 'Crear o actualizar un envío por ID',
    description:
      'Guarda el envío en la tabla entregas. Si se envía un ID existente, actualiza ese envío.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        paquete_id: { type: 'integer' },
        comprador_id: { type: 'integer' },
        codigo_recojo_id: { type: 'integer', nullable: true },
        usuario_entrega_id: { type: 'integer', nullable: true },
        fecha: { type: 'string', format: 'date-time' },
        observaciones: { type: 'string', nullable: true },
      },
      required: ['paquete_id', 'comprador_id', 'fecha'],
      additionalProperties: false,
    },
  })
  @ApiResponse({ status: 201, description: 'Envío creado o actualizado' })
  async guardarEnvio(@Body() body: unknown) {
    return this.guardar('entregas', body, 'No se pudo guardar el envío');
  }

  @Get('paquetes')
  @ApiTags('Paquetes')
  @ApiOperation({ summary: 'Listar todos los paquetes' })
  @ApiResponse({ status: 200, description: 'Lista de paquetes' })
  async listarPaquetes() {
    if (this.usaModoLocal()) {
      return [...this.paquetesLocales.values()].sort(
        (a, b) => Number(a.id) - Number(b.id),
      );
    }

    const { data, error } = await this.supabase.cliente
      .from('paquetes')
      .select(configuracionTablas.paquetes.columnas)
      .order('id');

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(
        'No se pudieron consultar los paquetes',
      );
    }

    return data;
  }

  @Get('paquetes/:id')
  @ApiTags('Paquetes')
  @ApiOperation({ summary: 'Consultar un paquete por ID' })
  @ApiParam({ name: 'id', type: 'integer', example: 1 })
  @ApiResponse({ status: 200, description: 'Paquete encontrado' })
  @ApiResponse({ status: 404, description: 'Paquete no encontrado' })
  async obtenerPaquete(@Param('id', ParseIntPipe) id: number) {
    if (id < 1) {
      throw new BadRequestException('El ID debe ser un entero positivo');
    }

    if (this.usaModoLocal()) {
      const paquete = this.paquetesLocales.get(id);
      if (!paquete) {
        throw new NotFoundException(`No existe el paquete con ID ${id}`);
      }

      return paquete;
    }

    const { data, error } = await this.supabase.cliente
      .from('paquetes')
      .select(configuracionTablas.paquetes.columnas)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('No se pudo consultar el paquete');
    }

    if (!data) {
      throw new NotFoundException(`No existe el paquete con ID ${id}`);
    }

    return data;
  }

  private async guardar(tabla: Tabla, body: unknown, mensajeError: string) {
    const payload = this.validarBody(tabla, body);

    if (this.usaModoLocal()) {
      if (tabla !== 'paquetes') {
        throw new ServiceUnavailableException(
          'El modo local de prueba solo está habilitado para paquetes',
        );
      }

      const id =
        typeof payload.id === 'number'
          ? payload.id
          : this.siguientePaqueteLocalId;
      this.siguientePaqueteLocalId = Math.max(
        this.siguientePaqueteLocalId,
        id + 1,
      );
      const paquete = { ...payload, id };
      this.paquetesLocales.set(id, paquete);
      return paquete;
    }

    const { columnas } = configuracionTablas[tabla];
    const consulta = this.supabase.cliente.from(tabla);
    const escritura =
      payload.id === undefined
        ? consulta.insert(payload)
        : consulta.upsert(payload, { onConflict: 'id' });
    const { data, error } = await escritura.select(columnas).single();

    if (error) {
      if (error.code === '23503') {
        this.logger.warn(error.message);
        throw new BadRequestException('Uno o más IDs relacionados no existen');
      }

      this.logger.error(error.message);
      throw new InternalServerErrorException(mensajeError);
    }

    return data;
  }

  private validarBody(tabla: Tabla, body: unknown): Record<string, unknown> {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestException('El cuerpo debe ser un objeto JSON');
    }

    const configuracion = configuracionTablas[tabla];
    const payload: Record<string, unknown> = {};

    for (const [campo, valor] of Object.entries(body)) {
      if (!configuracion.campos.includes(campo)) {
        throw new BadRequestException(`Campo no permitido: ${campo}`);
      }

      if (valor === null) {
        if (!configuracion.camposNulos.includes(campo)) {
          throw new BadRequestException(`El campo ${campo} no puede ser null`);
        }
      } else if (configuracion.camposEnteros.includes(campo)) {
        if (
          typeof valor !== 'number' ||
          !Number.isInteger(valor) ||
          valor < 1
        ) {
          throw new BadRequestException(
            `El campo ${campo} debe ser un entero positivo`,
          );
        }
      } else if (configuracion.camposNumericos.includes(campo)) {
        if (typeof valor !== 'number' || !Number.isFinite(valor)) {
          throw new BadRequestException(`El campo ${campo} debe ser numérico`);
        }
      } else if (typeof valor !== 'string') {
        throw new BadRequestException(`El campo ${campo} debe ser texto`);
      }

      const valoresPermitidos = configuracion.camposEnum[campo];
      if (
        typeof valor === 'string' &&
        valoresPermitidos &&
        !valoresPermitidos.includes(valor)
      ) {
        throw new BadRequestException(
          `El campo ${campo} debe ser uno de: ${valoresPermitidos.join(', ')}`,
        );
      }

      payload[campo] = valor;
    }

    if (!Object.keys(payload).some((campo) => campo !== 'id')) {
      throw new BadRequestException(
        'Debe proporcionar al menos un campo además del ID',
      );
    }

    const faltantes = configuracion.camposRequeridos.filter(
      (campo) => !(campo in payload),
    );
    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Faltan campos requeridos: ${faltantes.join(', ')}`,
      );
    }

    return payload;
  }

  private usaModoLocal(): boolean {
    const habilitado = process.env.SUPABASE_LOCAL_MOCK === 'true';
    if (habilitado && process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException(
        'SUPABASE_LOCAL_MOCK no puede habilitarse en producción',
      );
    }

    return habilitado;
  }
}
