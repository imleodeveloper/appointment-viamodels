import { supabase } from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const slug = await request.json();
  console.log("Slug: ", slug);
  try {
    const { data: slugData, error: slugError } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug_link", slug)
      .single();

    if (slugError || !slugData) {
      return NextResponse.json(
        { message: `Slug informado incorreto: ${slug}`, slugError },
        { status: 404 }
      );
    }

    if (slugData) {
      console.log("Segue o retorno do SlugData: ", slugData);
    }

    console.log("slugData: ", slugData);
  } catch (error) {
    console.error("Não foi possível receber retorno do servidor: ", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
