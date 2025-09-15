import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

type TimeRange = {
  start: string;
  end: string;
};

type WeekAvailability = {
  [key: number]: TimeRange[];
};

interface UserDates {
  dates_and_times: WeekAvailability;
}

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { message: "Informações obrigatórias não encontradas" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("business_profiles")
      .select("dates_and_times")
      .eq("slug_link", slug)
      .single();

    if (error) {
      console.log("Não foi possível encontrar informações de negócio:", error);
      return NextResponse.json(
        { message: "Não foi possível buscar informações de agendamentos" },
        { status: 404 }
      );
    }

    const datesAndTimes: UserDates = {
      dates_and_times: data.dates_and_times,
    };

    return NextResponse.json({ datesAndTimes }, { status: 200 });
  } catch (error) {
    console.error("Não foi possível buscar informações no servidor:", error);
    return NextResponse.json(
      { message: "Não foi possílve buscar informações do servidor" },
      { status: 500 }
    );
  }
}
