import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  const { slug, dates_and_times } = await request.json();
  console.log(slug, "/", dates_and_times);

  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ dates_and_times })
      .eq("slug_link", slug);

    if (error) {
      console.log("Erro ao atualizar: ", error);
      return NextResponse.json(
        { message: "Erro ao atualizar, tente novamente." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Horários atualizados com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro interno no servidor: ", error);
    return NextResponse.json(
      { message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
