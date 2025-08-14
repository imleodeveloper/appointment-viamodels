import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`dates_and_times`)
      .eq("slug_link", slug)
      .single();

    if (error || !data) {
      console.error("Erro ao buscar usuário:", error);
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const { dates_and_times } = data;
    console.log(dates_and_times);

    return NextResponse.json({ dates_and_times }, { status: 200 });
  } catch (error) {
    console.error("Não foi possível fazer contato com o servidor: ", error);
    return NextResponse.json(
      { message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
