import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { professionalId, selectedDate, slug } = await request.json();

    if (!professionalId) {
      return NextResponse.json(
        { message: "Informações obrigatórios não enviadas" },
        { status: 400 }
      );
    }

    const { data: professionalData, error: professionalError } =
      await supabaseAdmin
        .from("professionals")
        .select("*")
        .eq("id", professionalId)
        .single();

    if (professionalError || !professionalData) {
      console.error(
        "Não foi possível encontrar profissional:",
        professionalError
      );
      return NextResponse.json(
        { message: "Esse profissional não existe mais." },
        { status: 404 }
      );
    }

    const { data: appointmentsData, error: errorAppointments } =
      await supabaseAdmin
        .from("appointments")
        .select("appointment_time")
        .eq("professional_id", professionalId)
        .eq("appointment_date", selectedDate)
        .eq("slug_link", slug)
        .eq("status", "scheduled");

    if (errorAppointments) {
      // Não é um erro profissional pode não ter agendamento marcado para essa data
      console.error("Não foi possível encontrar agendamento.");
      return NextResponse.json({ appointments: [] });
    }

    return NextResponse.json({
      appointments: appointmentsData || [],
      professional: professionalData,
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json(
      {
        message:
          "Não foi possível encontrar agendamentos, erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
