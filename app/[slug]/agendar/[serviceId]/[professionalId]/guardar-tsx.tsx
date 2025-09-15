"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { supabase, type Service, type Professional } from "@/lib/supabase";
import { UserBusiness } from "@/app/api/home/check-slug/route";

export default function SelectDateTimePage() {
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const serviceId = params.serviceId as string;
  const professionalId = params.professionalId as string;

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

  // APPOINTMENTS
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [filteredDates, setFilteredDates] = useState<Date[]>([]);

  useEffect(() => {
    handleFetchDates();
  }, [slug]);

  const handleFetchDates = async () => {
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

      setUserBusiness(data.business);
      setLoading(false);
    } catch (error) {
      console.error("Erro interno do servidor:", error);
      alert(
        "Não foi possível encontrar datas e horários. Erro interno do servidor."
      );
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    handleFetchAppointmentsProfessional();
  }, [selectedDate, professionalId]);

  const handleFetchAppointmentsProfessional = async () => {
    if (!selectedDate) return;
    try {
      const response = await fetch(
        "/api/appointments/agendar/fetch-appointments-prof",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professionalId, selectedDate, slug }),
        }
      );

      const data = await response.json();
      const { appointments } = data;
      if (!response.ok) {
        alert(data.message);
        return;
      }

      // Pega os intervalos do dia selecionado
      const weekday = new Date(selectedDate).getDay();
      const intervals = userBusiness.dates_and_times[weekday] || [];

      const available = calculateAvailableTimes(intervals, appointments);
      setAvailableTimes(available);
    } catch (error) {
      console.error("Erro interno do servidor:", error);
      alert(
        "Não será possível realizar agendamentos. Erro interno do servidor."
      );
      setLoading(false);
      return;
    }
  };

  const generateTimeSlots = (start: string, end: string): string[] => {
    const slots: string[] = [];
    let [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    while (
      startHour < endHour ||
      (startHour === endHour && startMinute < endMinute)
    ) {
      const hourString = String(startHour).padStart(2, "0");
      const minString = String(startMinute).padStart(2, "0");
      slots.push(`${hourString}:${minString}`);

      startMinute += 30;
      if (startMinute >= 60) {
        startMinute = 0;
        startHour += 1;
      }
    }

    return slots;
  };

  const calculateAvailableTimes = (
    intervals: { start: string; end: string }[],
    appointments: { appointment_time: string; service_duration: number }[]
  ) => {
    const allSlots: string[] = [];

    // Gera todos os slots de cada intervalo
    intervals.forEach((interval) => {
      allSlots.push(...generateTimeSlots(interval.start, interval.end));
    });

    // bloqueia os horários que já possuem agendamento
    appointments.forEach((appointment) => {
      const [hour, minute] = appointment.appointment_time
        .split(":")
        .map(Number);
      const durationSlots = appointment.service_duration / 30;
      for (let i = 0; i < durationSlots; i++) {
        const slotHour = hour + Math.floor((minute + i * 30) / 60);
        const slotMinute = (minute + i * 30) % 60;
        const slotString = `${String(slotHour).padStart(2, "0")}:${String(
          slotMinute
        ).padStart(2, "0")}`;
        const index = allSlots.indexOf(slotString);
        if (index > -1) allSlots.splice(index, 1);
      }
    });

    return allSlots;
  };

  useEffect(() => {
    if (Object.keys(userBusiness.dates_and_times).length > 0) {
      setFilteredDates(generateAvailableDates());
    }
  }, [userBusiness]);

  const generateAvailableDates = (daysAhead = 21) => {
    const dates: Date[] = [];
    const today = new Date();

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      let jsDay = date.getDay(); // 0 = domingo, 1 = segunda ...
      jsDay = jsDay === 0 ? 7 : jsDay; // converter domingo para 7, segunda = 1...

      if (userBusiness.dates_and_times[jsDay]?.length > 0) {
        dates.push(date);
      }
    }

    return dates;
  };

  // const [allSlots, setAllSlots] = useState<
  //   { time: string; available: boolean }[]
  // >([]);
  // const [service, setService] = useState<Service | null>(null);
  // const [professional, setProfessional] = useState<Professional | null>(null);
  // const [selectedDate, setSelectedDate] = useState<string>("");
  // const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  // const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  // const [filteredDates, setFilteredDates] = useState<Date[]>([]);
  // const [datesAndTimes, setDatesAndTimes] = useState<WeekAvailability>({
  //   1: [],
  //   2: [],
  //   3: [],
  //   4: [],
  //   5: [],
  //   6: [],
  //   7: [],
  // });

  // useEffect(() => {
  //   if (serviceId && professionalId) {
  //     fetchData();
  //   }
  // }, [serviceId, professionalId]);

  // useEffect(() => {
  //   if (selectedDate) {
  //     fetchAvailableTimes();
  //   }
  // }, [selectedDate, professionalId]);

  // // Busca as datas e horários setados pelo admin
  // useEffect(() => {
  //   fetchDatesAndTimes();
  // }, [slug]);

  // // Cálculo de dias do mês existentes pelo informado dos administradores.
  // useEffect(() => {
  //   if (Object.values(datesAndTimes).some((times) => times.length > 0)) {
  //     setFilteredDates(generateAvailableDatesForMonth(15));
  //   }
  // }, [datesAndTimes]);

  // const fetchData = async () => {
  //   try {
  //     // Fetch service
  //     const { data: serviceData, error: serviceError } = await supabase
  //       .from("services")
  //       .select("*")
  //       .eq("id", serviceId)
  //       .single();

  //     if (serviceError) throw serviceError;
  //     setService(serviceData);

  //     // Fetch professional
  //     const { data: professionalData, error: professionalError } =
  //       await supabase
  //         .from("professionals")
  //         .select("*")
  //         .eq("id", professionalId)
  //         .single();

  //     if (professionalError) throw professionalError;
  //     setProfessional(professionalData);
  //   } catch (error) {
  //     console.error("Erro ao carregar dados:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchAvailableTimes = async () => {
  //   try {
  //     // Fetch existing appointments for the selected date and professional
  //     const { data: appointments, error } = await supabase
  //       .from("appointments")
  //       .select("appointment_time")
  //       .eq("professional_id", professionalId)
  //       .eq("appointment_date", selectedDate)
  //       .eq("slug_link", slug)
  //       .eq("status", "scheduled");

  //     if (error) throw error;

  //     // Generate all possible times (9:00 to 18:00, every 30 minutes)
  //     const allTimes = [];
  //     for (let hour = 9; hour < 18; hour++) {
  //       allTimes.push(`${hour.toString().padStart(2, "0")}:00`);
  //       allTimes.push(`${hour.toString().padStart(2, "0")}:30`);
  //     }

  //     // Get booked times
  //     const bookedTimesList =
  //       appointments?.map((apt) => apt.appointment_time) || [];
  //     setBookedTimes(bookedTimesList);

  //     // Filter out booked times for available times
  //     const available = allTimes.filter(
  //       (time) => !bookedTimesList.includes(time)
  //     );

  //     // Filter out past times if selected date is today
  //     const today = new Date();
  //     const isToday = selectedDate === formatDate(today);

  //     /*if (isToday) {
  //       const currentTime = today.getHours() * 60 + today.getMinutes();
  //       const filteredTimes = available.filter((time) => {
  //         const [hours, minutes] = time.split(":").map(Number);
  //         const timeInMinutes = hours * 60 + minutes;
  //         return timeInMinutes > currentTime + 30; // Add 30 minutes buffer
  //       });
  //       setAvailableTimes(filteredTimes);
  //     } else {
  //       setAvailableTimes(available);
  //     } */
  //   } catch (error) {
  //     console.error("Erro ao carregar horários:", error);
  //   }
  // };

  // const fetchDatesAndTimes = async () => {
  //   try {
  //     const response = await fetch("/api/appointments/date-and-time", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ slug }),
  //     });

  //     const data = await response.json();
  //     const { dates_and_times } = data;
  //     if (!response.ok) {
  //       alert("Não foi possível encontrar datas e horários para agendamentos");
  //       return;
  //     }

  //     setDatesAndTimes(dates_and_times);
  //   } catch (error) {
  //     console.error("Erro interno no servidor: ", error);
  //     alert("Erro inesperado no servidor");
  //     return;
  //   }
  // };

  // const generateDates = () => {
  //   const dates: Date[] = [];
  //   const today = new Date();

  //   for (let i = 0; i < 21; i++) {
  //     const date = new Date(today);
  //     date.setDate(today.getDate() + i);
  //     const weekday = date.getDay(); // 0 = domingo ... 6 = sábado
  //     if (datesAndTimes[weekday]?.length > 0) {
  //       dates.push(date);
  //     }
  //   }

  //   return dates;
  // };

  // const generateAvailableDatesForMonth = (daysAhead = 30) => {
  //   const today = new Date();
  //   const result: Date[] = [];

  //   for (let day = 0; day <= daysAhead; day++) {
  //     const date = new Date(today);
  //     date.setDate(today.getDate() + day);

  //     const jsDay = date.getDay();
  //     const convertedDay = jsDay === 0 ? 7 : jsDay;

  //     if (datesAndTimes[convertedDay]?.length > 0) {
  //       result.push(date);
  //     }
  //   }
  //   return result;
  // };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCurrentMonth = () => {
    if (!selectedDate) return "";
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  // const getAllTimes = () => {
  //   const allTimes = [];
  //   for (let hour = 9; hour < 18; hour++) {
  //     allTimes.push(`${hour.toString().padStart(2, "0")}:00`);
  //     allTimes.push(`${hour.toString().padStart(2, "0")}:30`);
  //   }
  //   return allTimes;
  // };

  // const isTimeAvailable = (time: string) => {
  //   return availableTimes.includes(time);
  // };

  // const isTimeBooked = (time: string) => {
  //   return bookedTimes.includes(time);
  // };

  // const isTimePast = (time: string) => {
  //   if (!selectedDate) return false;

  //   const today = new Date();
  //   const isToday = selectedDate === formatDate(today);

  //   if (!isToday) return false;

  //   const currentTime = today.getHours() * 60 + today.getMinutes();
  //   const [hours, minutes] = time.split(":").map(Number);
  //   const timeInMinutes = hours * 60 + minutes;

  //   return timeInMinutes <= currentTime + 30;
  // };

  // const handleTimeSelect = async (time: string) => {
  //   if (!isTimeAvailable(time)) return;

  //   // Duas verificação de disponibilidade antes de continuar
  //   try {
  //     const response = await fetch("/api/appointments/confirm-appointment", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         slug,
  //         serviceId,
  //         professionalId,
  //         selectedDate,
  //         time,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (data.busy) {
  //       alert(
  //         "Este horário está ocupado por outro cliente. Por favor, escolha outro horário."
  //       );
  //       // Refresh available times
  //       fetchAvailableTimes();
  //       return;
  //     }

  //     // Store in sessionStorage for the confirmation page
  //     sessionStorage.setItem(
  //       "appointmentData",
  //       JSON.stringify(data.appointmentData)
  //     );
  //     router.push(`/${slug}/confirmar-agendamento`);
  //   } catch (error) {
  //     console.error("Erro ao verificar disponibilidade:", error);
  //     alert("Erro ao verificar disponibilidade. Tente novamente.");
  //   }
  // };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(formatDate(date));
  };

  // const sortedTimes = (times: string[]) => {
  //   return times.sort((a, b) => {
  //     const [ha, ma] = a.split(":").map(Number);
  //     const [hb, mb] = b.split(":").map(Number);
  //     return ha * 60 + ma - (hb * 60 + mb);
  //   });
  // };

  // function generateTimeSlots(
  //   start: string,
  //   end: string,
  //   duration = 30
  // ): string[] {
  //   const slots: string[] = [];
  //   let [h, m] = start.split(":").map(Number);
  //   const [endH, endM] = end.split(":").map(Number);

  //   while (h < endH || (h === endH && m < endM)) {
  //     slots.push(
  //       `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  //     );
  //     m += duration;
  //     if (m > 60) {
  //       h += 1;
  //       m -= 60;
  //     }
  //   }

  //   return slots;
  // }

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
              Horários Disponíveis - {getCurrentMonth()}
            </h1>
            {/* {service && professional && (
              <div className="text-gray-600 dark:text-gray-400">
                <p>
                  Serviço: <span className="font-medium">{service.name}</span>
                </p>
                <p>
                  Profissional:{" "}
                  <span className="font-medium">{professional.name}</span>
                </p>
              </div>
            )} */}
            <div className="text-gray-600 dark:text-gray-400">
              <p>
                Serviço: <span className="font-medium">Serviço Name</span>
              </p>
              <p>
                Profissional:{" "}
                <span className="font-medium">Profissional Name</span>
              </p>
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
              {filteredDates.map((date) => {
                const dateStr = formatDate(date);
                const isSelected = selectedDate === dateStr;
                const isToday = formatDate(new Date()) === dateStr;

                return (
                  <Button
                    key={dateStr}
                    variant={isSelected ? "default" : "outline"}
                    className={`min-w-[80px] flex-shrink-0 hover:bg-sub-background ${
                      isSelected
                        ? "bg-main-pink text-white hover:bg-main-pink"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    } ${isToday ? "ring-2 ring-pink-300" : ""}`}
                    onClick={() => handleSelectDate(date)}
                  >
                    <div className="text-center">
                      <div className="text-xs opacity-75">
                        {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </div>
                      <div className="font-semibold">{date.getDate()}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Horários - {getCurrentMonth()}
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {availableTimes.map((time) => {
                // const available = isTimeAvailable(time);
                // const booked = isTimeBooked(time);
                // const past = isTimePast(time);
                // const disabled = !available || booked || past;

                return (
                  <Button
                    key={time}
                    variant="outline"
                    // disabled={disabled}
                    // className={`${
                    //   available && !booked && !past
                    //     ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900 border-gray-300 dark:border-gray-600"
                    //     : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-600"
                    // }`}
                    // onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                );
              })}
            </div>

            {availableTimes.length === 0 && (
              <Card className="bg-white dark:bg-gray-800 mt-4">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Não há horários disponíveis para esta data.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
