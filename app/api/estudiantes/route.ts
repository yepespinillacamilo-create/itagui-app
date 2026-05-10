import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('estudiantes').select('*').order('orden', { ascending: true, nullsFirst: false }).order('nombre', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabase();
    const { nombre, cedula, celular, foto, activo } = await req.json();
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    const { data, error } = await sb.from('estudiantes')
      .insert({ nombre: nombre.trim(), cedula: cedula?.trim(), celular: celular?.trim() || null, foto: foto || null, activo: activo ?? 1 })
      .select().single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Error al crear' }, { status: 500 }); }
}
