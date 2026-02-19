import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';

/**
 * Tipo genérico para objetos de cualquier tipo
 * @typedef {Record<string, unknown>} AnyObj
 */
type AnyObj = Record<string, unknown>;

/**
 * Verifica si un valor es un objeto plano (no array ni null)
 * @param {unknown} v - Valor a verificar
 * @returns {boolean} True si es un objeto plano
 * @example
 * isObj({}) // true
 * isObj([]) // false
 * isObj(null) // false
 */
function isObj(v: unknown): v is AnyObj {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Intenta parsear una cadena JSON de forma segura
 * @param {string} raw - Cadena JSON a parsear
 * @returns {unknown} Objeto parseado o undefined si hay error
 * @example
 * safeJsonParse('{"id": 1}') // { id: 1 }
 * safeJsonParse('invalid') // undefined
 */
function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * Verifica si un valor es un ID válido de MongoDB (24 caracteres hexadecimales)
 * @param {unknown} v - Valor a verificar
 * @returns {boolean} True si es un MongoId válido
 * @example
 * isMongoId('507f1f77bcf86cd799439011') // true
 * isMongoId('invalid') // false
 */
function isMongoId(v: unknown): v is string {
  return typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
}

/**
 * Verifica si un valor es un array de strings
 * @param {unknown} v - Valor a verificar
 * @returns {boolean} True si es un array de strings válido
 * @example
 * isStringArray(['read', 'write']) // true
 * isStringArray(['read', 1]) // false
 */
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}


/**
 * Objeto de usuario extraído del contexto RMQ
 * Contiene información de autenticación y autorización del usuario actual
 *
 * @typedef {Object} UserFromRmq
 * @property {string} id - ID único del usuario (MongoDB ObjectId)
 * @property {string} [name] - Nombre del usuario
 * @property {string} [lastName] - Apellido del usuario
 * @property {string} [email] - Correo electrónico del usuario
 * @property {string} [role] - Rol del usuario (ej: admin, user, moderator)
 * @property {string[]} [permissions] - Lista de permisos del usuario
 * @property {string} [organization] - ID de la organización asociada
 * @property {string} [church] - ID de la iglesia asociada
 * @property {Object} [organization_info] - Información completa de la organización
 * @property {string} organization_info.id - ID de la organización
 * @property {string} [organization_info.name] - Nombre de la organización
 * @property {string} [organization_info.timezone] - Zona horaria de la organización
 * @property {string} [organization_info.defaultLanguage] - Idioma por defecto
 * @property {string} [organization_info.domain] - Dominio de la organización
 * @property {Object} [church_info] - Información completa de la iglesia
 * @property {string} church_info.id - ID de la iglesia
 * @property {string} [church_info.name] - Nombre de la iglesia
 * @property {string} [church_info.timezone] - Zona horaria de la iglesia
 * @property {string} [church_info.defaultLanguage] - Idioma por defecto
 * @property {string} [church_info.domain] - Dominio de la iglesia
 * @property {string} [createdAt] - Fecha de creación del usuario
 * @property {string} [updatedAt] - Fecha de última actualización
 */
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

/**
 * Valida y sanitiza un objeto de usuario desde el contexto RMQ
 *
 * Realiza las siguientes validaciones:
 * - El usuario debe ser un objeto plano
 * - El ID debe ser un MongoId válido (24 caracteres hex)
 * - Email, si se proporciona, debe ser una cadena
 * - Permisos, si se proporciona, debe ser un array de strings
 * - Organization ID, si se proporciona, debe ser un MongoId válido
 * - Church ID, si se proporciona, debe ser un MongoId válido
 * - organization_info debe tener un ID válido si se proporciona
 * - church_info debe tener un ID válido si se proporciona
 *
 * @param {unknown} user - Objeto de usuario a validar
 * @returns {UserFromRmq} Usuario validado y tipado
 * @throws {RpcException} Si cualquier validación falla
 *
 * @example
 * const user = validateUser({
 *   id: '507f1f77bcf86cd799439011',
 *   email: 'user@example.com',
 *   permissions: ['read', 'write']
 * });
 */
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

/**
 * Decorador para inyectar información del usuario en manejadores RPC
 *
 * Extrae y valida los datos del usuario desde el mensaje RMQ.
 * El mensaje debe contener un payload JSON con un objeto `user` válido.
 *
 * @param {keyof UserFromRmq | undefined} [field] - Campo específico a extraer del usuario
 *                                                   Si no se proporciona, devuelve el usuario completo
 * @param {ExecutionContext} ctx - Contexto de ejecución de NestJS
 *
 * @returns {UserFromRmq | unknown} Objeto de usuario completo o valor del campo especificado
 *
 * @throws {RpcException} Si el mensaje está vacío, JSON inválido o usuario inválido
 *
 * @example
 * // Obtener usuario completo
 * @MessagePattern('users.get')
 * getUser(@UserPayload() user: UserFromRmq) {
 *   return user;
 * }
 *
 * @example
 * // Obtener un campo específico del usuario
 * @MessagePattern('users.email')
 * getUserEmail(@UserPayload('email') email: string) {
 *   return email;
 * }
 *
 * @example
 * // Con validación Zod (usa @ZodUserPayload en su lugar)
 * @MessagePattern('users.validated')
 * getValidatedUser(@ZodUserPayload() user: UserFromRmq) {
 *   return user;
 * }
 */
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