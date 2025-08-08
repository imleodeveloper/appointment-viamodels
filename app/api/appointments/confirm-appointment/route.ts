import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, serviceId, professionalId, selectedDate, time } = body;

  try {
    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single();

    if (serviceError) {
      console.log("Erro ao buscar o serviço no servidor: ", serviceError);
      return NextResponse.json(
        { message: "Erro ao buscar o serviço no servidor" },
        { status: 500 }
      );
    }

    const { data: professional, error: professionalError } = await supabaseAdmin
      .from("professionals")
      .select("*")
      .eq("id", professionalId)
      .single();

    if (professionalError) {
      console.log(
        "Erro ao buscar o profissional no servidor: ",
        professionalError
      );
      return NextResponse.json(
        { message: "Erro ao buscar o profissional" },
        { status: 500 }
      );
    }

    const { data: existingAppointment, error } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("slug_link", slug)
      .eq("professional_id", professionalId)
      .eq("appointment_date", selectedDate)
      .eq("appointment_time", time)
      .eq("status", "scheduled")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log("Erro ao procurar horário: ", error);
      return NextResponse.json(
        { message: "Erro ao procurar horário." },
        { status: 500 }
      );
    }

    if (existingAppointment) {
      console.log("Horário ocupado por outro cliente.");
      return NextResponse.json(
        {
          busy: true,
          message:
            "Este horário está ocupado por outro cliente. Por favor, escolha outro horário.",
        },
        { status: 200 }
      );
    }

    const appointmentData = {
      serviceId,
      professionalId,
      date: selectedDate,
      time,
      serviceName: service.name || "",
      professionalName: professional.name || "",
      duration: service.duration_minutes || 0,
      price: service.price || 0,
    };

    return NextResponse.json({ appointmentData }, { status: 200 });
  } catch (error) {
    console.error("Erro interno no servidor: ", error);
    return NextResponse.json(
      { message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
