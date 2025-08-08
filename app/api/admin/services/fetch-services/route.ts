import { Service, supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { slugAdmin } = await request.json();

  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select(
        `*,         
        professional_services(
          professional:professionals(id, name)
        )`
      )
      .eq("slug_link", slugAdmin)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Não encontrado");
      return NextResponse.json(
        { message: "Não encontrado serviços com o slug informado." },
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
