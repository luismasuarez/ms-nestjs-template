import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';

type AnyObj = Record<string, unknown>;

function isObj(v: unknown): v is AnyObj {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Mongo ObjectId típico (24 hex)
function isMongoId(v: unknown): v is string {
  return typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

export type UserFromRmq = {
  id: string;
  name?: string;
  lastName?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  organization?: string;
  church?: string;
  organization_info?: { id: string; name?: string; timezone?: string; defaultLanguage?: string; domain?: string };
  church_info?: { id: string; name?: string; timezone?: string; defaultLanguage?: string; domain?: string };
  createdAt?: string;
  updatedAt?: string;
};

function validateUser(user: unknown): UserFromRmq {
  if (!isObj(user)) {
    throw new RpcException({ code: 'MISSING_USER', message: 'payload.user is required and must be an object.' });
  }

  const id = user.id;
  if (!isMongoId(id)) {
    throw new RpcException({ code: 'INVALID_USER_ID', message: 'user.id must be a valid Mongo ObjectId (24 hex chars).' });
  }

  if (user.email !== undefined && typeof user.email !== 'string') {
    throw new RpcException({ code: 'INVALID_USER_EMAIL', message: 'user.email must be a string if provided.' });
  }

  if (user.permissions !== undefined && !isStringArray(user.permissions)) {
    throw new RpcException({ code: 'INVALID_PERMISSIONS', message: 'user.permissions must be an array of strings if provided.' });
  }

  // Validaciones “útiles” para tu contexto (org/church suelen ser claves)
  if (user.organization !== undefined && !isMongoId(user.organization)) {
    throw new RpcException({ code: 'INVALID_ORGANIZATION_ID', message: 'user.organization must be a MongoId if provided.' });
  }
  if (user.church !== undefined && !isMongoId(user.church)) {
    throw new RpcException({ code: 'INVALID_CHURCH_ID', message: 'user.church must be a MongoId if provided.' });
  }

  // Checks suaves para info anidada (si viene, que sea consistente)
  if (user.organization_info !== undefined) {
    if (!isObj(user.organization_info) || !isMongoId(user.organization_info.id)) {
      throw new RpcException({
        code: 'INVALID_ORGANIZATION_INFO',
        message: 'user.organization_info must be an object with a valid id.',
      });
    }
  }

  if (user.church_info !== undefined) {
    if (!isObj(user.church_info) || !isMongoId(user.church_info.id)) {
      throw new RpcException({
        code: 'INVALID_CHURCH_INFO',
        message: 'user.church_info must be an object with a valid id.',
      });
    }
  }

  return user as UserFromRmq;
}

export const UserPayload = createParamDecorator(
  (field: keyof UserFromRmq | undefined, ctx: ExecutionContext) => {
    const cctx = ctx.switchToRpc().getContext<RmqContext>();
    const msg = cctx.getMessage();

    const raw = msg?.content?.toString?.('utf8') ?? '';
    if (!raw) {
      throw new RpcException({ code: 'EMPTY_MESSAGE', message: 'RMQ message content is empty.' });
    }

    const parsed = safeJsonParse(raw);
    if (!isObj(parsed)) {
      throw new RpcException({ code: 'INVALID_JSON', message: 'RMQ message content must be valid JSON object.' });
    }

    // Si quieres también validar pattern/data, aquí es el sitio:
    // if (typeof parsed.pattern !== 'string') ...

    const user = validateUser(parsed.user);
    return field ? user[field] : user;
  },
);