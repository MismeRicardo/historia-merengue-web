import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

interface CamisetaInput {
    id: number;
    proveedor: string;
    jugador?: string | null;
    colores: string[];
    descripcion: string;
    tipo: string;
    principal: string | null;
    imagenes: string[];
}

export async function GET() {
    try {
        await crearTablas();

        const temporadas = await sql`
            SELECT anio
            FROM camisetas_temporadas
            ORDER BY anio DESC
        `;

        const items = await sql`
            SELECT id, anio, proveedor, jugador, colores, descripcion, tipo, principal, imagenes
            FROM camisetas_items
            ORDER BY anio DESC, id ASC
        `;

        const data = temporadas.map((t) => ({
            anio: t.anio,
            camisetas: items
                .filter((i) => i.anio === t.anio)
                .map((i) => ({
                    id: i.id,
                    proveedor: i.proveedor,
                    jugador: i.jugador ?? null,
                    colores: i.colores ?? [],
                    descripcion: i.descripcion,
                    tipo: i.tipo,
                    principal: i.principal,
                    imagenes: i.imagenes ?? [],
                })),
        }));

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer las camisetas' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();

        const body = await req.json();
        const anio = Number(body.anio);
        const camisetas = Array.isArray(body.camisetas) ? (body.camisetas as CamisetaInput[]) : [];

        if (!anio) {
            return NextResponse.json({ error: 'El año es obligatorio' }, { status: 400 });
        }

        const existing = await sql`SELECT anio FROM camisetas_temporadas WHERE anio = ${anio}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Ya existe una temporada de camisetas con ese año' }, { status: 400 });
        }

        await sql`INSERT INTO camisetas_temporadas (anio) VALUES (${anio})`;

        for (const c of camisetas) {
            await sql`
                INSERT INTO camisetas_items (id, anio, proveedor, jugador, colores, descripcion, tipo, principal, imagenes)
                VALUES (
                    ${Number(c.id)},
                    ${anio},
                    ${String(c.proveedor ?? '')},
                    ${c.jugador ? String(c.jugador) : null},
                    ${JSON.stringify(c.colores ?? [])}::jsonb,
                    ${String(c.descripcion ?? '')},
                    ${String(c.tipo ?? 'Titular')},
                    ${c.principal ? String(c.principal) : null},
                    ${JSON.stringify(c.imagenes ?? [])}::jsonb
                )
            `;
        }

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear la temporada de camisetas' }, { status: 500 });
    }
}
