-- ============================================================
-- Registro de Llegadas — Esquema de base de datos (Neon/PostgreSQL)
-- Copia y pega TODO este archivo en el SQL Editor de Neon y ejecútalo.
-- ============================================================

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
