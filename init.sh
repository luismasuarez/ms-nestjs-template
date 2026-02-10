#!/bin/bash

# Script de inicialización del proyecto

echo "Iniciando configuración del proyecto..."

# Copiar .env.local a .env si no existe
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env creado desde .env.example"
else
  echo ".env ya existe"
fi

# Generar cliente de Prisma
echo "Generando cliente de Prisma..."
npm run prisma:generate

# Ejecutar migraciones
echo "Ejecutando migraciones..."
npx prisma migrate dev --name init

# Ejecutar seeds
echo "Ejecutando seeds..."
npm run prisma:seed

echo "proyecto listo"