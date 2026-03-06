import { NextResponse } from 'next/server';
import sql from '@/lib/db';

interface Jugador {
    id: number;
    nombre: string;
    posicion: string;
    numero: number;
    nacionalidad: string;
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ anio: string }> }
) {
    try {
        const { anio: anioStr } = await params;
        const anio = parseInt(anioStr, 10);
        const body = await req.json();

        const existing = await sql`SELECT anio, dt, goleador, campeon FROM plantel_temporadas WHERE anio = ${anio}`;
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
        }

        const current = existing[0];

        // Actualizar campos de la temporada si se enviaron
        if ('dt' in body || 'goleador' in body || 'campeon' in body) {
            const dt = 'dt' in body ? String(body.dt) : current.dt;
            const goleador = 'goleador' in body ? String(body.goleador) : current.goleador;
            const campeon = 'campeon' in body ? Boolean(body.campeon) : current.campeon;
            await sql`
                UPDATE plantel_temporadas
                SET dt = ${dt}, goleador = ${goleador}, campeon = ${campeon}
                WHERE anio = ${anio}
            `;
        }

        // Reemplazar lista de jugadores si se envió
        if ('jugadores' in body && Array.isArray(body.jugadores)) {
            await sql`DELETE FROM plantel_jugadores WHERE anio = ${anio}`;
            for (const j of body.jugadores as Jugador[]) {
                await sql`
                    INSERT INTO plantel_jugadores (id, anio, nombre, posicion, numero, nacionalidad)
                    VALUES (${j.id}, ${anio}, ${j.nombre}, ${j.posicion}, ${j.numero}, ${j.nacionalidad})
                `;
            }
        }

        // Devolver temporada actualizada
        const [temp] = await sql`SELECT anio, dt, goleador, campeon FROM plantel_temporadas WHERE anio = ${anio}`;
        const jugadores = await sql`
            SELECT id, nombre, posicion, numero, nacionalidad
            FROM plantel_jugadores WHERE anio = ${anio} ORDER BY numero
        `;

        return NextResponse.json({ ...temp, jugadores });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar los datos' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ anio: string }> }
) {
    try {
        const { anio: anioStr } = await params;
        const anio = parseInt(anioStr, 10);

        const existing = await sql`SELECT anio FROM plantel_temporadas WHERE anio = ${anio}`;
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
        }

        // Los jugadores se borran en cascada
        await sql`DELETE FROM plantel_temporadas WHERE anio = ${anio}`;

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar los datos' }, { status: 500 });
    }
}
