import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get('fecha');

    if (fecha) {
      const sesionRes = await db.execute({ sql: 'SELECT * FROM sesiones WHERE fecha = ?', args: [fecha] });
      if (sesionRes.rows.length === 0) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
      const sesion = sesionRes.rows[0];

      const rows = await db.execute({
        sql: `SELECT e.nombre, e.cedula, e.celular,
                CASE WHEN a.asistio = 1 THEN 'Asistió' ELSE 'No asistió' END as asistencia,
                a.registrado_en
              FROM asistencias a
              JOIN estudiantes e ON e.id = a.estudiante_id
              WHERE a.sesion_id = ?
              ORDER BY e.nombre ASC`,
        args: [sesion.id],
      });

      const wb = XLSX.utils.book_new();
      const wsData = [
        ['Nombre', 'Cédula', 'Celular', 'Asistencia', 'Registrado'],
        ...rows.rows.map((r) => [r.nombre, r.cedula, r.celular || '', r.asistencia, r.registrado_en]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, `Asistencia ${fecha}`);
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="asistencia-${fecha}.xlsx"`,
        },
      });
    }

    const sesiones = await db.execute(`
      SELECT s.fecha, s.descripcion,
        COUNT(a.id) as total,
        SUM(a.asistio) as asistieron,
        COUNT(a.id) - SUM(a.asistio) as ausentes
      FROM sesiones s
      LEFT JOIN asistencias a ON a.sesion_id = s.id
      GROUP BY s.id
      ORDER BY s.fecha DESC
    `);

    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Fecha', 'Descripción', 'Total', 'Asistieron', 'Ausentes', '% Asistencia'],
      ...sesiones.rows.map((s) => [
        s.fecha,
        s.descripcion || '',
        s.total,
        s.asistieron,
        s.ausentes,
        Number(s.total) > 0 ? `${Math.round((Number(s.asistieron) / Number(s.total)) * 100)}%` : '0%',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="historial-asistencias.xlsx"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}
