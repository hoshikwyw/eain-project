/** Receiver pages: no site header, nothing to sign in to. */
export default function GiftLayout({ children }: LayoutProps<"/g">) {
  return (
    <main id="main" className="flex flex-1 flex-col">
      {children}
    </main>
  );
}
