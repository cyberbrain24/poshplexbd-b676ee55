const KEY = "poshplex.promo.dismissed";

const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const isDismissed = (id: string) => read().includes(id);

export const dismiss = (id: string) => {
  const cur = read();
  if (!cur.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...cur, id]));
  }
};
