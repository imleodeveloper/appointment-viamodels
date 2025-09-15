import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse, NextRequest } from "next/server";

export type TimeRange = {
  start: string;
  end: string;
};

export type WeekAvailability = {
  [key: number]: TimeRange[];
};

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  slug_link: string;
}

export interface UserBusiness {
  business_name: string;
  presentation: string;
  phones: string[];
  audience: string[];
  links: string[];
  dates_and_times: WeekAvailability;
  photo_business: string | null;
  address: string[];
}

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
          return_link: "https://privetime.viamodels.com.br/",
          message: `Slug informado incorreto: ${slug}`,
          slugError,
        },
        { status: 404 }
      );
    }

    const { data: userBusiness, error: errorBusiness } = await supabaseAdmin
      .from("business_profiles")
      .select("*")
      .eq("user_id", slugData.id)
      .single();

    if (errorBusiness) {
      return NextResponse.json(
        {
          message:
            "Não foi possível verificar informações do proprietário desta agenda. Tente novamente mais tarde.",
        },
        { status: 404 }
      );
    }

    const userProfile: UserProfile = {
      id: slugData.id,
      full_name: slugData.full_name,
      phone: slugData.phone,
      email: slugData.email,
      slug_link: slugData.slug_link,
    };

    const business: UserBusiness = {
      business_name: userBusiness.business_name,
      presentation: userBusiness.presentation,
      phones: userBusiness.phones,
      audience: userBusiness.audience,
      links: userBusiness.links,
      dates_and_times: userBusiness.dates_and_times,
      photo_business: userBusiness.photo_business,
      address: userBusiness.address,
    };

    return NextResponse.json(
      { slug_link: userProfile.slug_link, userProfile, business },
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
