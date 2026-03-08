import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class UserAgentMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'];

    Logger.log(`User Agent: ${userAgent}`, UserAgentMiddleware.name);
    next();
  }
}
