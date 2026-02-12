import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { z } from 'zod';

const MongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoId');

const OrgInfoSchema = z.object({
  id: MongoId,
  name: z.string().optional(),
  domain: z.string().optional(),
  timezone: z.string().optional(),
  defaultLanguage: z.string().optional(),
});

const UserSchema = z.object({
  id: MongoId,
  name: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  organization: MongoId.optional(),
  church: MongoId.optional(),
  organization_info: OrgInfoSchema.optional(),
  church_info: OrgInfoSchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

const PayloadSchema = z.object({
  pattern: z.string().optional(),
  data: z.unknown().optional(),
  user: UserSchema,
});

export const UserPayload = createParamDecorator(
  (field: keyof z.infer<typeof UserSchema> | undefined, ctx: ExecutionContext) => {
    const cctx = ctx.switchToRpc().getContext<RmqContext>();
    const msg = cctx.getMessage();
    const raw = msg?.content?.toString?.('utf8') ?? '';

    let parsed: unknown;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      throw new RpcException({ code: 'INVALID_JSON', message: 'RMQ message content is not valid JSON.' });
    }

    const result = PayloadSchema.safeParse(parsed);
    if (!result.success) {
      throw new RpcException({
        code: 'INVALID_PAYLOAD',
        message: 'RMQ payload validation failed.',
        issues: result.error.issues, // ideal para logs
      });
    }

    const user = result.data.user;
    return field ? user[field] : user;
  },
);