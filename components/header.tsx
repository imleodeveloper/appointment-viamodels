"use client";

import { Moon, Sun, Calendar, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { slug } = useParams();

  return (
    <header className="w-full bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-0 sm:px-6 lg:px-8">
        <div className="flex justify-center gap-2 md:gap-0 md:justify-between items-center h-16 flex-wrap">
          <Link href={`/${slug}`} className="flex items-center space-x-2">
            {/* <Calendar className="h-8 w-8 text-main-purple" /> */}
            <Image
              src="/new-logo-purple.webp"
              alt="Logo PriveTime - App de Agendamentos"
              width={150}
              height={50}
            />
            {/* <span className="text-xl font-bold text-gray-900 dark:text-white">
              PriveTime
            </span> */}
          </Link>

          <div className="flex items-center space-x-4 flex-wrap">
            <Link href={`${slug}/meus-agendamentos`}>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <Phone className="h-4 w-4 mr-2" />
                Meus Agendamentos
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
