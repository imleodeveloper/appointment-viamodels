import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";
import { Service } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("slug_link", slug)
      .eq("active", true)
      .order("name");

    console.log("Data: ", data);

    if (error) {
      console.log(
        "Não foi possível encontrar um serviço para esse usuário.",
        error
      );
      return NextResponse.json(
        {
          message: "Não foi possível encontrar um serviço disponível.",
        },
        { status: 404 }
      );
    }

    const services: Service[] = data as Service[];

    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error("Não foi possível fazer contato com o servidor.", error);
    return NextResponse.json(
      {
        message: "Erro ao buscar serviços.",
      },
      { status: 500 }
    );
  }
}
