import { Professional, supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();

  try {
    const { data, error } = await supabaseAdmin
      .from("professionals")
      .select(
        `
        *,
        professional_services(
          service:services(*)
        )
        `
      )
      .eq("slug_link", slug)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Não encontrado");
      return NextResponse.json(
        { message: "Não encontrado serviços com o slug informado." },
        { status: 404 }
      );
    }

    const professionals: Professional[] = data as Professional[];
    return NextResponse.json({ professionals }, { status: 200 });
  } catch (error) {
    console.error("Erro no servidor: ", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
