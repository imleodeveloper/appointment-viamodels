import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { serviceId, slug } = body;
  //console.log("ServiceId", serviceId);
  //console.log("slug", slug);

  try {
    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .eq("slug_link", slug)
      .single();

    if (serviceError || !serviceData) {
      console.log("Serviço do usuário não encontrado: ", serviceError);
      return NextResponse.json(
        { message: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    if (serviceData) {
      console.log("Serviço encontrado com sucesso.");
      return NextResponse.json({ serviceData }, { status: 200 });
    }
  } catch (error) {
    console.error("Erro no servidor: ", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
