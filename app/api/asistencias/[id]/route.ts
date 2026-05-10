import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { asistio, nota, fecha, descripcion } = await req.json();
  const sb = getSupabase();
  if (fecha !== undefined) {
    const { data } = await sb.from('sesiones').update({ fecha, descripcion: descripcion || null }).eq('id', Number(id)).select().single();
    return NextResponse.json(data);
  }
  const { data } = await sb.from('asistencias').update({ asistio, nota: nota || null }).eq('id', Number(id)).select().single();
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getSupabase();
  await sb.from('asistencias').delete().eq('sesion_id', Number(id));
  await sb.from('sesiones').delete().eq('id', Number(id));
  return NextResponse.json({ ok: true });
}
