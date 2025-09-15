"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { useParams, useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

type TimeRange = {
  start: string;
  end: string;
};

type WeekAvailability = {
  [key: number]: TimeRange[];
};

export default function SelectDateTimePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const [datesAndTimes, setDatesAndTimes] = useState<WeekAvailability | null>(
    null
  );
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [nameProfessional, setNameProfessional] = useState<string>("");
  const [infoService, setInfoService] = useState({
    name: "",
    duration_minutes: "",
  });
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const slug = params.slug as string;
  const serviceId = params.serviceId as string;
  const professionalId = params.professionalId as string;

  useEffect(() => {
    fetchDatesAndTimes();
  }, [slug]);
  const fetchDatesAndTimes = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const response = await fetch(
        "/api/appointments/agendar/fetch-dates-and-time",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        setLoading(false);
        return;
      }

      setDatesAndTimes(data.datesAndTimes.dates_and_times);
    } catch (error) {
      console.error(
        "Não foi possível buscar datas e horários de agendamento:",
        error
      );
      alert("Não foi possível encontrar datas e horários de agendamento.");
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!professionalId) return;

    fetchProfessional();
  }, [professionalId]);

  const fetchProfessional = async () => {
    if (!professionalId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("professionals")
        .select("name")
        .eq("id", professionalId)
        .single();

      if (error) {
        alert("Esse profissional não existe mais.");
        return;
      }

      setNameProfessional(data.name);
      setLoading(false);
    } catch (error) {
      alert("Não foi possível buscar profissional, erro interno do servidor");
      console.error("Erro interno do servidor: ", error);
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (!serviceId) return;

    fetchService();
  }, [serviceId]);
  const fetchService = async () => {
    if (!serviceId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("services")
        .select(`name, duration_minutes`)
        .eq("id", serviceId)
        .single();

      if (error) {
        console.error("Não foi possível encontrar serviço:", error);
        alert("Não foi possível encontrar serviço, tente novamente.");
        setLoading(false);
        return;
      }

      setInfoService({
        name: data.name,
        duration_minutes: data.duration_minutes,
      });
      setLoading(false);
    } catch (error) {
      alert("Não foi possível buscar serviço, erro interno do servidor");
      console.error("Erro interno do servidor: ", error);
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (!selectedDate || !professionalId) return;

    fetchBooked();
  }, [selectedDate, professionalId]);

  const handleTimeSelect = async (timeSelect: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/appointments/agendar/handle-time-select",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDate,
            professionalId,
            timeSelect,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error(
        "Não foi possível fazer o agendamento em sistema, erro interno:",
        error
      );
      alert("Não foi possível fazer o agendamento em sistema, erro interno.");
      setLoading(false);
      return;
    }
  };

  const fetchBooked = async () => {
    if (!selectedDate || !professionalId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/appointments/agendar/fetch-booked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, professionalId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        setLoading(false);
        return;
      }

      setBookedTimes(data.bookedTimes);
      setLoading(false);
    } catch (error) {
      console.error("Erro agendamentos:", error);
      alert(
        "Erro interno, não foi possível verificar agendamentos disponíveis."
      );
      setLoading(false);
      return;
    }
  };

  const getAvailableTimes = (
    timeSlots: string[],
    bookedTimes: string[],
    serviceDuration: number
  ) => {
    const available: string[] = [];

    for (let i = 0; i < timeSlots.length; i++) {
      const slotStart = timeSlots[i];
      const [slotHour, slotMinute] = slotStart.split(":").map(Number);
      const slotStartMinutes = slotHour * 60 + slotMinute;
      const slotEndMinutes = slotStartMinutes + serviceDuration;

      // verifica se algum bookedTime interfere nesse período
      let conflict = false;
      for (const booked of bookedTimes) {
        const [bookedHour, bookedMinute] = booked.split(":").map(Number);
        const bookedStart = bookedHour * 60 + bookedMinute;
        const bookedEnd = bookedStart + serviceDuration;

        if (
          (slotStartMinutes >= bookedStart && slotStartMinutes < bookedEnd) ||
          (slotEndMinutes > bookedStart && slotEndMinutes <= bookedEnd) ||
          (slotStartMinutes <= bookedStart && slotEndMinutes >= bookedEnd)
        ) {
          conflict = true;
          break;
        }
      }
      if (!conflict) available.push(slotStart);
    }
    return available;
  };

  function getNext15Days(datesAndTimes: WeekAvailability) {
    const days: { date: Date; hasAvailability: boolean }[] = [];

    for (let i = 0; i < 15; i++) {
      const date = addDays(new Date(), i);
      const jsDay = date.getDay();
      const daysOnWeek = jsDay === 0 ? 6 : jsDay - 1;
      const hasAvailability = (datesAndTimes[daysOnWeek] ?? []).length > 0;
      days.push({ date, hasAvailability });
    }

    return days;
  }
  const days = getNext15Days(datesAndTimes ?? {});

  useEffect(() => {
    if (!selectedDate || !datesAndTimes) return;

    const jsDay = selectedDate.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
    const intervals = datesAndTimes[dayOfWeek];

    const slots: string[] = [];
    intervals.forEach(({ start, end }) => {
      slots.push(...generateTimeSlots(start, end));
    });

    setTimeSlots(slots);
  }, [selectedDate, datesAndTimes]);

  const generateTimeSlots = (start: string, end: string, stepMinutes = 30) => {
    const slots: string[] = [];
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    let current = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (current < endMinutes) {
      const hour = Math.floor(current / 60)
        .toString()
        .padStart(2, "0");
      const minute = (current % 60).toString().padStart(2, "0");
      slots.push(`${hour}:${minute}`);
      current += stepMinutes;
    }

    return slots;
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
              Horários Disponíveis -{" "}
              {selectedDate
                ? format(selectedDate, "d ' - ' MMMM", { locale: ptBR })
                : ""}
            </h1>
            <div className="text-gray-600 dark:text-gray-400">
              {infoService && (
                <p>
                  Serviço:{" "}
                  <span className="font-medium text-purple-500">
                    {infoService.name}
                  </span>
                </p>
              )}
              {nameProfessional && (
                <p>
                  Profissional:{" "}
                  <span className="font-medium text-purple-500">
                    {nameProfessional}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Selecione a Data
          </h2>

          <div className="overflow-x-auto">
            <div className="flex space-x-3 pb-4">
              {days.map((day, index) => (
                <Button
                  key={index}
                  disabled={!day.hasAvailability}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-w-[80px] flex-shrink-0 ${
                    selectedDate?.toDateString() === day.date.toDateString()
                      ? "bg-main-purple text-white hover:bg-main-pink"
                      : "text-black border border-purple-400 bg-white hover:bg-sub-background"
                  }  `}
                >
                  <div className="text-center">
                    <div className="text-xs opacity-75">
                      {format(day.date, "EEE", { locale: ptBR })}
                    </div>
                    <div className="font-semibold">
                      {format(day.date, "d'/'MM")}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Horários -
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {timeSlots.map((time) => {
              const isBooked = bookedTimes.includes(time);
              return (
                <Button
                  variant="outline"
                  key={time}
                  className={`${
                    isBooked
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "hover:bg-main-purple hover:text-white"
                  }`}
                  onClick={() => handleTimeSelect(time)}
                  disabled={isBooked}
                >
                  {time}
                </Button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
