import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

export async function GET() {
    try {
        await crearTablas();
        const temporadas = await sql`
            SELECT anio, dt, goleador, campeon
            FROM plantel_temporadas
            ORDER BY anio DESC
        `;
        const jugadores = await sql`
            SELECT id, anio, nombre, posicion, numero, nacionalidad
            FROM plantel_jugadores
            ORDER BY
                anio,
                CASE WHEN numero ~ '^[0-9]+$' THEN numero::integer END NULLS LAST,
                numero
        `;

        const data = temporadas.map((t) => ({
            anio: t.anio,
            dt: t.dt,
            goleador: t.goleador,
            campeon: t.campeon,
            jugadores: jugadores
                .filter((j) => j.anio === t.anio)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .map(({ anio: _anio, ...rest }) => rest),
        }));

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer los datos' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();
        const body = await req.json();
        if (!body.anio || !body.dt) {
            return NextResponse.json({ error: 'Año y DT son obligatorios' }, { status: 400 });
        }

        const anio = Number(body.anio);
        const dt = String(body.dt);
        const goleador = String(body.goleador ?? '');
        const campeon = Boolean(body.campeon);

        const existing = await sql`SELECT anio FROM plantel_temporadas WHERE anio = ${anio}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Ya existe una temporada con ese año' }, { status: 400 });
        }

        await sql`
            INSERT INTO plantel_temporadas (anio, dt, goleador, campeon)
            VALUES (${anio}, ${dt}, ${goleador}, ${campeon})
        `;

        return NextResponse.json({ anio, dt, goleador, campeon, jugadores: [] }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al guardar los datos' }, { status: 500 });
    }
}
