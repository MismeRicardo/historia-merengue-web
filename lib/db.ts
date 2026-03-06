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
            numero      INTEGER NOT NULL,
            nacionalidad TEXT   NOT NULL,
            PRIMARY KEY (id, anio)
        )
    `;
}
