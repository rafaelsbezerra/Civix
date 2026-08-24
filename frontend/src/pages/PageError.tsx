import { ArrowLeft, ArrowRight, Headphones } from "lucide-react";
import laptop404 from "../assets/civix/404_page.png";

export default function NotFound() {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#f8f7f4] text-[#102846]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-8 py-8 sm:px-12 lg:px-16">

        <header className="flex items-center">
          <div className="flex items-center gap-2 text-[24px] font-semibold tracking-[-0.03em]">
            <div className="flex items-center gap-[3px]">
              <span className="block h-6 w-[5px] -skew-x-[20deg] bg-[#f5b51b]" />
              <span className="block h-6 w-[5px] -skew-x-[20deg] bg-[#102846]" />
            </div>
            <span>Civix</span>
          </div>
        </header>

        <section className="relative flex flex-1 items-center">
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full border-[80px] border-[#f2e8ce] opacity-90" />

          <div className="relative z-10 grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-4">

            <div className="max-w-[570px] pl-2 sm:pl-8 lg:pl-12">
              <div className="mb-7 flex items-center gap-1 text-[15px] font-medium">
                <span className="text-[#f5b51b]">//</span>
                <span>Página não encontrada</span>
              </div>

              <h1 className="text-[130px] font-medium leading-[0.8] tracking-[-0.08em] sm:text-[170px] lg:text-[190px]">
                404
              </h1>

              <h2 className="mt-10 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                Ops! Página não encontrada.
              </h2>

              <p className="mt-5 max-w-[500px] text-base leading-7 text-[#64748b] sm:text-lg">
                A página que você está procurando pode ter sido
                movida, excluída ou nunca existiu.
                <br />
                Mas não se preocupe, vamos te ajudar a encontrar
                o que você precisa.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => window.history.back()}
                  className="group flex h-14 items-center justify-center gap-4 rounded-lg bg-[#102846] px-7 text-[15px] font-medium text-white transition-all duration-200 hover:bg-[#18395f]"
                >
                  <ArrowLeft
                    size={20}
                    strokeWidth={1.8}
                    className="transition-transform duration-200 group-hover:-translate-x-1"
                  />
                  Voltar para o início
                </button>

              </div>
            </div>

            <div className="relative flex min-h-[400px] items-center justify-center lg:min-h-[560px]">

              <div className="absolute left-[15%] top-[15%] h-[260px] w-[260px] rounded-full border border-dashed border-[#102846] opacity-90" />

              <div className="absolute right-[10%] top-[20%] flex gap-2">
                <span className="h-7 w-[3px] rotate-[28deg] rounded-full bg-[#102846]" />
                <span className="h-5 w-[3px] rotate-[48deg] rounded-full bg-[#102846]" />
                <span className="h-3 w-[3px] rotate-[72deg] rounded-full bg-[#102846]" />
              </div>

              <div className="relative z-10 w-[85%] max-w-[680px] rotate-[4deg]">
                <img
                  src={laptop404}
                  alt="Página não encontrada"
                  className="w-full object-contain drop-shadow-[0_25px_30px_rgba(16,40,70,0.12)]"
                />
              </div>

              <div className="absolute bottom-[17%] right-[15%] h-4 w-4 rounded-full bg-[#f5b51b]" />
              <div className="absolute bottom-[21%] right-[12%] h-2 w-2 rounded-full bg-[#102846]" />
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-[#deddd9] pt-7">
          <div className="flex items-center gap-5 pl-8 sm:pl-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6e9c9]">
              <Headphones
                size={23}
                strokeWidth={1.7}
                className="text-[#102846]"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[15px] font-medium">
                Precisa de ajuda?
              </span>
              <span className="text-[15px]">
                Fale com nosso suporte
              </span>
            </div>

            <button
              aria-label="Falar com suporte"
              className="ml-4 transition-transform duration-200 hover:translate-x-1"
            >
              <ArrowRight
                size={25}
                strokeWidth={1.6}
                className="text-[#102846]"
              />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}