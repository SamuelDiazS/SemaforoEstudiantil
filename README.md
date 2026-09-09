# Registro de Llegadas

Sistema móvil de registro de llegadas estudiantiles con semáforo (verde / amarillo / rojo), construido con Next.js, PostgreSQL en Neon y pensado para desplegarse directamente en Vercel.

---

## 1. Descripción

Los estudiantes escanean un código QR que los lleva al sitio. Ahí pueden registrarse o iniciar sesión, mantener una sesión persistente en su teléfono, ver un semáforo grande que indica si están a tiempo, en advertencia o tarde para el bloque actual, y registrar su llegada con un botón. El administrador tiene un panel separado para consultar estudiantes por grupo, ver llegadas tardías y estadísticas generales.

La hora y el color del semáforo **siempre se calculan en el servidor** (zona horaria `America/Bogota`), nunca a partir del reloj del teléfono del estudiante, para que nadie pueda falsificar su hora de llegada.

---

## 2. Tecnologías

- Next.js 14 (App Router) + TypeScript + React
- Tailwind CSS (diseño mobile-first)
- PostgreSQL alojado en [Neon](https://neon.tech)
- `@neondatabase/serverless` para la conexión a la base de datos
- `bcryptjs` para el hash de contraseñas
- `jose` para sesiones firmadas (JWT) en cookies HTTP-only
- Despliegue en [Vercel](https://vercel.com)

No se usa Firebase, Supabase, Google Sheets ni ninguna otra base de datos distinta de PostgreSQL/Neon.

---

## 3. Instalación

```bash
npm install
```

---

## 4. Variables de entorno

Copia `.env.example` a `.env` y complétalo:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión completa de Neon (incluye usuario, contraseña, host y `sslmode=require`). |
| `DATABASE_PASSWORD` | Solo como referencia/documentación de la contraseña que usaste dentro de `DATABASE_URL`. La aplicación no la lee directamente. |
| `SESSION_SECRET` | Secreto largo y aleatorio usado para firmar las cookies de sesión (estudiantes y admin). Genera uno con `openssl rand -base64 48`. |
| `ADMIN_USERNAME` | Usuario del panel administrativo. |
| `ADMIN_PASSWORD` | Contraseña del panel administrativo. |

`.env` está en `.gitignore` y nunca debe subirse al repositorio. Ninguna variable sensible usa el prefijo `NEXT_PUBLIC_`, así que nada de esto llega al navegador.

### Contraseña de la base de datos

Coloca aquí la contraseña asignada por Neon (solo para tu referencia personal, no la escribas en el código ni la subas a git):

```
DATABASE_PASSWORD=________________________________
```

Neon normalmente te entrega directamente la `DATABASE_URL` completa, con la contraseña ya incluida, por ejemplo:

```env
DATABASE_URL=postgresql://usuario:TU_CONTRASEÑA@host.neon.tech/neondb?sslmode=require
```

---

## 5. Configuración de Neon

1. Crea una cuenta en [neon.tech](https://neon.tech).
2. Crea un proyecto de PostgreSQL.
3. Entra al dashboard del proyecto.
4. Copia el valor de `DATABASE_URL` (Connection string).
5. Ve a **SQL Editor** dentro de Neon.
6. Abre el archivo `database/schema.sql` de este proyecto.
7. Copia todo su contenido.
8. Pégalo en el SQL Editor de Neon.
9. Ejecútalo.
10. Verifica que se crearon las tablas `students` y `attendance_records` (puedes revisarlo en la pestaña **Tables**).

---

## 6. Código para crear la base de datos en Neon

Puedes copiar y pegar directamente este bloque completo en el SQL Editor de Neon (es exactamente el mismo contenido de `database/schema.sql`):

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ESTUDIANTES
-- ==========================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(150) NOT NULL,

    username VARCHAR(80) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    group_name VARCHAR(10) NOT NULL CHECK (
        group_name IN (
            '11-1',
            '11-2',
            '11-3',
            '11-4',
            '11-5',
            '11-6'
        )
    ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- REGISTROS DE LLEGADA
-- ==========================================

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL
        REFERENCES students(id)
        ON DELETE CASCADE,

    attendance_date DATE NOT NULL,

    block_time TIME NOT NULL,

    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    status VARCHAR(10) NOT NULL CHECK (
        status IN (
            'GREEN',
            'YELLOW',
            'RED'
        )
    ),

    minutes_after_start INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_student_block_per_day
        UNIQUE(student_id, attendance_date, block_time)
);

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_students_group_name
ON students(group_name);

CREATE INDEX IF NOT EXISTS idx_students_username
ON students(username);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id
ON attendance_records(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date
ON attendance_records(attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_status
ON attendance_records(status);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date
ON attendance_records(student_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_date_status
ON attendance_records(attendance_date, status);
```

Después de ejecutar esto: abrir Neon → SQL Editor → copiar → pegar → ejecutar → listo, la base de datos queda funcionando.

---

## 7. Configuración local

1. `npm install`
2. Crea `.env` a partir de `.env.example` y completa `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
3. Ejecuta el SQL de la sección anterior en tu proyecto de Neon.

---

## 8. Ejecución

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) desde tu teléfono o desde el navegador (usa las herramientas de desarrollador para simular un móvil: 320px, 375px, 390px, 430px).

Para producción local:

```bash
npm run build
npm run start
```

---

## 9. Deploy en Vercel

1. Sube este proyecto a un repositorio de Git (GitHub, GitLab, etc.).
2. Entra a [vercel.com](https://vercel.com) e importa el repositorio.
3. Configura las variables de entorno (ver sección siguiente) **antes** del primer deploy, o hazlo y luego vuelve a desplegar.
4. Vercel detecta automáticamente que es un proyecto Next.js y usa `npm run build` / `npm run start`.

---

## 10. Configuración de variables de entorno en Vercel

**Paso 1.** Entra a Vercel y selecciona el proyecto.

**Paso 2.** Ve a `Settings → Environment Variables`.

**Paso 3.** Crea `DATABASE_URL` y pega la cadena que te dio Neon, por ejemplo:
```
postgresql://usuario:contraseña@host.neon.tech/neondb?sslmode=require
```

**Paso 4.** Crea `DATABASE_PASSWORD` y deja explícitamente:
```
[COLOCA AQUÍ LA CONTRASEÑA DE TU BASE DE DATOS NEON]
```
Esta variable es solo de referencia; la aplicación usa principalmente `DATABASE_URL`.

**Paso 5.** Crea `SESSION_SECRET` con un valor largo y aleatorio (no uses el ejemplo del `.env.example` literalmente en producción).

**Paso 6.** Crea `ADMIN_USERNAME` con valor inicial `admin`.

**Paso 7.** Crea `ADMIN_PASSWORD` con valor inicial `AdminLlegadas2026!`.

**Paso 8.** Selecciona los ambientes: `Production`, `Preview` y `Development`.

**Paso 9.** Guarda las variables.

**Paso 10.** Haz un nuevo deployment (o un redeploy del último).

---

## 11. Credenciales administrativas iniciales

```
Usuario: admin
Contraseña: AdminLlegadas2026!
```

Estas credenciales viven exclusivamente en las variables de entorno `ADMIN_USERNAME` / `ADMIN_PASSWORD`, nunca en la tabla `students` ni hardcodeadas en el código del navegador. No existe una ruta `/admin/register`: el administrador nunca se registra, solo inicia sesión.

**Se recomienda encarecidamente cambiar esta contraseña antes de usar el sistema en producción**, simplemente actualizando la variable `ADMIN_PASSWORD` en Vercel (o en tu `.env` local) y volviendo a desplegar.

---

## 12. Seguridad

- Contraseñas de estudiantes hasheadas con `bcryptjs` (nunca se guarda una contraseña en texto plano).
- Sesiones mediante JWT firmado (`jose`, HS256) en cookies **HTTP-only**, `secure` en producción y `SameSite=Lax`. Nunca en `localStorage`/`sessionStorage`.
- Sesión de estudiante (`session`) y sesión de administrador (`admin_session`) son cookies completamente separadas — un estudiante no puede "convertirse" en admin modificando su cookie.
- Todas las consultas SQL son parametrizadas (tagged templates de `@neondatabase/serverless`), lo que previene inyección SQL.
- Validación tanto en frontend como en backend (el backend nunca confía en lo que validó el navegador).
- El servidor **siempre** recalcula la hora, el bloque y el color del semáforo al registrar una llegada; el cliente solo puede pedir "registrar llegada", nunca enviar un `status` o una hora manipulados.
- `student_id` nunca se toma del cuerpo de la petición: siempre se obtiene de la sesión verificada en el servidor.
- Un estudiante solo puede consultar su propio historial; no existen APIs públicas que listen todos los estudiantes.
- `password_hash`, `DATABASE_URL`, `SESSION_SECRET` y `ADMIN_PASSWORD` nunca se exponen en ninguna respuesta de la API ni en el frontend.
- Ninguna variable sensible usa el prefijo `NEXT_PUBLIC_`.
- Duplicados de asistencia bloqueados a nivel de base de datos con `UNIQUE(student_id, attendance_date, block_time)`, además de deshabilitar el botón en el frontend; el error de PostgreSQL se captura y se responde `409 Conflict`.

---

## 13. Estructura de la base de datos

**Tabla `students`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID | Llave primaria, generada automáticamente |
| `full_name` | VARCHAR(150) | Nombre completo |
| `username` | VARCHAR(80) | Único, se normaliza a minúsculas |
| `password_hash` | TEXT | Hash bcrypt, nunca la contraseña real |
| `group_name` | VARCHAR(10) | Debe ser uno de `11-1` a `11-6` |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**Tabla `attendance_records`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID | Llave primaria |
| `student_id` | UUID | Referencia a `students(id)`, `ON DELETE CASCADE` |
| `attendance_date` | DATE | Fecha del registro (hora de Bogotá) |
| `block_time` | TIME | Hora de inicio del bloque correspondiente |
| `registered_at` | TIMESTAMPTZ | Momento exacto del registro |
| `status` | VARCHAR(10) | `GREEN`, `YELLOW` o `RED` |
| `minutes_after_start` | INTEGER | Minutos transcurridos desde el inicio del bloque |
| `created_at` | TIMESTAMPTZ | |

Restricción `unique_student_block_per_day`: un estudiante no puede tener dos registros para el mismo bloque el mismo día.

---

## Arquitectura y rutas disponibles

```
Frontend (páginas / componentes "use client")
        ↓
Route Handlers (src/app/api/**)  — únicos que leen DATABASE_URL
        ↓
PostgreSQL (Neon)
```

**Páginas**

| Ruta | Descripción |
|---|---|
| `/` | Redirige a `/dashboard` si hay sesión, si no muestra "Iniciar sesión" / "Registrarse" |
| `/login` | Login de estudiantes |
| `/register` | Registro de estudiantes |
| `/dashboard` | Semáforo, botón de registro e historial (protegida) |
| `/admin/login` | Login de administrador |
| `/admin` | Estadísticas y accesos a grupos (protegida) |
| `/admin/groups/[group]` | Estudiantes de un grupo con conteo de tardanzas (protegida) |
| `/admin/students/[id]` | Detalle de un estudiante y sus llegadas tardías (protegida) |

**API (Route Handlers)**

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

GET  /api/attendance/status
POST /api/attendance/register
GET  /api/attendance/history

POST /api/admin/login
POST /api/admin/logout
GET  /api/admin/stats
GET  /api/admin/groups/[group]
GET  /api/admin/students/[id]
```

## Lógica del semáforo (resumen)

Toda la lógica vive en `src/lib/attendance-time.ts` (fuente única de verdad):

- Bloques (`BLOCK_START_TIMES`): 06:30, 07:25, 08:20, 09:45, 10:40, 11:35, 13:00, 13:55, 15:10, 16:05, 17:00. Son parámetros internos únicamente — no se muestran como horario académico en ninguna pantalla.
- Cada bloque tiene una ventana que va desde su hora de inicio hasta justo antes del siguiente bloque.
- Dentro de esa ventana: primeros 10 minutos = `GREEN`, minutos 10–12 = `YELLOW`, de ahí en adelante = `RED`.
- Sábados y domingos: `NO_SCHOOL_DAY` (sin registro disponible).
- Antes del primer bloque del día: `NO_ACTIVE_BLOCK`.
- Todo se calcula en `America/Bogota` a partir de la hora real del servidor.

## Nota sobre este entorno de generación

Este proyecto fue escrito completo (sin `TODO`s ni placeholders) por un asistente que no tuvo acceso a red para ejecutar `npm install` / `npm run build` y verificarlo de forma automática. **Antes de darlo por terminado, ejecuta tú mismo:**

```bash
npm install
npm run build
```

y corrige cualquier error de tipos o de dependencias que pueda aparecer (versión de Next.js/React, tipos de `params`/`searchParams` en rutas dinámicas, etc.) antes de desplegar a producción.
