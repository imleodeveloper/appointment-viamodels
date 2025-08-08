import { Service, supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug } = body;

  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("slug_link", slug);

    if (error || !data) {
      console.log("Não foi encontrado serviços com o slug informado: ", slug);
      return NextResponse.json(
        { message: "Não foi encontrado serviços disponíveis." },
        { status: 404 }
      );
    }

    const services: Service[] = data as Service[];
    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error("Erro no servidor: ", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 500 });
  }
}
