import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service.js';
import { OperacionesController } from './operaciones.controller.js';

describe('OperacionesController', () => {
  let controller: OperacionesController;
  const from = vi.fn();

  beforeEach(async () => {
    from.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperacionesController],
      providers: [
        {
          provide: SupabaseService,
          useValue: { cliente: { from } },
        },
      ],
    }).compile();

    controller = module.get<OperacionesController>(OperacionesController);
  });

  it('rejects package states outside the allowed values before contacting Supabase', async () => {
    await expect(
      controller.guardarPaquete({
        comerciante_id: 1,
        comprador_id: 1,
        codigo_interno: 'PKG-001',
        fecha_recepcion: '2026-11-16T12:00:00Z',
        estado: 'PENDIENTE',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(from).not.toHaveBeenCalled();
  });

  it('returns a bad request when a referenced ID does not exist', async () => {
    const query = {
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '23503',
          message:
            'insert or update on table "paquetes" violates foreign key constraint',
        },
      }),
    };
    from.mockReturnValue(query);

    await expect(
      controller.guardarPaquete({
        comerciante_id: 1,
        comprador_id: 2,
        codigo_interno: 'PKG-001',
        fecha_recepcion: '2026-11-16T12:00:00Z',
        estado: 'RECIBIDO',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(query.insert).toHaveBeenCalledOnce();
    expect(query.upsert).not.toHaveBeenCalled();
  });

  it('inserts a package when no ID is provided', async () => {
    const data = {
      id: 25,
      comerciante_id: 1,
      comprador_id: 2,
      codigo_interno: 'PKG-001',
      fecha_recepcion: '2026-11-16T12:00:00Z',
      estado: 'RECIBIDO',
    };
    const query = {
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error: null }),
    };
    from.mockReturnValue(query);

    await expect(
      controller.guardarPaquete({
        comerciante_id: 1,
        comprador_id: 2,
        codigo_interno: 'PKG-001',
        fecha_recepcion: '2026-11-16T12:00:00Z',
        estado: 'RECIBIDO',
      }),
    ).resolves.toEqual(data);

    expect(query.insert).toHaveBeenCalledOnce();
    expect(query.upsert).not.toHaveBeenCalled();
  });

  it('stores packages locally without contacting Supabase when mock mode is enabled', async () => {
    vi.stubEnv('SUPABASE_LOCAL_MOCK', 'true');

    try {
      const paquete = await controller.guardarPaquete({
        comerciante_id: 999,
        comprador_id: 888,
        codigo_interno: 'PKG-LOCAL-001',
        fecha_recepcion: '2026-11-16T12:00:00Z',
        estado: 'RECIBIDO',
      });

      expect(paquete).toMatchObject({
        id: 1,
        comerciante_id: 999,
        comprador_id: 888,
      });
      expect(from).not.toHaveBeenCalled();
      await expect(controller.listarPaquetes()).resolves.toEqual([paquete]);
      await expect(controller.obtenerPaquete(1)).resolves.toMatchObject({
        codigo_interno: 'PKG-LOCAL-001',
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
