import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { date, professionalId } = await request.json();

    if (!date || !professionalId) {
      return NextResponse.json(
        { message: "Informações obrigatórias estão faltando" },
        { status: 400 }
      );
    }

    const { data: appointment, error: errorAppointment } = await supabaseAdmin
      .from("appointments")
      .select(`appointment_time, status`)
      .eq("professional_id", professionalId)
      .eq("appointment_date", date);

    if (errorAppointment) {
      console.error("Erro ao buscar agendamentos:", errorAppointment);
      return NextResponse.json(
        { message: "Erro ao buscar agendamentos" },
        { status: 500 }
      );
    }

    const bookedTimes = appointment.map((a: any) => a.appointment_time);

    return NextResponse.json({ bookedTimes }, { status: 200 });
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
