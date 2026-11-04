export function getCookie(nome: string): string | undefined {
  const item = document.cookie.split("; ").find((c) => c.startsWith(nome + "="));
  return item ? decodeURIComponent(item.split("=").slice(1).join("=")) : undefined;
}

export function setCookie(nome: string, valor: string, dias = 365) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${nome}=${encodeURIComponent(valor)}; max-age=${dias * 86400}; path=/; SameSite=Lax${secure}`;
}