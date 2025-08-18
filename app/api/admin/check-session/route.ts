import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, userId } = body;
  console.log(slug);
  console.log(userId);

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("slug_link", slug)
      //.eq("id", userId.user.id)
      .single();

    if (!data || error) {
      return NextResponse.json(
        {
          notAuthenticated: true,
          message: "Não foi possível autenticar sem login",
        },
        { status: 400 }
      );
    }

    if (data) {
      return NextResponse.json(
        { isAuthenticated: true, message: "Autenticação concluída" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Não foi possível conectar ao servidor de respostas:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
