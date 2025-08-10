import { supabase } from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  console.log(slug);
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,           
        service:services(*),
        professional:professionals(*)
          `
      )
      .eq("slug_link", slug)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      console.log("Não foram encontrados agendamentos: ", error);
      return NextResponse.json(
        { message: "Não foram encontrados agendamentos" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Erro no servidor de agendamentos: ", error);
    return NextResponse.json(
      { message: "Erro no servidor de agendamento" },
      { status: 500 }
    );
  }
}
