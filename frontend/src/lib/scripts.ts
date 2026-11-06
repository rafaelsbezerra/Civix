const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export function loadAnalytics() {
  if (!GA_ID || document.getElementById("ga-script")) return;

  const s = document.createElement("script");
  s.id = "ga-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];

  // O GA exige que o dataLayer receba o objeto "arguments", não um array.
  // Por isso a função é declarada sem parâmetros e usa "arguments".
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }

  // @ts-expect-error: o gtag aceita argumentos via "arguments"
  gtag("js", new Date());
  // @ts-expect-error: idem
  gtag("config", GA_ID, { anonymize_ip: true });
}

export function loadMarketing() {
  // Meta Pixel, Google Ads etc. entram aqui
}