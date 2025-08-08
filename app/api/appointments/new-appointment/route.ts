import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, appointmentData, clientNameTrim, phoneClient } = body;
  console.log(slug.slug);
  console.log(appointmentData);
  console.log(clientNameTrim);
  console.log(phoneClient);

  try {
    // Verifica disponibilidade novamente antes de continuar
    const { data: existingAppointment, error: checkError } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("professional_id", appointmentData.professionalId)
      .eq("appointment_date", appointmentData.date)
      .eq("appointment_time", appointmentData.time)
      .eq("status", "scheduled")
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.log(
        "Erro ao verificar disponibilidade de agendamento: ",
        checkError
      );
      return NextResponse.json(
        { message: "Erro ao verificar disponibilidade de agendamento" },
        { status: 503 }
      );
    }

    if (existingAppointment) {
      console.log("Este horário está ocupado por outro cliente.");
      return NextResponse.json(
        {
          message:
            "Este horário acabou de ser ocupado por outro cliente. Por favor, escolha outro horário.",
        },
        { status: 503 }
      );
    }

    // Create the appointment
    const { data: newAppointment, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        slug_link: slug.slug,
        service_id: appointmentData.serviceId,
        professional_id: appointmentData.professionalId,
        client_name: clientNameTrim,
        client_phone: phoneClient,
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.log("Não foi possível criar novo agendamento: ", error);
      return NextResponse.json(
        { message: "Não foi possível criar novo agendamento." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        phoneClient: phoneClient,
        newAppointmentId: newAppointment.id,
        routerPush: `/${slug.slug}/agendamento-confirmado`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json(
      { message: "Erro ao criar agendamento. Tente novamente." },
      { status: 500 }
    );
  }
}
