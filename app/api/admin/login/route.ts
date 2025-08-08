import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, slug } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
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
      const { data: user, error: errorUser } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      //console.log("User: ", user);

      if (errorUser) {
        console.error("Erro no login: ", errorUser.message);
        return NextResponse.json({ error: errorUser.message }, { status: 401 });
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
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
