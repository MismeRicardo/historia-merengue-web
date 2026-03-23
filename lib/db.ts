import { neon } from '@neondatabase/serverless';

// La variable POSTGRES_URL la provee Vercel automáticamente al linkear la DB.
// Para desarrollo local: ejecutá `vercel env pull .env.local`
const sql = neon(process.env.POSTGRES_URL!);

export default sql;

export async function crearTablas() {
    await sql`
        CREATE TABLE IF NOT EXISTS plantel_temporadas (
            anio       INTEGER PRIMARY KEY,
            dt         TEXT    NOT NULL DEFAULT '',
            goleador   TEXT    NOT NULL DEFAULT '',
            campeon    BOOLEAN NOT NULL DEFAULT FALSE
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS plantel_jugadores (
            id          INTEGER NOT NULL,
            anio        INTEGER NOT NULL REFERENCES plantel_temporadas(anio) ON DELETE CASCADE,
            nombre      TEXT    NOT NULL,
            posicion    TEXT    NOT NULL,
            numero      TEXT    NOT NULL DEFAULT '',
            nacionalidad TEXT   NOT NULL,
            PRIMARY KEY (id, anio)
        )
    `;
    await sql`
        ALTER TABLE plantel_jugadores
        ALTER COLUMN numero TYPE TEXT USING numero::text
    `;
    await sql`
        ALTER TABLE plantel_jugadores
        ALTER COLUMN numero SET DEFAULT ''
    `;
    await sql`
        UPDATE plantel_jugadores
        SET numero = ''
        WHERE numero IS NULL
    `;
    await sql`
        ALTER TABLE plantel_jugadores
        ALTER COLUMN numero SET NOT NULL
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS camisetas_temporadas (
            anio INTEGER PRIMARY KEY
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS camisetas_items (
            id          INTEGER NOT NULL,
            anio        INTEGER NOT NULL REFERENCES camisetas_temporadas(anio) ON DELETE CASCADE,
            proveedor   TEXT    NOT NULL DEFAULT '',
            colores     JSONB   NOT NULL DEFAULT '[]'::jsonb,
            descripcion TEXT    NOT NULL DEFAULT '',
            tipo        TEXT    NOT NULL DEFAULT 'Titular',
            principal   TEXT,
            imagenes    JSONB   NOT NULL DEFAULT '[]'::jsonb,
            PRIMARY KEY (id, anio)
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS partidos_temporadas (
            anio INTEGER PRIMARY KEY
        )
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS partidos_items (
            id                    INTEGER NOT NULL,
            anio                  INTEGER NOT NULL REFERENCES partidos_temporadas(anio) ON DELETE CASCADE,
            equipo_local          TEXT    NOT NULL DEFAULT '',
            equipo_visitante      TEXT    NOT NULL DEFAULT '',
            goles_local           INTEGER NOT NULL DEFAULT 0,
            goles_visitante       INTEGER NOT NULL DEFAULT 0,
            fecha                 TEXT    NOT NULL DEFAULT '',
            competicion           TEXT    NOT NULL DEFAULT '',
            goleadores_local      JSONB   NOT NULL DEFAULT '[]'::jsonb,
            goleadores_visitante  JSONB   NOT NULL DEFAULT '[]'::jsonb,
            PRIMARY KEY (id, anio)
        )
    `;
    await sql`
        ALTER TABLE partidos_items
        ADD COLUMN IF NOT EXISTS proximo_partido BOOLEAN NOT NULL DEFAULT FALSE
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS entrenadores (
            id            INTEGER PRIMARY KEY,
            nombre        TEXT    NOT NULL,
            nacionalidad  TEXT    NOT NULL DEFAULT '',
            periodos      JSONB   NOT NULL DEFAULT '[]'::jsonb,
            titulos       JSONB   NOT NULL DEFAULT '[]'::jsonb,
            partidos      INTEGER NOT NULL DEFAULT 0,
            descripcion   TEXT    NOT NULL DEFAULT '',
            activo        BOOLEAN NOT NULL DEFAULT FALSE
        )
    `;

    // Migration: move from legacy JSON titles to numeric title count.
    await sql`
        ALTER TABLE entrenadores
        ADD COLUMN IF NOT EXISTS titulos_cantidad INTEGER NOT NULL DEFAULT 0
    `;
    await sql`
        UPDATE entrenadores
        SET titulos_cantidad = CASE
            WHEN jsonb_typeof(titulos) = 'array' THEN jsonb_array_length(titulos)
            WHEN jsonb_typeof(titulos) = 'number' THEN (titulos::text)::integer
            ELSE 0
        END
        WHERE titulos_cantidad = 0
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS historia_eventos (
            id          INTEGER PRIMARY KEY,
            anio        INTEGER NOT NULL,
            titulo      TEXT    NOT NULL,
            descripcion TEXT    NOT NULL DEFAULT '',
            icono       TEXT    NOT NULL DEFAULT 'star'
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS goleadores (
            id               INTEGER PRIMARY KEY,
            nombre           TEXT    NOT NULL,
            nombre_completo  TEXT    NOT NULL DEFAULT '',
            goles            INTEGER NOT NULL DEFAULT 0,
            temporadas       TEXT    NOT NULL DEFAULT '',
            partidos         INTEGER NOT NULL DEFAULT 0,
            nacionalidad     TEXT    NOT NULL DEFAULT '',
            apodo            TEXT,
            activo           BOOLEAN NOT NULL DEFAULT FALSE
        )
    `;
}
