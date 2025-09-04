import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, slug } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Credenciais inválidas" },
        { status: 400 }
      );
    }

    const { data: confirmSlug, error: errorSlug } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .eq("slug_link", slug)
      .single();

    if (confirmSlug) {
      const { data: userPlan, error: errorPlan } = await supabaseAdmin
        .from("users_plan")
        .select("*")
        .eq("user_id", confirmSlug.id)
        .single();

      if (errorPlan) {
        console.log("Não foi possível encontrar plano de usuário:", errorPlan);
        return NextResponse.json(
          {
            message: "Não foi encontrado o plano do usuário, tente novamente.",
          },
          { status: 404 }
        );
      }

      if (
        userPlan.status === "expired" ||
        userPlan.status === "expired-canceled" ||
        userPlan.status === "canceled"
      ) {
        return NextResponse.json(
          {
            message:
              "Plano expirado ou cancelado, será necessário renovar para entrar novamente. ",
          },
          { status: 401 }
        );
      }

      if (userPlan.status === "active" || userPlan.status === "canceled") {
        const createdAt = new Date(userPlan.created_at);
        const today = new Date();
        const differenceDays = today.getTime() - createdAt.getTime();
        const convertDays = differenceDays / (1000 * 60 * 60 * 24);
        if (
          (userPlan.slug_plan_at_moment === "trial_plan" && convertDays >= 7) ||
          (userPlan.slug_plan_at_moment === "annual_plan" &&
            convertDays >= 365) ||
          (userPlan.slug_plan_at_moment === "monthly_plan" &&
            convertDays >= 31) ||
          (userPlan.slug_plan_at_moment === "test_plan" && convertDays >= 31)
        ) {
          const { error } = await supabaseAdmin
            .from("users_plan")
            .update({
              status:
                userPlan.status === "active" ? "expired" : "expired-canceled",
            })
            .eq("user_id", confirmSlug.id);

          if (error) {
            console.log("Erro ao fazer login, e expirar plano", error);
            return NextResponse.json(
              { message: "Erro ao fazer login, e expirar plano" },
              { status: 500 }
            );
          }
        }
      }

      if (userPlan.status === "active") {
        const { data: user, error: errorUser } =
          await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

        //console.log("User: ", user);

        if (errorUser) {
          console.error("Erro no login: ", errorUser.message);
          return NextResponse.json(
            {
              message: "Credenciais inválidas. Verifique seu usuário e senha.",
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          {
            user: {
              id: user.user.id,
              email: user.user.email,
            },
            session: {
              access_token: user.session.access_token,
              refresh_token: user.session.refresh_token,
              expires_at: user.session.expires_at,
            },
          },
          { status: 200 }
        );
      }
    } else if (errorSlug || !confirmSlug) {
      return NextResponse.json(
        {
          message: "Usuário administrador inválido para utilizar neste URL.",
        },
        { status: 404 }
      );
    }
    /* const { data: admin, error } = await supabase
      .from("admins")
      .select(
        `
        *, 
        professional:professionals(*)
        `
      )
      .eq("email", email)
      .single(); 
      
      if (error || !admin) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 401 }
        );
      }
      */

    /*/ Retornar informações do admin incluindo role e professional_id
    return NextResponse.json(
      {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          professional_id: admin.professional_id,
          professional: admin.professional,
        },
      },
      { status: 200 }
    ); */
  } catch (error) {
    console.error("Erro na API de login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
