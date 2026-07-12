
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Assam Tourist Guide',
  description: 'Explore the lush beauty and rich culture of Assam',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex justify-center items-start md:items-center">
        <div className="w-full max-w-md h-screen md:h-[844px] bg-background shadow-2xl relative overflow-hidden md:rounded-[3rem] border-[8px] border-primary/10">
          {children}
        </div>
      </body>
    </html>
  );
}
