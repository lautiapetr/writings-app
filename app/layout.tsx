import { Inter } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'WriteMaster AI - Práctica de Writing',
  description: 'Mejora tu inglés con Inteligencia Artificial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}