import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT?: number;
  RABBITMQ_URL: string;
  DATABASE_URL: string;
}

const envSchema = joi
  .object<EnvVars>({
    PORT: joi.number(),
    RABBITMQ_URL: joi.string().required(),
    DATABASE_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  PORT: envVars.PORT,
  RABBITMQ_URL: envVars.RABBITMQ_URL,
  DATABASE_URL: envVars.DATABASE_URL,
};
