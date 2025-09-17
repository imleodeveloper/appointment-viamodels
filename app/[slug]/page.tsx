"use client";

import { JSX, useEffect, useState } from "react";
import {
  Clock,
  ArrowRight,
  Phone,
  MessageSquareText,
  MapIcon,
  PhoneCall,
  X,
  User,
  Instagram,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { supabase, type Service } from "@/lib/supabase";
import Link from "next/link";
import { QuickSearch } from "@/components/quick-search";
import { RecentAppointments } from "@/components/recent-appointments";
import { Footer } from "@/components/footer";
import { useParams } from "next/navigation";
import { UserBusiness, UserProfile } from "../api/home/check-slug/route";
import Image from "next/image";
import { ProfessionalUser } from "../api/home/fetch-professionals/route";

const daysWeek: Record<number, string> = {
  0: "Segunda-feira",
  1: "Terça-feira",
  2: "Quarta-feira",
  3: "Quinta-feira",
  4: "Sexta-feira",
  5: "Sábado",
  6: "Domingo",
};

type Interval = { start: string; end: string };
type DatesAndTimes = Record<number, Interval[]>;

interface Props {
  datesAndTimes: DatesAndTimes;
}

const ICONS: Record<string, JSX.Element> = {
  instagram: <Instagram className="w-5 h-5 text-pink-500" />,
  site: <Globe className="w-5 h-5 text-blue-500" />,
  onlyfans: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className="w-4 h-4 text-blue-500"
    >
      <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zM256 464c-114.9 0-208-93.1-208-208s93.1-208 208-208 208 93.1 208 208-93.1 208-208 208z" />
    </svg>
  ),
};

export default function HomePage() {
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [information, setInformation] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const { slug } = useParams();
  const [professionals, setProfessionals] = useState<ProfessionalUser[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "",
    email: "",
    full_name: "",
    phone: "",
    slug_link: "",
  });
  const [userBusiness, setUserBusiness] = useState<UserBusiness>({
    business_name: "",
    presentation: "",
    phones: [],
    audience: [],
    links: [],
    dates_and_times: [],
    photo_business: "",
    address: [],
  });

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

      if (!response.ok) {
        alert("Não foi possível verificar agenda. Tente novamente mais tarde.");
        return;
      }
      const data = await response.json();

      if (data.return_link) {
        window.location.href = data.return_link;
      }

      setUserProfile(data.userProfile);
      setUserBusiness(data.business);
    } catch (err) {
      console.error("Não foi possível fazer contato com o servidor. ", err);
    }
  };

  let addressUpdated = "";
  useEffect(() => {
    if (userBusiness.address?.[0]) {
      fetchCEP();
    }
  }, [userBusiness.address?.[0]]);
  const fetchCEP = async () => {
    if (!userBusiness.address?.[0]) return;

    const response = await fetch(
      `https://viacep.com.br/ws/${userBusiness.address?.[0]}/json`
    );

    const data = await response.json();

    if (!response.ok) {
      addressUpdated = "Não foi possível conferir endereço.";
    }

    addressUpdated = `${data.logradouro} ${userBusiness.address?.[1]} - ${data.bairro} - ${data.localidade} - ${data.uf}/${data.cep} `;
    setAddress(addressUpdated);
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
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userProfile.slug_link) return;

    fetchProfessionals();
  }, [userProfile.slug_link]);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/home/fetch-professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: userProfile.slug_link }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        setLoading(false);
        return;
      }

      setProfessionals(data.professionals);
      setLoading(false);
    } catch (error) {
      console.error("Não foi possível encontrar profissionais:", error);
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (!userBusiness || professionals.length === 0 || photosLoaded) return;

    fetchBusinessPhoto();
    fetchProfessionalPhotos();
    setPhotosLoaded(true); // marca que já carregou as fotos
  }, [userBusiness, professionals, photosLoaded]);

  const fetchBusinessPhoto = async () => {
    if (!userBusiness?.photo_business) return;

    const photoPath = userBusiness.photo_business;
    const bucketName = "photos_business";
    const path = photoPath.includes(bucketName)
      ? photoPath.split(`${bucketName}/`)[1]
      : photoPath;

    const response = await fetch("/api/home/fetch-business-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, bucketName }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Erro ao buscar foto da empresa:", data.message);
      alert(data.message);
      return;
    }

    setUserBusiness((prev) => ({
      ...prev,
      photo_business: data.signedUrl || null,
    }));
  };

  const fetchProfessionalPhotos = async () => {
    // Gera signedUrls para todos os profissionais
    const updatedProfessionals = await Promise.all(
      professionals.map(async (prof) => {
        if (!prof.photo_professional) return prof;

        const photoPath = prof.photo_professional;
        const bucketName = "photos_professionals";
        const encodedPath = photoPath.split(`${bucketName}/`)[1];
        const path = decodeURIComponent(encodedPath);

        const response = await fetch("/api/home/fetch-business-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, bucketName }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("Erro ao buscar foto da empresa:", data.message);
          alert(data.message);
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
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden flex justify-start items-center flex-col relative">
      <Header />
      <main className="w-full min-h-screen container px-4 py-8">
        <article className="w-full flex justify-start items-center gap-12 flex-col">
          <div className="w-full flex flex-col md:flex-row justify-start items-start gap-4">
            <div className="flex relative w-40 h-40 overflow-hidden justify-center items-center bg-purple-300 shadow-xl rounded-full">
              {userBusiness.photo_business ? (
                <Image
                  src={userBusiness.photo_business}
                  alt={userBusiness.business_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="w-16 h-16"></User>
              )}
            </div>
            <div className="flex justify-start items-start flex-col gap-3">
              <span className="text-3xl font-bold">
                {userBusiness.business_name
                  ? userBusiness.business_name
                  : "Bem vindo ao PriveTime"}
              </span>
              {userBusiness.presentation && (
                <div>
                  <span className="flex flex-col justify-start items-start max-w-2xl">
                    <strong>Sobre:</strong>
                    {userBusiness.presentation}
                  </span>
                </div>
              )}
              {userBusiness.address && (
                <span className="text-base">{address}</span>
              )}
              <div
                className="flex justify-start items-center gap-2 cursor-pointer hover:text-purple-500"
                onClick={() => setInformation(!information)}
              >
                <MessageSquareText className="w-6 h-6"></MessageSquareText>
                <span className="font-semibold">Informações</span>
              </div>
            </div>
          </div>

          <div className="w-full">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nossos Serviços
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Escolha o serviço desejado e agende seu horário
            </p>
          </div>

          <div className="w-full grid gap-4 md:gap-6">
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
        </article>
      </main>
      <Footer />

      {/* <main className="max-w-5xl min-h-screen mx-auto px-4 py-8"> */}
      {/* Hero Section */}
      {/* <div className="bg-gradient-to-r from-sub-background to-pink-400 py-12 mb-8 "> */}
      {/* <div className="py-12 mb-8 w-full">
        <div className="text-start">
          <h1 className="text-4xl font-bold mb-4 dark:text-black">
            Agende Seu Horário
          </h1>
          <p className="text-xl mb-6 opacity-90 dark:text-black">
            Escolha o serviço desejado e reserve seu horário de forma rápida e
            fácil
          </p>
        </div>
      </div> */}

      {/* Quick Search */}
      {/* <div className="mb-8 max-w-4xl mx-auto">
        <QuickSearch />
      </div> */}

      {/* Recent Appointments */}
      {/* <div className="mb-8 max-w-4xl mx-auto">
          <RecentAppointments />
        </div>

        

      {/* {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum serviço disponível no momento.
            </p>
          </div>
        )} */}
      {/* </main> */}
      <div
        className={`${
          information ? "visible" : "hidden"
        } fixed top-0 left-0 w-full h-screen py-4 flex justify-center items-center bg-black/50 z-10`}
      >
        <div className="w-full px-6 py-12 md:max-w-3xl h-[90%] flex flex-col gap-4 justify-start items-start relative overflow-y-auto bg-white dark:bg-gray-900 rounded-md shadow-xl">
          <span className="text-3xl font-semibold">Informações</span>
          {userBusiness.address && (
            <div className="flex justify-center items-center gap-4">
              <MapIcon className="w-5 h-5"></MapIcon>
              <span>{address}</span>
            </div>
          )}
          <div className="w-full min-h-64 rounded-md overflow-hidden bg-gray-600 shadow-sm"></div>
          <div className="w-full grid grid-cols-2 gap-4">
            <div className="grid grid-cols-1 gap-6">
              {userBusiness.phones && (
                <div className="w-full flex flex-col justify-center items-start gap-4">
                  <span className="text-xl font-semibold text-main-purple">
                    {userBusiness.phones.length > 1 ? "Contatos" : "Contato"}
                  </span>
                  {userBusiness.phones &&
                    userBusiness.phones.map((phone, index) => (
                      <div
                        className="flex justify-center items-center gap-4"
                        key={index}
                      >
                        <PhoneCall className="w-5 h-5"></PhoneCall>
                        <span>{phone}</span>
                      </div>
                    ))}
                </div>
              )}
              {userBusiness.dates_and_times && (
                <div className="w-full flex flex-col justify-center items-start gap-4">
                  <span className="text-xl font-semibold text-main-purple">
                    Horários de Atendimento
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-8">
                    {Object.entries(daysWeek).map(([dayIndex, dayName]) => {
                      const intervals =
                        (userBusiness.dates_and_times as DatesAndTimes)?.[
                          Number(dayIndex)
                        ] || [];

                      if (!intervals || intervals.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={dayIndex}
                          className="w-full flex flex-col justify-center items-start"
                        >
                          <span className="font-semibold">{dayName}</span>
                          <ul>
                            {intervals.map((interval, i) => (
                              <li key={i}>
                                {interval.start} - {interval.end}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full flex flex-col justify-start items-start gap-4">
              {professionals && (
                <div className="w-full flex flex-col justify-start items-start gap-2">
                  <span className="text-xl font-semibold text-main-purple">
                    Profissionais
                  </span>
                  <div className="w-full grid grid-cols-3 gap-3">
                    {professionals.map((prof, index) => (
                      <div
                        className="flex flex-col justify-center items-center w-full"
                        key={index}
                      >
                        <Image
                          src={prof.photo_professional || "/default-avatar.png"}
                          alt={prof.name}
                          width={100}
                          height={100}
                          className="rounded-full shadow-xl"
                        />
                        <div className="flex flex-col justify-center items-center gap-1">
                          <p className="font-semibold">{prof.name}</p>
                          <p className="text-sm text-gray-500">{prof.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {userBusiness.links && (
                <div className="w-full flex flex-col justify-start items-start gap-2">
                  <span className="text-xl font-semibold text-main-purple">
                    Links
                  </span>
                  <div className="w-full flex flex-col justify-start items-start gap-2">
                    {userBusiness.links.map((link, index) => {
                      const linkHasAtSymbol = link.includes("@");
                      let l = link;
                      let icon = "";
                      if (linkHasAtSymbol) {
                        l = `https://www.instagram.com/${l.replace(/@/g, "")}`;
                        icon = "instagram";
                      }
                      const linkHasOnlyFans = l.includes("onlyfans.com");
                      if (linkHasOnlyFans) {
                        icon = "onlyfans";
                      }
                      if (!linkHasAtSymbol && !linkHasOnlyFans) {
                        icon = "site";
                      }
                      return (
                        <a
                          key={index}
                          href={l}
                          target="_blank"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
                        >
                          {ICONS[icon]}
                          {l}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            className="absolute shadow-xl p-1 top-3 right-3 flex justify-center items-center cursor-pointer rounded-full bg-main-purple hover:bg-red-600 text-white"
            onClick={() => setInformation(false)}
          >
            <X className="w-6 h-6"></X>
          </div>
        </div>
      </div>
    </div>
  );
}
