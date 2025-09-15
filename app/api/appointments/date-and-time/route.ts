import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

type WeekAvailability = {
  [key: number]: string[];
};

export async function POST(request: NextRequest) {
  const { slug } = await request.json();

  try {
    const { data, error } = await supabaseAdmin
      .from("business_profiles")
      .select("dates_and_times")
      .eq("slug_link", slug)
      .single();

    if (error) {
      console.log("Não foi encontrado o usuário: ", error);
      return NextResponse.json(
        { message: "Não foi possível encontrar o usuário" },
        { status: 404 }
      );
    }

    const dates_and_times: WeekAvailability = data?.dates_and_times;
    return NextResponse.json(
      { dates_and_times, message: "Datas e horários encontrados com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao conectar no servidor: ", error);
    return NextResponse.json(
      { message: "Erro ao conectar no servidor" },
      { status: 500 }
    );
  }
}
