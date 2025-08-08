import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { appointmentId } = body;
  console.log("AppointmentId: ", appointmentId);

  try {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) {
      console.log("Não foi possível cancelar o agendamento: ", error);
      return NextResponse.json(
        { message: "Não foi possível cancelar o agendamento" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Agendamento cancelado com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro interno do servidor ao cancelar agendamento: ", error);
    return NextResponse.json(
      { message: "Erro interno do servidor ao cancelar agendamento" },
      { status: 500 }
    );
  }
}
