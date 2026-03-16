import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

type HistoriaInput = {
    anio?: number;
    titulo?: string;
    descripcion?: string;
    icono?: string;
};

export async function GET() {
    try {
        await crearTablas();

        const rows = await sql`
            SELECT id, anio, titulo, descripcion, icono
            FROM historia_eventos
            ORDER BY anio ASC, id ASC
        `;

        return NextResponse.json(
            rows.map((r) => ({
                id: r.id,
                anio: r.anio,
                titulo: r.titulo,
                descripcion: r.descripcion,
                icono: r.icono,
            }))
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer historia' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();

        const body = (await req.json()) as HistoriaInput;
        const anio = Number(body.anio);
        const titulo = String(body.titulo ?? '').trim();
        const descripcion = String(body.descripcion ?? '').trim();
        const icono = String(body.icono ?? 'star').trim() || 'star';

        if (!Number.isFinite(anio) || !titulo) {
            return NextResponse.json(
                { error: 'Año y título son obligatorios' },
                { status: 400 }
            );
        }

        const max = await sql`SELECT COALESCE(MAX(id), 0) AS max_id FROM historia_eventos`;
        const id = Number(max[0]?.max_id ?? 0) + 1;

        await sql`
            INSERT INTO historia_eventos (id, anio, titulo, descripcion, icono)
            VALUES (${id}, ${anio}, ${titulo}, ${descripcion}, ${icono})
        `;

        return NextResponse.json({ ok: true, id }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear evento histórico' }, { status: 500 });
    }
}
