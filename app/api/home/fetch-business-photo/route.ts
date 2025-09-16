import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { path, bucketName } = await request.json();

    if (!path || !bucketName) {
      return NextResponse.json(
        { error: "Caminho da foto não fornecido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(path, 60 * 60); // 1h de expiração

    if (error) {
      console.error("Erro ao gerar signed URL da empresa:", error + "E" + path);
      return NextResponse.json(
        { error: "Erro ao gerar signed URL", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error("Erro ao processar a requisição:", error);
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
}
