export const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1);
  return date.toLocaleDateString("pt-BR", {
    month: "2-digit",
    year: "numeric",
  });
};
