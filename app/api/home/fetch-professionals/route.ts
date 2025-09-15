import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export interface ProfessionalUser {
  name: string;
  email: string | null;
  phone: string | null;
  photo_professional: string | null;
  active: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { message: "Não foi possível buscar profissionais" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("professionals")
      .select("*")
      .eq("slug_link", slug);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar profissionais" },
        { status: 500 }
      );
    }

    const dataProfessional: ProfessionalUser[] = data.map(
      (profissional: any) => ({
        name: profissional.name,
        email: profissional.email,
        phone: profissional.phone,
        photo_professional: profissional.photo_professional,
        active: profissional.active,
      })
    );

    return NextResponse.json(
      { professionals: dataProfessional },
      { status: 200 }
    );
  } catch (error) {
    console.error("Não foi possível conectar ao servidor:", error);
    return NextResponse.json(
      {
        message:
          "Erro interno do servidor, não foi possível buscar profissionais",
      },
      { status: 500 }
    );
  }
}
