import { Roboto } from 'next/font/google'
import './globals.css'

const roboto = Roboto({
  variable: '--font-roboto',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
})

export const metadata = {
  title: 'Metadata Search App | Excel Data Filter & Sort Tool',
  description:
    'A powerful Next.js application for searching, filtering, and sorting metadata from Excel files. Supports multi-keyword search, row matching, and fast data analysis.',
  keywords: [
    'Metadata Search',
    'Excel Filter',
    'Excel Search',
    'Data Sorting',
    'Next.js Metadata App',
    'Multi Keyword Search',
    'Excel Row Matching',
  ],
  author: 'Laksmi Santo',
  openGraph: {
    title: 'Metadata Search App | Excel Data Filter & Sort Tool',
    description:
      'Search, filter, and sort Excel metadata efficiently. Multi-keyword matching and row-based data extraction built with Next.js.',
    url: 'https://ls-data-search.vercel.app',
    siteName: 'Metadata Search App',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metadata Search App',
    description:
      'A Next.js tool for smart metadata searching, filtering, and sorting Excel rows.',
  },
  icons: {
    icon: 'icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`}>{children}</body>
    </html>
  )
}
