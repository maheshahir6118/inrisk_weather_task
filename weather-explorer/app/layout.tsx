import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Weather Explorer Dashboard',
    description: 'InRisk Labs Full-Stack Weather Explorer',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-gray-50 text-gray-900 min-h-screen">
                <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </body>
        </html>
    )
}
