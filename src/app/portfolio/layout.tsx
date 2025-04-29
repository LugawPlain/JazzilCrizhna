export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="relative bg-neutral-900 pt-24 min-h-screen">
        {children}
      </div>
    </>
  );
}
