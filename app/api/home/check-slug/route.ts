import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const slug = await request.json();
  //console.log("Slug: ", slug);
  try {
    const { data: slugData, error: slugError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("slug_link", slug)
      .single();

    if (slugError || !slugData) {
      return NextResponse.json(
        {
          return_link: "https://privtime.vercel.app/",
          message: `Slug informado incorreto: ${slug}`,
          slugError,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { slug_link: slugData.slug_link },
      { status: 200 }
    );
  } catch (error) {
    console.error("Não foi possível receber retorno do servidor: ", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
