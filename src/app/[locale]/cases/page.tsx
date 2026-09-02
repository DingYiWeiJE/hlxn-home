import Footer from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
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
      <PageHero
        location="APPLICATION_CASES"
        fallbackImage="/images/cases/cases-bg.jpg"
        title={locale === "zh" ? "应用案例" : "Cases"}
        overlayClassName="bg-[#001524C9] opacity-60"
      />

      <section className="w-full bg-[#eef8ff] py-16 md:py-20">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8">

          <CasesClient locale={locale} />
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
