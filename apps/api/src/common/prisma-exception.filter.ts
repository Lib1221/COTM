import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import type { RequestWithId } from './request-id.middleware';

// Maps known Prisma error codes to clean HTTP responses so that database
// constraint violations do not leak as opaque 500s.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.requestId;
    const timestamp = new Date().toISOString();

    let error:
      NotFoundException | ConflictException | BadRequestException | null = null;

    switch (exception.code) {
      case 'P2025':
        // Record not found (or relation not found).
        error = new NotFoundException('The requested resource was not found.');
        break;
      case 'P2002':
        // Unique constraint violation.
        error = new ConflictException(
          'A record with this value already exists.',
        );
        break;
      case 'P2003':
        // Foreign key constraint violation (e.g. deleting a referenced row).
        error = new ConflictException(
          'Cannot delete this resource because it is referenced by other records.',
        );
        break;
      default:
        this.logger.error(
          `Unhandled Prisma error ${exception.code}: ${exception.message}`,
          exception.stack,
        );
        break;
    }

    if (error) {
      const status = error.getStatus();
      const body = error.getResponse();
      response
        .status(status)
        .json(
          typeof body === 'string'
            ? { statusCode: status, message: body, requestId, timestamp }
            : { ...body, requestId, timestamp },
        );
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      requestId,
      timestamp,
    });
  }
}
