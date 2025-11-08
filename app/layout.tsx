import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeToys.ca - Share the Joy of Christmas',
  description: 'A platform connecting toy donors with families in need during the Christmas season',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

