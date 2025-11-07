// src/lib/api/middleware.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
Middleware para verificar autenticación de cron jobs */
export function withCronAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Verificar token de autorización
    const authHeader = req.headers.authorization;
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedToken) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
        message: 'Token de autorización inválido o faltante',
      });
    }

    // Verificar que sea POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Método no permitido',
        message: 'Solo se permite POST para cron jobs',
      });
    }

    // Ejecutar handler
    return handler(req, res);
  };
}

/**
Middleware para rate limiting (básico) */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  maxRequests = 100,
  windowMs = 60000
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Obtener IP del cliente
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
               req.socket.remoteAddress ||
               'unknown';

    const now = Date.now();
    const record = requests.get(ip);

    // Limpiar registros antiguos
    if (record && now > record.resetTime) {
      requests.delete(ip);
    }

    // Verificar límite
    if (record && record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes',
        message: 'Has excedido el límite de solicitudes. Intenta más tarde.',
      });
    }

    // Actualizar contador
    if (record) {
      record.count++;
    } else {
      requests.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
    }

    // Ejecutar handler
    return handler(req, res);
  };
}

/**
Middleware para logging */
export function withLogging(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    const method = req.method;
    const url = req.url;

    console.log(`[${new Date().toISOString()}] ${method} ${url} - START`);

    try {
      await handler(req, res);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ${method} ${url} - ERROR:`, error);
      throw error;
    } finally {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${method} ${url} - END (${duration}ms)`);
    }
  };
}

/**
Combinar múltiples middlewares */
export function compose(
  ...middlewares: Array<
    (
      handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
    ) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  >
) {
  return (
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}
