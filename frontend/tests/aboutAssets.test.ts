// @vitest-environment node

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const expectedAssets = {
  'background-shape.svg': '9a8d64c6a0aa26d4f2d7847f6e20dce4c511401e0a6c6dee4bb192811011075d',
  'dashboard.png': '602b199ae8608270107fb0ab6057c4c8199eb42d06c688423f415b11c8fc9225',
  'emphasis-scribble.svg': '38c2ad4d9155da1d83c57f92d5245c34994a32c77835f47e29ced1e0ee4d3751',
  'macbook-silver.png': '837cc88cf092c40cb771ba27d45232d3566747200e3bf79d2016205728f2ec18',
  'value-divider.svg': 'cd674647784fd76faaf1f5540a1e2415162a3072c05319d48e04474e9bd2b217',
  'vision-divider.svg': '107c1a53e17e1972b966d360fc67a36e74cdee32285fb00c1c1bd05edbe2599b',
} as const

describe('About Figma exports', () => {
  it('pins the six approved local assets by SHA-256 identity', () => {
    for (const [filename, expectedHash] of Object.entries(expectedAssets)) {
      const assetUrl = new URL(`../src/assets/civix/about/${filename}`, import.meta.url)
      const actualHash = createHash('sha256')
        .update(readFileSync(fileURLToPath(assetUrl)))
        .digest('hex')
      expect(actualHash, filename).toBe(expectedHash)
    }
  })
})
