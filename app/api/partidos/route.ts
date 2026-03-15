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
}

export async function GET() {
    try {
        await crearTablas();

        const temporadas = await sql`
            SELECT anio
            FROM partidos_temporadas
            ORDER BY anio DESC
        `;

        const items = await sql`
            SELECT
                id,
                anio,
                equipo_local,
                equipo_visitante,
                goles_local,
                goles_visitante,
                fecha,
                competicion,
                goleadores_local,
                goleadores_visitante
            FROM partidos_items
            ORDER BY anio DESC, fecha DESC, id ASC
        `;

        const data = temporadas.map((t) => ({
            anio: t.anio,
            partidos: items
                .filter((i) => i.anio === t.anio)
                .map((i) => ({
                    id: i.id,
                    equipo_local: i.equipo_local,
                    equipo_visitante: i.equipo_visitante,
                    goles_local: i.goles_local,
                    goles_visitante: i.goles_visitante,
                    fecha: i.fecha,
                    competicion: i.competicion,
                    goleadores_local: i.goleadores_local ?? [],
                    goleadores_visitante: i.goleadores_visitante ?? [],
                })),
        }));

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer partidos' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();

        const body = await req.json();
        const anio = Number(body.anio);
        const partidos = Array.isArray(body.partidos) ? (body.partidos as PartidoInput[]) : [];

        if (!anio) {
            return NextResponse.json({ error: 'El año es obligatorio' }, { status: 400 });
        }

        const existing = await sql`SELECT anio FROM partidos_temporadas WHERE anio = ${anio}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Ya existe una temporada de partidos con ese año' }, { status: 400 });
        }

        await sql`INSERT INTO partidos_temporadas (anio) VALUES (${anio})`;

        for (const p of partidos) {
            await sql`
                INSERT INTO partidos_items (
                    id, anio, equipo_local, equipo_visitante, goles_local, goles_visitante,
                    fecha, competicion, goleadores_local, goleadores_visitante
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
                    ${JSON.stringify(p.goleadores_visitante ?? [])}::jsonb
                )
            `;
        }

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear temporada de partidos' }, { status: 500 });
    }
}
