import { neon } from "@neondatabase/serverless";

// ============================================================
// Conexión centralizada a PostgreSQL (Neon).
//
// Esta es la ÚNICA fuente de conexión a la base de datos en todo
// el proyecto. Nunca crear conexiones nuevas en otros archivos.
//
// IMPORTANTE: este módulo solo puede importarse desde código que
// se ejecuta en el servidor (Route Handlers, Server Components,
// Server Actions). Nunca importarlo desde un componente "use client".
// ============================================================

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL no está definida. Configura tu archivo .env (ver .env.example) " +
      "o las variables de entorno del proyecto en Vercel."
  );
}

export const sql = neon(databaseUrl);
