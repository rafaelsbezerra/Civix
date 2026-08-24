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
    expect(sources).toEqual(
      expect.arrayContaining([
        expect.stringContaining('background-shape.svg'),
        expect.stringContaining('emphasis-scribble.svg'),
      ]),
    )
    expect(sources.every((source) => !/^https?:/i.test(source))).toBe(true)
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
      '2xl:absolute',
      '2xl:inset-0',
      '2xl:h-[760px]',
    )
    expect(screen.getByTestId('about-laptop')).toHaveClass(
      '2xl:left-[128px]',
      '2xl:top-[247px]',
      '2xl:h-[477px]',
      '2xl:w-[635px]',
    )
  })
})
