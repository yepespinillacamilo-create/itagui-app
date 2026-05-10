import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const sb = getSupabase();

    const [
      { count: totalColaboradores },
      { count: imposicionManos },
      { count: profecia },
      { count: enMira },
      { count: enFimlm },
      { count: totalEstudiantes },
      { data: ultimaSesionData },
    ] = await Promise.all([
      sb.from('colaboradores').select('*', { count: 'exact', head: true }),
      sb.from('colaboradores').select('*', { count: 'exact', head: true }).contains('dones', ['Imposición de Manos']),
      sb.from('colaboradores').select('*', { count: 'exact', head: true }).contains('dones', ['Profecía']),
      sb.from('colaboradores').select('*', { count: 'exact', head: true }).not('mira', 'eq', '[]'),
      sb.from('colaboradores').select('*', { count: 'exact', head: true }).not('fimlm', 'eq', '[]'),
      sb.from('estudiantes').select('*', { count: 'exact', head: true }).eq('activo', 1),
      sb.from('sesiones')
        .select('id, fecha, descripcion')
        .order('fecha', { ascending: false })
        .limit(1),
    ]);

    let ultimaSesion = null;
    if (ultimaSesionData && ultimaSesionData.length > 0) {
      const s = ultimaSesionData[0];
      const { data: asistencias } = await sb
        .from('asistencias')
        .select('asistio')
        .eq('sesion_id', s.id);

      const total_registros  = asistencias?.length ?? 0;
      const total_asistieron = asistencias?.filter((a: { asistio: number }) => a.asistio === 1).length ?? 0;
      ultimaSesion = { ...s, total_registros, total_asistieron };
    }

    return NextResponse.json({
      totalColaboradores: totalColaboradores ?? 0,
      imposicionManos:    imposicionManos    ?? 0,
      profecia:           profecia           ?? 0,
      enMira:             enMira             ?? 0,
      enFimlm:            enFimlm            ?? 0,
      totalEstudiantes:   totalEstudiantes   ?? 0,
      ultimaSesion,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
