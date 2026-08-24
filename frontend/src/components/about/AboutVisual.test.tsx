import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AboutVisual } from './AboutVisual'

describe('AboutVisual', () => {
  it('renders the four original visual assets as decorative images', () => {
    render(<AboutVisual />)

    const visual = screen.getByTestId('about-visual')
    const images = Array.from(visual.querySelectorAll('img'))

    expect(images).toHaveLength(4)
    for (const image of images) {
      expect(image).toHaveAttribute('alt', '')
      expect(image).toHaveAttribute('aria-hidden', 'true')
    }

    const sources = images.map((image) => image.getAttribute('src') ?? '')
    expect(sources).toEqual(
      expect.arrayContaining([
        expect.stringContaining('dashboard.png'),
        expect.stringContaining('macbook-silver.png'),
      ]),
    )
    const inlineVectors = sources
      .filter((source) => source.startsWith('data:image/svg+xml'))
      .map((source) => decodeURIComponent(source))

    expect(inlineVectors).toHaveLength(2)
    expect(inlineVectors.join(' ')).toContain("id='Shape'")
    expect(inlineVectors.join(' ')).toContain('Abstract--Streamline-Variable-Scribbles')
  })

  it('reserves the intrinsic proportions of both raster assets', () => {
    render(<AboutVisual />)

    expect(screen.getByTestId('about-dashboard')).toHaveAttribute('width', '1024')
    expect(screen.getByTestId('about-dashboard')).toHaveAttribute('height', '768')
    expect(screen.getByTestId('about-macbook')).toHaveAttribute('width', '4340')
    expect(screen.getByTestId('about-macbook')).toHaveAttribute('height', '2860')
  })

  it('keeps the reference desktop placement and a bounded mobile frame', () => {
    render(<AboutVisual />)

    expect(screen.getByTestId('about-visual')).toHaveClass(
      'h-[330px]',
      'lg:absolute',
      'lg:inset-0',
      'lg:h-[760px]',
    )
    expect(screen.getByTestId('about-laptop')).toHaveClass(
      'lg:left-[128px]',
      'lg:top-[247px]',
      'lg:h-[477px]',
      'lg:w-[635px]',
    )
  })
})
