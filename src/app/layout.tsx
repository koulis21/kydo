import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import CookieBanner from '@/components/CookieBanner'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Kydo — Φροντίδα με Απόδειξη',
  description: "Η πρώτη πλατφόρμα στην Ελλάδα με 100% επαληθευμένους επαγγελματίες κατ' οίκον φροντίδας.",
  keywords: 'νοσοκόμα, φροντίδα ηλικιωμένων, αποκλειστική, κατ οίκον φροντίδα, Αθήνα',
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