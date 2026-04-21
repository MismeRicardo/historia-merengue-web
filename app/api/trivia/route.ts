import { NextResponse } from 'next/server';
import sql, { crearTablas } from '@/lib/db';

interface Respuesta {
    texto: string;
    correcta: boolean;
}

interface Pregunta {
    id: number;
    pregunta: string;
    tema: string;
    imagen: string | null;
    respuestas: Respuesta[];
    created_at: string;
}

export async function GET() {
    try {
        await crearTablas();
        const preguntas = await sql`
            SELECT id, pregunta, tema, imagen, respuestas, created_at
            FROM trivia_preguntas
            ORDER BY created_at DESC
        `;
        return NextResponse.json(preguntas);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al leer las preguntas' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await crearTablas();
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
            INSERT INTO trivia_preguntas (pregunta, tema, imagen, respuestas)
            VALUES (${pregunta}, ${tema}, ${imagen}, ${respuestas}::jsonb)
            RETURNING id, pregunta, tema, imagen, respuestas, created_at
        `;

        return NextResponse.json(result[0], { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Error al crear la pregunta' }, { status: 500 });
    }
}
