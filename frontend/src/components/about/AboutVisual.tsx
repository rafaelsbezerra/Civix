import backgroundShape from '@/assets/civix/about/background-shape.svg'
import dashboard from '@/assets/civix/about/dashboard.png'
import emphasisScribble from '@/assets/civix/about/emphasis-scribble.svg'
import macbookSilver from '@/assets/civix/about/macbook-silver.png'

/** Composes the decorative notebook artwork from the original Figma exports. */
export function AboutVisual() {
  return (
    <div
      className="pointer-events-none relative mx-auto h-[330px] w-full max-w-[640px] overflow-hidden sm:h-[430px] lg:absolute lg:inset-0 lg:h-[760px] lg:max-w-none"
      data-testid="about-visual"
    >
      <img
        aria-hidden="true"
        alt=""
        className="absolute -bottom-12 -left-20 w-[280px] rotate-[145.64deg] sm:-bottom-20 sm:-left-24 sm:w-[390px] lg:bottom-auto lg:left-[-81px] lg:top-[382px] lg:w-[432px]"
        height="432"
        src={backgroundShape}
        width="432"
      />

      <div
        className="absolute left-1/2 top-10 h-[270px] w-[min(92vw,470px)] -translate-x-1/2 sm:top-9 sm:h-[360px] sm:w-[570px] lg:left-[128px] lg:top-[247px] lg:h-[477px] lg:w-[635px] lg:translate-x-0"
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
        className="absolute right-2 top-2 size-[70px] sm:right-0 sm:top-5 sm:size-[90px] lg:left-[672px] lg:right-auto lg:top-[289px] lg:size-[104px]"
        height="104"
        src={emphasisScribble}
        width="104"
      />
    </div>
  )
}
