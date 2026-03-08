import { Logger } from '@nestjs/common';
import { IpMiddleware } from './ip.middleware';

describe('IpMiddleware', () => {
  const middleware = new IpMiddleware();
  const logSpy = jest.spyOn(Logger, 'log').mockImplementation(jest.fn());

  afterEach(() => {
    logSpy.mockClear();
  });

  it('should prefer x-forwarded-for when available', () => {
    const next = jest.fn();

    middleware.use(
      {
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8'
        },
        socket: {
          remoteAddress: '9.9.9.9'
        }
      } as never,
      {} as never,
      next
    );

    expect(logSpy).toHaveBeenCalledWith('IP: 1.2.3.4', IpMiddleware.name);
    expect(next).toHaveBeenCalled();
  });

  it('should fallback to socket remoteAddress when forwarded header is absent', () => {
    const next = jest.fn();

    middleware.use(
      {
        headers: {},
        socket: {
          remoteAddress: '9.9.9.9'
        }
      } as never,
      {} as never,
      next
    );

    expect(logSpy).toHaveBeenCalledWith('IP: 9.9.9.9', IpMiddleware.name);
    expect(next).toHaveBeenCalled();
  });
});
