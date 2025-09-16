import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { date, professionalId, timeSelect, serviceId } =
      await request.json();

    if (!date || !professionalId || !timeSelect || !serviceId) {
      return NextResponse.json(
        { message: "Informações obrigatórias estão faltando" },
        { status: 400 }
      );
    }

    const [timeHour, timeMinute] = timeSelect.split(":").map(Number);
    const normalizedTimeSelected = `${timeSelect}:00`;

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

    const bookedTimes = appointment.map((a: any) => a.appointment_time);

    const isAlreadyBooked = bookedTimes.includes(normalizedTimeSelected);

    if (isAlreadyBooked) {
      return NextResponse.json(
        {
          message:
            "Este horário já foi ocupado por outra pessoa, tente escolher outro horário.",
        },
        { status: 409 }
      );
    }

    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("name, duration_minutes, price")
      .eq("id", serviceId)
      .single();

    if (serviceError) {
      console.log("Não foi possível encontrar serviço:", serviceError);
      return NextResponse.json(
        {
          message:
            "Não foi possível continuar com agendamento, não foi possível encontrar o serviço",
        },
        { status: 500 }
      );
    }

    const { data: professionalData, error: professionalError } =
      await supabaseAdmin
        .from("professionals")
        .select("name")
        .eq("id", professionalId)
        .single();

    if (professionalError) {
      console.log("Não foi possível encontrar serviço:", professionalError);
      return NextResponse.json(
        {
          message:
            "Não foi possível continuar com agendamento, não foi possível encontrar o profissional",
        },
        { status: 500 }
      );
    }

    const appointmentData = {
      serviceId,
      professionalId,
      date,
      time: timeSelect,
      serviceName: serviceData.name,
      professionalName: professionalData.name,
      duration: serviceData.duration_minutes,
      price: serviceData.price,
    };

    return NextResponse.json({ appointmentData }, { status: 200 });
  } catch (error) {
    console.error(
      "Erro interno do servidor ao lidar com tempo selecionado:",
      error
    );
    return NextResponse.json(
      {
        message:
          "Erro interno do servidor ao confirmar ação com o horário selecionado",
      },
      { status: 500 }
    );
  }
}
