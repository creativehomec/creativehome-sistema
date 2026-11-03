export const shortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
