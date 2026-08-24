import backgroundShape from '@/assets/civix/about/background-shape.svg'
import dashboard from '@/assets/civix/about/dashboard.png'
import emphasisScribble from '@/assets/civix/about/emphasis-scribble.svg'
import macbookSilver from '@/assets/civix/about/macbook-silver.png'

/** Composes the decorative notebook artwork from the original Figma exports. */
export function AboutVisual() {
  return (
    <div
      className="pointer-events-none relative mx-auto h-[330px] w-full max-w-[640px] overflow-hidden sm:h-[430px] 2xl:absolute 2xl:inset-0 2xl:h-[760px] 2xl:max-w-none"
      data-testid="about-visual"
    >
      <img
        aria-hidden="true"
        alt=""
        className="absolute -bottom-12 -left-20 w-[280px] rotate-[145.64deg] sm:-bottom-20 sm:-left-24 sm:w-[390px] 2xl:bottom-auto 2xl:left-[-81px] 2xl:top-[382px] 2xl:w-[432px]"
        data-testid="about-background-shape"
        height="432"
        src={backgroundShape}
        width="432"
      />

      <div
        className="absolute left-1/2 top-10 h-[270px] w-[min(92vw,470px)] -translate-x-1/2 sm:top-9 sm:h-[360px] sm:w-[570px] 2xl:left-[128px] 2xl:top-[247px] 2xl:h-[477px] 2xl:w-[635px] 2xl:translate-x-0"
        data-testid="about-laptop"
      >
        <img
          aria-hidden="true"
          alt=""
          className="absolute left-[3.7%] top-[4.2%] h-[86.3%] w-[92.6%] rotate-[6.84deg] object-fill"
          data-testid="about-macbook"
          height="2860"
          src={macbookSilver}
          width="4340"
        />

        <div className="absolute left-[9.85%] top-[11.68%] flex h-[81.45%] w-[80.2%] items-center justify-center overflow-visible">
          <div className="relative h-[86.82%] w-[93.16%] rotate-[6.45deg] overflow-hidden">
            <img
              aria-hidden="true"
              alt=""
              className="absolute -left-[5.53%] -top-[8.69%] h-[117.07%] w-[110.94%] max-w-none"
              data-testid="about-dashboard"
              height="768"
              src={dashboard}
              width="1024"
            />
          </div>
        </div>
      </div>

      <img
        aria-hidden="true"
        alt=""
        className="absolute right-2 top-2 size-[70px] sm:right-0 sm:top-5 sm:size-[90px] 2xl:left-[672px] 2xl:right-auto 2xl:top-[289px] 2xl:size-[104px]"
        data-testid="about-scribble"
        height="104"
        src={emphasisScribble}
        width="104"
      />
    </div>
  )
}
