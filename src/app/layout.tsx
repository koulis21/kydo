import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import CookieBanner from '@/components/CookieBanner'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: {
    default: 'Kydo — Φροντίδα με Απόδειξη',
    template: '%s | Kydo',
  },
  description: 'Η πρώτη πλατφόρμα στην Ελλάδα με 100% επαληθευμένους επαγγελματίες κατ\' οίκον φροντίδας. Νοσοκόμες, αποκλειστικές, φυσιοθεραπευτές και περισσότερα.',
  keywords: 'νοσοκόμα, φροντίδα ηλικιωμένων, αποκλειστική, κατ οίκον φροντίδα, Αθήνα, Kydo, home care Greece',
  authors: [{ name: 'Kydo', url: 'https://kydo.gr' }],
  creator: 'Kydo',
  publisher: 'Kydo',
  metadataBase: new URL('https://kydo.gr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'el_GR',
    url: 'https://kydo.gr',
    siteName: 'Kydo',
    title: 'Kydo — Φροντίδα με Απόδειξη',
    description: 'Η πρώτη πλατφόρμα στην Ελλάδα με 100% επαληθευμένους επαγγελματίες κατ\' οίκον φροντίδας.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kydo — Φροντίδα με Απόδειξη',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kydo — Φροντίδα με Απόδειξη',
    description: 'Η πρώτη πλατφόρμα στην Ελλάδα με 100% επαληθευμένους επαγγελματίες κατ\' οίκον φροντίδας.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body>
        <Navbar />
        <main>{children}</main>
        <BottomNav />
        <CookieBanner />
      </body>
    </html>
  )
}