"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { supabase, type Service, type Professional } from "@/lib/supabase";
import Image from "next/image";

interface ProfessionalUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photo_professional: string | null;
  active: boolean;
}

export default function SelectProfessionalPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const slug = params.slug as string;

  const [service, setService] = useState<Service | null>(null);
  // const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      fetchData();
    }
  }, [serviceId]);

  const fetchData = async () => {
    try {
      // Fetch service
      const responseService = await fetch("/api/home/agendar/fetch-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, slug }),
      });

      /*const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();*/
      const serviceData = await responseService.json();
      //console.log(serviceData);
      if (!responseService.ok) {
        console.log("Erro ao buscar serviço.");
      }
      setService(serviceData);

      // Fetch professionals
      const responseProfessional = await fetch(
        "/api/home/agendar/fetch-professional",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId, slug }),
        }
      );
      const dataProfessional = await responseProfessional.json();
      //console.log("DataProfessional: ", dataProfessional);
      if (!responseProfessional.ok) {
        console.log("Profissional não encontrado.");
      }
      setProfessionals(dataProfessional.professionalsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (professionals.length === 0 || photosLoaded) return;

    const fetchPhotos = async () => {
      await fetchProfessionalPhotos();
      setPhotosLoaded(true); // marca que já carregou as fotos
    };

    fetchPhotos();
  }, [professionals, photosLoaded]);

  const fetchProfessionalPhotos = async () => {
    // Gera signedUrls para todos os profissionais
    const updatedProfessionals = await Promise.all(
      professionals.map(async (prof) => {
        if (!prof.photo_professional) return prof;

        const photoPath = prof.photo_professional;
        const bucketName = "photos_professionals";
        const encodedPath = photoPath.split(`${bucketName}/`)[1];
        const path = decodeURIComponent(encodedPath);

        const { data, error } = await supabase.storage
          .from("photos_professionals")
          .createSignedUrl(path, 60 * 60);

        if (error) {
          console.error("Erro ao gerar signed URL:", error);
          return prof;
        }

        return {
          ...prof,
          photo_professional: data?.signedUrl || null,
        };
      })
    );

    setProfessionals(updatedProfessionals);
  };

  const handleSelectProfessional = (professionalId: string) => {
    router.push(`/${slug}/agendar/${serviceId}/${professionalId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main-purple mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Carregando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Selecione o Profissional
            </h1>
            {service && (
              <p className="text-gray-600 dark:text-gray-400">
                Serviço: <span className="font-medium">{service.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <Card
              key={professional.id}
              className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectProfessional(professional.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 relative bg-pink-100 dark:bg-pink-100 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4">
                  {professional.photo_professional ? (
                    <Image
                      src={professional.photo_professional}
                      alt={professional.name}
                      fill
                    />
                  ) : (
                    <User className="h-8 w-8 text-main-purple dark:text-main-purple" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {professional.name}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {professionals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum profissional disponível no momento.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
