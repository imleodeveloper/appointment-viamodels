import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  try {
    const { data, error } = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("slug_link", slug)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: `Nenhum admin encontrado para o slug: ${slug}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user_admin: {
          email: data.email,
          slug_link: data.slug_link,
          name: data.name,
          role: data.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro na busca de informações do usuário Admin: ", error);
    return NextResponse.json({ message: "Erro no servidor" }, { status: 400 });
  }
}
