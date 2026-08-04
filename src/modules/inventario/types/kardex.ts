// src/modules/inventario/types/kardex.ts

import { Kardex as PrismaKardex } from '@prisma/client';
import { Producto } from '@/modules/productos/types/producto';

export type Kardex = PrismaKardex & {
  producto?: Producto;
};
