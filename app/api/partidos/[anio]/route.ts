import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

interface PartidoInput {
    id: number;
    equipo_local: string;
    equipo_visitante: string;
    goles_local: number;
    goles_visitante: number;
    fecha: string;
    competicion: string;
    goleadores_local: string[];
    goleadores_visitante: string[];
    proximo_partido?: boolean;
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ anio: string }> }
) {
    try {
        await crearTablas();

        const { anio: anioStr } = await params;
        const anio = Number(anioStr);
        const body = await req.json();

        const existing = await sql`SELECT anio FROM partidos_temporadas WHERE anio = ${anio}`;
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
        }

        if ('partidos' in body && Array.isArray(body.partidos)) {
            const partidos = body.partidos as PartidoInput[];

            await sql`DELETE FROM partidos_items WHERE anio = ${anio}`;

            for (const p of partidos) {
                await sql`
                    INSERT INTO partidos_items (
                        id, anio, equipo_local, equipo_visitante, goles_local, goles_visitante,
                        fecha, competicion, goleadores_local, goleadores_visitante, proximo_partido
                    )
                    VALUES (
                        ${Number(p.id)},
                        ${anio},
                        ${String(p.equipo_local ?? '')},
                        ${String(p.equipo_visitante ?? '')},
                        ${Number(p.goles_local ?? 0)},
                        ${Number(p.goles_visitante ?? 0)},
                        ${String(p.fecha ?? '')},
                        ${String(p.competicion ?? '')},
                        ${JSON.stringify(p.goleadores_local ?? [])}::jsonb,
                        ${JSON.stringify(p.goleadores_visitante ?? [])}::jsonb,
                        ${Boolean(p.proximo_partido ?? false)}
                    )
                `;
            }
        }

        const items = await sql`
            SELECT
                id,
                equipo_local,
                equipo_visitante,
                goles_local,
                goles_visitante,
                fecha,
                competicion,
                goleadores_local,
                goleadores_visitante,
                proximo_partido
            FROM partidos_items
            WHERE anio = ${anio}
            ORDER BY fecha DESC, id ASC
        `;

        return NextResponse.json({
            anio,
            partidos: items.map((i) => ({
                id: i.id,
                equipo_local: i.equipo_local,
                equipo_visitante: i.equipo_visitante,
                goles_local: i.goles_local,
                goles_visitante: i.goles_visitante,
                fecha: i.fecha,
                competicion: i.competicion,
                goleadores_local: i.goleadores_local ?? [],
                goleadores_visitante: i.goleadores_visitante ?? [],
                proximo_partido: Boolean(i.proximo_partido),
            })),
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar temporada de partidos' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ anio: string }> }
) {
    try {
        await crearTablas();

        const { anio: anioStr } = await params;
        const anio = Number(anioStr);

        const existing = await sql`SELECT anio FROM partidos_temporadas WHERE anio = ${anio}`;
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
        }

        await sql`DELETE FROM partidos_temporadas WHERE anio = ${anio}`;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar temporada de partidos' }, { status: 500 });
    }
}
