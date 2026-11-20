import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

type EquipoInput = {
    nombre?: string;
    escudoUrl?: string | null;
};

export async function GET() {
    try {
        await crearTablas();
        const rows = await sql`
            SELECT id, nombre, escudo_url
            FROM equipos
            ORDER BY nombre ASC
        `;
        return NextResponse.json(rows.map((row) => ({
            id: row.id,
            nombre: row.nombre,
            escudoUrl: row.escudo_url ?? null,
        })));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer equipos' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();
        const body = (await req.json()) as EquipoInput;
        const nombre = String(body.nombre ?? '').trim();
        const escudoUrl = typeof body.escudoUrl === 'string' && body.escudoUrl.trim()
            ? body.escudoUrl.trim()
            : null;

        if (!nombre) {
            return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
        }

        const existente = await sql`SELECT id FROM equipos WHERE LOWER(nombre) = LOWER(${nombre})`;
        if (existente.length > 0) {
            return NextResponse.json({ error: 'Ya existe un equipo con ese nombre' }, { status: 400 });
        }

        const max = await sql`SELECT COALESCE(MAX(id), 0) AS max_id FROM equipos`;
        const id = Number(max[0]?.max_id ?? 0) + 1;

        await sql`
            INSERT INTO equipos (id, nombre, escudo_url)
            VALUES (${id}, ${nombre}, ${escudoUrl})
        `;

        return NextResponse.json({ ok: true, id }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 });
    }
}
