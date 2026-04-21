import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

interface Respuesta {
    texto: string;
    correcta: boolean;
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await crearTablas();
        const { id } = await params;
        const preguntaId = Number.parseInt(id, 10);

        const result = await sql`
            SELECT id, pregunta, tema, imagen, respuestas, created_at
            FROM trivia_preguntas
            WHERE id = ${preguntaId}
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al obtener la pregunta' }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await crearTablas();
        const { id } = await params;
        const preguntaId = Number.parseInt(id, 10);
        const body = await req.json();

        if (!body.pregunta || !body.tema || !body.respuestas) {
            return NextResponse.json(
                { error: 'Pregunta, tema y respuestas son requeridas' },
                { status: 400 }
            );
        }

        // Validar que hay exactamente una respuesta correcta
        const correctas = body.respuestas.filter((r: Respuesta) => r.correcta).length;
        if (correctas !== 1) {
            return NextResponse.json(
                { error: 'Debe haber exactamente una respuesta correcta' },
                { status: 400 }
            );
        }

        const pregunta = String(body.pregunta);
        const tema = String(body.tema);
        const imagen = body.imagen ? String(body.imagen) : null;
        const respuestas = JSON.stringify(body.respuestas);

        const result = await sql`
            UPDATE trivia_preguntas
            SET pregunta = ${pregunta}, tema = ${tema}, imagen = ${imagen}, respuestas = ${respuestas}::jsonb
            WHERE id = ${preguntaId}
            RETURNING id, pregunta, tema, imagen, respuestas, created_at
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al actualizar la pregunta' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await crearTablas();
        const { id } = await params;
        const preguntaId = Number.parseInt(id, 10);

        const result = await sql`
            DELETE FROM trivia_preguntas
            WHERE id = ${preguntaId}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al eliminar la pregunta' }, { status: 500 });
    }
}
