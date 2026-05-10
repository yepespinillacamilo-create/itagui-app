import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sesionId = searchParams.get('sesion_id');
  const sb = getSupabase();
  if (sesionId) {
    const { data } = await sb.from('asistencias').select('*, estudiantes(id,nombre,cedula,celular,foto,activo,orden)').eq('sesion_id', Number(sesionId));
    return NextResponse.json(data ?? []);
  }
  const { data: sesiones } = await sb.from('sesiones').select('id, fecha, descripcion').order('fecha', { ascending: false });
  if (!sesiones?.length) return NextResponse.json({ sesiones: [], asistencias: [] });
  const { data: asistencias } = await sb.from('asistencias').select('*').in('sesion_id', sesiones.map((s: { id: number }) => s.id));
  return NextResponse.json({ sesiones, asistencias: asistencias ?? [] });
}

export async function POST(req: NextRequest) {
  const sb = getSupabase();
  const { sesion_id, estudiante_id, asistio, nota } = await req.json();
  const { data: existe } = await sb.from('asistencias').select('id').eq('sesion_id', sesion_id).eq('estudiante_id', estudiante_id).maybeSingle();
  if (existe) {
    const { data } = await sb.from('asistencias').update({ asistio, nota: nota || null }).eq('id', existe.id).select().single();
    return NextResponse.json(data);
  }
  const { data } = await sb.from('asistencias').insert({ sesion_id, estudiante_id, asistio: asistio ?? 0, nota: nota || null }).select().single();
  return NextResponse.json(data, { status: 201 });
}
