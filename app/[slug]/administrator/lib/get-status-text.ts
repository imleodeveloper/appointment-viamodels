export const getStatusText = (status: string) => {
  switch (status) {
    case "scheduled":
      return "Agendado";
    case "cancelled":
      return "Cancelado";
    case "completed":
      return "Concluído";
    default:
      return status;
  }
};
