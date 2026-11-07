import { useEffect, useRef } from 'react';

type HalftoneWordmarkProps = {
  wordmark: string;
};

const DOT_GAP = 6;
const POINTER_RADIUS = 84;
const REST_COLOR = [242, 245, 246] as const;
const WARM_COLOR = [245, 181, 27] as const;

function getDotRadius(coverage: number, gap: number) {
  return Math.sqrt(Math.min(1, Math.max(0, coverage))) * gap * 0.56;
}

function getFittedFontSize(measuredWidth: number, availableWidth: number) {
  return measuredWidth > 0 ? (availableWidth / measuredWidth) * 100 : 0;
}

export function HalftoneWordmark({ wordmark }: HalftoneWordmarkProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;

    if (!root || !canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const rootElement: HTMLDivElement = root;
    const canvasElement: HTMLCanvasElement = canvas;
    const drawingContext: CanvasRenderingContext2D = context;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isInteractive = !reducedMotion && !coarsePointer;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let pointerX = -100_000;
    let pointerY = -100_000;
    let animationFrame = 0;
    let isVisible = true;
    let isAwake = true;
    let dots = new Float32Array(0);
    let dotCount = 0;
    let shockwave = { x: 0, y: 0, startedAt: -1 };
    let isMounted = true;

    function layout() {
      const bounds = rootElement.getBoundingClientRect();

      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvasElement.width = Math.round(width * pixelRatio);
      canvasElement.height = Math.round(height * pixelRatio);

      const mask = document.createElement('canvas');
      const maskContext = mask.getContext('2d', { willReadFrequently: true });

      mask.width = width;
      mask.height = height;

      if (!maskContext) {
        return;
      }

      const fontFamily = getComputedStyle(rootElement).fontFamily;
      const baseFont = `800 100px ${fontFamily}`;

      maskContext.font = baseFont;

      const fittedSize = getFittedFontSize(
        maskContext.measureText(wordmark).width,
        width * 0.98,
      );

      maskContext.font = `800 ${fittedSize}px ${fontFamily}`;
      maskContext.fillStyle = '#000';
      maskContext.textBaseline = 'alphabetic';

      const metrics = maskContext.measureText(wordmark);
      const capHeight = metrics.actualBoundingBoxAscent || fittedSize * 0.72;

      maskContext.fillText(
        wordmark,
        (width - metrics.width) / 2,
        height + capHeight * 0.18,
      );

      const pixels = maskContext.getImageData(0, 0, width, height).data;
      const gap = width < 640 ? DOT_GAP + 1 : DOT_GAP;
      const columns = Math.ceil(width / gap);
      const rows = Math.ceil(height / gap);
      const nextDots: number[] = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          let alpha = 0;

          for (let sampleY = 0; sampleY < 3; sampleY += 1) {
            for (let sampleX = 0; sampleX < 3; sampleX += 1) {
              const x = Math.min(
                width - 1,
                Math.floor(column * gap + ((sampleX + 0.5) * gap) / 3),
              );
              const y = Math.min(
                height - 1,
                Math.floor(row * gap + ((sampleY + 0.5) * gap) / 3),
              );

              alpha += pixels[(y * width + x) * 4 + 3];
            }
          }

          const coverage = alpha / (9 * 255);

          if (coverage < 0.06) {
            continue;
          }

          const homeX = column * gap + gap / 2;
          const homeY = row * gap + gap / 2;

          nextDots.push(homeX, homeY, 0, 0, homeX, homeY, getDotRadius(coverage, gap));
        }
      }

      dots = new Float32Array(nextDots);
      dotCount = nextDots.length / 7;
      isAwake = true;
    }

    function draw(time: number) {
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawingContext.clearRect(0, 0, width, height);

      const shockwaveAge =
        shockwave.startedAt < 0 ? Number.POSITIVE_INFINITY : time - shockwave.startedAt;
      const shockwaveRadius = shockwaveAge * 0.9;
      let isMoving = false;

      for (let index = 0; index < dotCount; index += 1) {
        const offset = index * 7;
        let x = dots[offset];
        let y = dots[offset + 1];
        let velocityX = dots[offset + 2];
        let velocityY = dots[offset + 3];
        const homeX = dots[offset + 4];
        const homeY = dots[offset + 5];

        if (isInteractive) {
          if (shockwaveAge < 900) {
            const deltaX = homeX - shockwave.x;
            const deltaY = homeY - shockwave.y;
            const distance = Math.hypot(deltaX, deltaY) + 0.001;
            const band = 1 - Math.min(1, Math.abs(distance - shockwaveRadius) / 26);

            if (band > 0) {
              const force = band * 3.2 * (1 - shockwaveAge / 900);
              velocityX += (deltaX / distance) * force;
              velocityY += (deltaY / distance) * force;
            }
          }

          const pointerDeltaX = x - pointerX;
          const pointerDeltaY = y - pointerY;
          const pointerDistance = Math.hypot(pointerDeltaX, pointerDeltaY) + 0.001;

          if (pointerDistance < POINTER_RADIUS) {
            const force = (1 - pointerDistance / POINTER_RADIUS) * 2.6;
            velocityX += (pointerDeltaX / pointerDistance) * force;
            velocityY += (pointerDeltaY / pointerDistance) * force;
          }

          velocityX = (velocityX + (homeX - x) * 0.05) * 0.84;
          velocityY = (velocityY + (homeY - y) * 0.05) * 0.84;
          x += velocityX;
          y += velocityY;

          if (
            Math.abs(velocityX) + Math.abs(velocityY) > 0.02 ||
            Math.abs(x - homeX) + Math.abs(y - homeY) > 0.05
          ) {
            isMoving = true;
          } else {
            x = homeX;
            y = homeY;
            velocityX = 0;
            velocityY = 0;
          }

          dots[offset] = x;
          dots[offset + 1] = y;
          dots[offset + 2] = velocityX;
          dots[offset + 3] = velocityY;
        }

        const displacement = Math.min(1, Math.hypot(x - homeX, y - homeY) / 28);
        const red = Math.round(
          REST_COLOR[0] + (WARM_COLOR[0] - REST_COLOR[0]) * displacement,
        );
        const green = Math.round(
          REST_COLOR[1] + (WARM_COLOR[1] - REST_COLOR[1]) * displacement,
        );
        const blue = Math.round(
          REST_COLOR[2] + (WARM_COLOR[2] - REST_COLOR[2]) * displacement,
        );

        drawingContext.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        drawingContext.beginPath();
        drawingContext.arc(x, y, dots[offset + 6], 0, Math.PI * 2);
        drawingContext.fill();
      }

      isAwake = isMoving || shockwaveAge < 900;
    }

    function animate(time: number) {
      animationFrame = 0;

      if (!isVisible) {
        return;
      }

      draw(time);

      if (isAwake) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    function wake() {
      isAwake = true;

      if (!animationFrame && isVisible) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    function getLocalPointer(event: PointerEvent) {
      const bounds = canvasElement.getBoundingClientRect();

      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      const pointer = getLocalPointer(event);

      pointerX = pointer.x;
      pointerY = pointer.y;
      wake();
    }

    function handlePointerLeave() {
      pointerX = -100_000;
      pointerY = -100_000;
      wake();
    }

    function handlePointerDown(event: PointerEvent) {
      const pointer = getLocalPointer(event);

      shockwave = {
        x: pointer.x,
        y: pointer.y,
        startedAt: performance.now(),
      };
      wake();
    }

    layout();
    draw(performance.now());

    if (isInteractive) {
      rootElement.addEventListener('pointermove', handlePointerMove);
      rootElement.addEventListener('pointerleave', handlePointerLeave);
      rootElement.addEventListener('pointerdown', handlePointerDown);
    }

    const resizeObserver = new ResizeObserver(() => {
      layout();
      wake();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true;

      if (isVisible) {
        wake();
      }
    });

    resizeObserver.observe(rootElement);
    intersectionObserver.observe(rootElement);

    document.fonts?.ready.then(() => {
      if (!isMounted) {
        return;
      }

      layout();
      wake();
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      rootElement.removeEventListener('pointermove', handlePointerMove);
      rootElement.removeEventListener('pointerleave', handlePointerLeave);
      rootElement.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [wordmark]);

  return (
    <div ref={rootRef} aria-hidden="true" className="footer-halftone-wordmark">
      <canvas ref={canvasRef} />
    </div>
  );
}
