import type { ImgHTMLAttributes } from 'react'

/** Assets in /public/redesign that have a different file for the dark theme
 *  (/public/redesign/dark/<name>.svg). Everything else is shared. */
const DARK_VARIANTS = new Set([
  'android', 'apple', 'apple-finder', 'bash', 'tv', 'wifi', 'windows',
  'check', 'shield', 'loader', 'minus', 'minus-active', 'plus',
  'nav-logo', 'logo',
  'step-phone-1', 'step-phone-2', 'step-phone-3', 'step-notch', 'step-logo', 'step-plus',
  'promo-blob-1', 'promo-blob-2', 'ip/map-pin-marker',
  'pay-mir', 'pay-visa', 'pay-mastercard', 'pay-btc', 'pay-ton', 'pay-eth', 'pay-usdt',
])

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { name: string }

/** SVG asset from /public/redesign that follows the active theme. When a dark
 *  file exists both are rendered and CSS (`.rd-v-light` / `.rd-v-dark`) shows
 *  one, so the right image is there on first paint without waiting for JS. */
export default function RdImg({ name, alt = '', className = '', ...rest }: Props) {
  if (!DARK_VARIANTS.has(name)) {
    return <img src={`/redesign/${name}.svg`} alt={alt} className={className} {...rest} />
  }
  return (
    <>
      <img src={`/redesign/${name}.svg`} alt={alt} className={`rd-v-light ${className}`} {...rest} />
      <img src={`/redesign/dark/${name}.svg`} alt={alt} className={`rd-v-dark ${className}`} loading="lazy" {...rest} />
    </>
  )
}
