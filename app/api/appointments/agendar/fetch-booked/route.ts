import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

function parseTimeToMinutes(time: string) {
  const parts = time.split(":").map(Number);
  const hour = parts[0] ?? 0;
  const minute = parts[1] ?? 0;
  return hour * 60 + minute;
}

function minutesToTime(minute: number) {
  const hh = String(Math.floor(minute / 60)).padStart(2, "0");
  const mm = String(minute % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

export async function POST(request: NextRequest) {
  try {
    const { date, professionalId, serviceId } = await request.json();

    if (!date || !professionalId || !serviceId) {
      return NextResponse.json(
        { message: "Informações obrigatórias estão faltando" },
        { status: 400 }
      );
    }

    // Pega a duração do serviço
    const { data: service, error: errorService } = await supabaseAdmin
      .from("services")
      .select("duration_minutes")
      .eq("id", serviceId)
      .single();

    if (errorService || !service) {
      return NextResponse.json(
        { message: "Erro ao buscar serviço ou serviço não encontrado" },
        { status: 500 }
      );
    }

    const serviceDuration: number = Number(service.duration_minutes);

    const { data: appointment, error: errorAppointment } = await supabaseAdmin
      .from("appointments")
      .select(`appointment_time`)
      .eq("professional_id", professionalId)
      .eq("appointment_date", date)
      .eq("status", "scheduled");

    if (errorAppointment) {
      console.error("Erro ao buscar agendamentos:", errorAppointment);
      return NextResponse.json(
        { message: "Erro ao buscar agendamentos" },
        { status: 500 }
      );
    }

    const SLOT_DURATION = 30;
    const bookedStarts = (appointment ?? []).map((a: any) =>
      parseTimeToMinutes(a.appointment_time)
    );

    const occupiedRanges: [number, number][] = bookedStarts.map((bs) => [
      bs,
      bs + serviceDuration,
    ]);

    const daySlots: string[] = [];
    for (let minute = 0; minute < 24 * 60; minute += 30) {
      daySlots.push(minutesToTime(minute));
    }

    const blocked: string[] = [];

    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    for (const slot of daySlots) {
      const start = parseTimeToMinutes(slot);
      const end = start + serviceDuration;

      if (end > 24 * 60) {
        blocked.push(slot);
        continue;
      }

      if (start < nowMinutes) {
        blocked.push(slot);
        continue;
      }

      const overlaps = occupiedRanges.some(([oStart, oEnd]) => {
        return start < oEnd && end > oStart;
      });

      if (overlaps) {
        blocked.push(slot);
      }
    }

    return NextResponse.json({ bookedTimes: blocked }, { status: 200 });
  } catch (error) {
    console.error(
      "Erro interno ao buscar agendamentos do profissional:",
      error
    );
    return NextResponse.json(
      { message: "Erro interno ao buscar agendamentos do profissional" },
      { status: 500 }
    );
  }
}
