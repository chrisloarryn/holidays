import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class IpMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();
    const ip = forwardedIp || req.socket.remoteAddress || null;

    Logger.log(`IP: ${ip}`, IpMiddleware.name);
    next();
  }
}
