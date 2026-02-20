import { ResponseService, ErrorCodes } from './response.service';

describe('ResponseService', () => {
  let service: ResponseService;

  beforeEach(() => {
    service = new ResponseService();
  });

  it('builds a success response with meta', () => {
    const result = service.success({ ok: true }, 'done', 'req-1');

    expect(result.status).toBe('success');
    expect(result.data).toEqual({ ok: true });
    expect(result.message).toBe('done');
    expect(result.meta?.timestamp).toEqual(expect.any(String));
    expect(result.meta?.requestId).toBe('req-1');
  });

  it('ok() is an alias of success()', () => {
    const result = service.ok({ ok: true });

    expect(result.status).toBe('success');
    expect(result.data).toEqual({ ok: true });
  });

  it('builds a validation error response', () => {
    const details = [{ field: 'name', message: 'required' }];
    const result = service.validationError(details);

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe(ErrorCodes.Validation);
    expect(result.error?.message).toBe('Validation failed');
    expect(result.error?.details).toEqual(details);
  });

  it('builds an error response with custom code', () => {
    const result = service.error('Bad request', ErrorCodes.BadRequest);

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe(ErrorCodes.BadRequest);
    expect(result.error?.message).toBe('Bad request');
  });
});
