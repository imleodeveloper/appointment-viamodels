import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { serviceId, slug } = body;

  try {
    const { data: professionalsData, error: professionalsError } =
      await supabaseAdmin
        .from("professionals")
        .select("*")
        .eq("slug_link", slug)
        .eq("active", true)
        .order("name");

    if (professionalsError || !professionalsData) {
      console.log(
        "Profissional do usuário não encontrado: ",
        professionalsError
      );
      return NextResponse.json(
        { message: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ professionalsData }, { status: 200 });
  } catch (error) {
    console.error("Erro no servidor: ", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
