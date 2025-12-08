import './globals.css';
import { Providers } from '../components/Providers';

export const metadata = {
  title: 'DaanaRX - Medication Tracking System',
  description: 'HIPAA-compliant medication tracking for non-profit clinics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
