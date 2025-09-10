"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { supabase, type Service } from "@/lib/supabase";
import Link from "next/link";
import { QuickSearch } from "@/components/quick-search";
import { RecentAppointments } from "@/components/recent-appointments";
import { Footer } from "@/components/footer";
import { useParams } from "next/navigation";

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams();

  useEffect(() => {
    checkSlug();
    slugHasPlan();
    fetchServices();
    // Auto-complete past appointments when page loads
    autoCompletePastAppointments();
  }, []);

  // Checa se o slug do url existe, se não existir, manda para o privtime site
  const checkSlug = async () => {
    try {
      const response = await fetch("/api/home/check-slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slug),
      });

      const data = await response.json();

      if (data.return_link) {
        window.location.href = data.return_link;
      }
    } catch (err) {
      console.error("Não foi possível fazer contato com o servidor. ", err);
    }
  };

  // Checa se o slug existente, possuí plano ativo ou expirado
  const slugHasPlan = async () => {
    try {
      const response = await fetch("/api/home/check-slug/check-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slug),
      });

      const data = await response.json();
      console.log(data);

      if (data.notAuthorized) {
        alert(data.notAuthorized);
        setTimeout(() => {
          window.location.href = "https://privetime.viamodels.com.br/";
        }, 2000);
        return;
      }
    } catch (error) {
      console.error("Erro interno no servidor: ", error);
    }
  };

  const autoCompletePastAppointments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("status", "scheduled")
        .lt("appointment_date", today);

      if (error) {
        console.error("Erro ao finalizar agendamentos passados:", error);
      }
    } catch (error) {
      console.error("Erro ao finalizar agendamentos passados:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/home/fetch-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Não foi possível fazer a busca de serviços.");
        return;
      }
      setServices(data.services || []);
      console.log("DATA: ", data);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h:${remainingMinutes.toString().padStart(2, "0")}min`
      : `${hours}h:00min`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Carregando serviços...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-sub-background to-pink-400 py-12 mb-8 ">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 dark:text-black">
            Agende Seu Horário
          </h1>
          <p className="text-xl mb-6 opacity-90 dark:text-black">
            Escolha o serviço desejado e reserve seu horário de forma rápida e
            fácil
          </p>
          <div className="flex justify-center space-x-4">
            <Link href={`/${slug}/meus-agendamentos`}>
              <Button
                variant="outline"
                className="bg-white text-main-purple hover:bg-gray-100 border-white dark:hover:bg-gray-400 dark:hover:text-black"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ver Meus Agendamentos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mb-8 max-w-4xl mx-auto">
        <QuickSearch />
      </div>

      {/* Recent Appointments */}
      <div className="mb-8 max-w-4xl mx-auto">
        <RecentAppointments />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nossos Serviços
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Escolha o serviço desejado e agende seu horário
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {service.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(service.duration_minutes)}
                      </div>
                      {service.price && (
                        <div className="font-medium text-green-600 dark:text-green-400">
                          {formatPrice(service.price)}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/${slug}/agendar/${service.id}`}>
                    <Button className="bg-main-purple hover:bg-sub-background text-white hover:text-black">
                      Reservar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum serviço disponível no momento.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
