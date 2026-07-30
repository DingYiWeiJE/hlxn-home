import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import CasesClient from "@/components/CasesClient";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function Cases({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="relative h-[60vh] bg-cover bg-center flex flex-col"
        style={{
          backgroundImage: "url('/images/cases/cases-bg.jpg')",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-[#001524C9] opacity-60"></div>
        <div className="relative flex flex-col h-full">
          <Navigation />
          <div className="flex-1 flex flex-col items-start justify-center">
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                {locale === "zh" ? "应用案例" : "Cases"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full bg-[#eef8ff] py-16 md:py-20">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#2463c5] md:text-4xl">
              {locale === "zh" ? "应用案例" : "Cases"}
            </h2>
          </div>

          <CasesClient locale={locale} />
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
