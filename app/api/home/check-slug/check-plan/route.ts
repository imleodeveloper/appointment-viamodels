import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const slug = await request.json();

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("slug_link", slug)
      .single();

    if (error) {
      console.log("Não foi encontrado o usuário: ", error);
      return NextResponse.json({
        message: "Não foi encontrado o usuário",
        status: 404,
      });
    }

    const { data: userPlan, error: errorPlan } = await supabaseAdmin
      .from("users_plan")
      .select("*")
      .eq("user_id", data.id)
      .single();
    if (errorPlan) {
      console.log("Não foi encontrado o plano do usuário:", errorPlan);
      return NextResponse.json(
        {
          message:
            "Não foi possível encontrar o plano do administrador do site",
        },
        { status: 404 }
      );
    }

    if (userPlan.status === "expired") {
      return NextResponse.json(
        {
          notAuthorized:
            "Este agendamento precisa ser renovado o plano, tente entrar novamente mais tarde.",
        },
        { status: 401 }
      );
    }

    if (userPlan.status === "active") {
      return NextResponse.json({ status: 200 });
    }
  } catch (error) {
    console.error("Erro interno no servidor:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
