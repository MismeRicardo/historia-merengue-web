import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sql, { crearTablas } from '@/lib/db';

interface Jugador {
    id: number;
    nombre: string;
    posicion: string;
    numero: number;
    nacionalidad: string;
}

interface Temporada {
    anio: number;
    dt: string;
    jugadores: Jugador[];
    goleador: string;
    campeon: boolean;
}

// POST /api/plantel/init
// Crea las tablas y siembra los datos desde data/plantel.json (idempotente).
// Está protegido por el middleware JWT — solo admins autenticados pueden llamarlo.
export async function POST() {
    try {
        await crearTablas();

        // Seed desde el JSON local (solo inserta si no existe — ON CONFLICT DO NOTHING)
        const raw = await readFile(
            path.join(process.cwd(), 'data', 'plantel.json'),
            'utf-8'
        );
        const data: Temporada[] = JSON.parse(raw);

        let temporadasInsertadas = 0;
        let jugadoresInsertados = 0;

        for (const temp of data) {
            const result = await sql`
                INSERT INTO plantel_temporadas (anio, dt, goleador, campeon)
                VALUES (${temp.anio}, ${temp.dt}, ${temp.goleador ?? ''}, ${temp.campeon ?? false})
                ON CONFLICT (anio) DO NOTHING
            `;
            if (result.length !== undefined || (result as unknown as { rowCount: number }).rowCount > 0) {
                temporadasInsertadas++;
            }

            for (const j of temp.jugadores) {
                await sql`
                    INSERT INTO plantel_jugadores (id, anio, nombre, posicion, numero, nacionalidad)
                    VALUES (${j.id}, ${temp.anio}, ${j.nombre}, ${j.posicion}, ${j.numero}, ${j.nacionalidad})
                    ON CONFLICT (id, anio) DO NOTHING
                `;
                jugadoresInsertados++;
            }
        }

        return NextResponse.json({
            ok: true,
            mensaje: 'Tablas creadas y datos sembrados correctamente',
            temporadasInsertadas,
            jugadoresInsertados,
        });
    } catch (err) {
        console.error('[init]', err);
        return NextResponse.json(
            { error: 'Error al inicializar la base de datos', detalle: String(err) },
            { status: 500 }
        );
    }
}
