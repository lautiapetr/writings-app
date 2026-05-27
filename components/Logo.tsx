import Image from 'next/image'
import Link from 'next/link'
import logoSrc from '../logo/writtingsAppLogo.png'

type Props = {
  size?: number
  showText?: boolean
}

export default function Logo({ size = 40, showText = true }: Props) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Ir al inicio">
      <Image src={logoSrc} alt="WriteMaster AI" width={size} height={size} priority />
      {showText && <span className="text-2xl font-bold text-[#2563EB]">WriteMaster AI</span>}
    </Link>
  )
}
