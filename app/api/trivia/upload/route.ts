import { del, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json(
                { error: 'Falta configurar BLOB_READ_WRITE_TOKEN en el entorno' },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const archivo = formData.get('file') as File;

        if (!archivo) {
            return NextResponse.json({ error: 'No se envio archivo' }, { status: 400 });
        }

        if (!archivo.type.startsWith('image/')) {
            return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
        }

        const buffer = await archivo.arrayBuffer();
        const timestamp = Date.now();
        const nombreArchivo = `trivia-${timestamp}-${archivo.name}`;

        const blob = await put(nombreArchivo, buffer, {
            access: 'public',
            contentType: archivo.type,
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json(
                { error: 'Falta configurar BLOB_READ_WRITE_TOKEN en el entorno' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const url = typeof body?.url === 'string' ? body.url : '';

        if (!url?.startsWith('http')) {
            return NextResponse.json({ error: 'URL de imagen invalida' }, { status: 400 });
        }

        await del(url);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json({ error: 'Error al eliminar la imagen' }, { status: 500 });
    }
}
