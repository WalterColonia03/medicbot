// src/lib/api/handler.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@/types/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void | NextApiResponse>;

interface RouteHandlers {
  GET?: Handler;
  POST?: Handler;
  PUT?: Handler;
  DELETE?: Handler;
  PATCH?: Handler;
}

/**
Wrapper para handlers de API con manejo de errores centralizado */
export function createApiHandler(handlers: RouteHandlers) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method as HttpMethod;

    // Verificar método permitido
    if (!handlers[method]) {
      return res.status(405).json({
        success: false,
        error: 'Método no permitido',
        message: `El método ${method} no está soportado en este endpoint`,
      } as ApiResponse);
    }

    try {
      // Ejecutar handler correspondiente
      await handlers[method]!(req, res);
    } catch (error) {
      console.error(`Error in ${method} ${req.url}:`, error);

      // Manejo de errores específicos
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: 'Error de validación',
          message: error.message,
          errors: error.errors,
        } as ApiResponse);
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: 'No encontrado',
          message: error.message,
        } as ApiResponse);
      }

      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: error.message,
        } as ApiResponse);
      }

      // Error genérico
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : 'Ocurrió un error inesperado',
      } as ApiResponse);
    }
  };
}

/**
Clases de error personalizadas */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
Helper para respuestas exitosas */
export function successResponse<T>(
  res: NextApiResponse,
  data: T,
  message?: string,
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

/**
Helper para respuestas de error */
export function errorResponse(
  res: NextApiResponse,
  error: string,
  message: string,
  statusCode = 400,
  errors?: string[]
): void {
  res.status(statusCode).json({
    success: false,
    error,
    message,
    errors,
  } as ApiResponse);
}
