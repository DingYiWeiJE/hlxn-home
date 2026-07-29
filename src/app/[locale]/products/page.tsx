import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";
import ProductCatalog from "../../../components/admin/products/ProductCatalog";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "产品中心 | 汉理楚能" : "Products | Hanli Chuneng",
    description:
      locale === "zh"
        ? "了解汉理楚能的产品解决方案"
        : "Explore Hanli Chuneng's product solutions",
  };
}

const productsContents = [
  {
    title: "船/岸光储充放系列产品",
    desc: "针对内河、近海船舶航行储能、旅游观光、停泊靠岸、农林渔业、应急供电、港口码头岸基能源等运用场景。提供船用光伏储能、生活供电、应急电源、充电放电与船岸一体化零碳能源存储和补给方案，支持智能充放电管理，实现船舶自发自用，港口绿电供给，降低船舶靠港能耗成本。",
  },
  {
    title: "燃料供应系列产品",
    desc: "针对内河 / 近海 / 远洋船舶的新建与改造，提供燃料供应系统模块（含甲醇动力船、氢动力示范船、氨动力船及多燃料混动船）。覆盖甲醇 / 氢 / 氨全品类零碳燃料的船用“储运—输送—供给—回收”安全解决方案，适配不同动力路线的船舶零碳需求。",
  },
  {
    title: "混合动力系列产品",
    desc: "针对多能源协同的船舶低碳 / 零碳动力总成方案提供，覆盖船舶“短途高频→中长途续航→特殊作业”全场景，精准适配不同船型的动力需求。混合动力系统有串联式、并联式、混联式三种形式，可通过多种能源与动力形式的组合使用，适配不同运用场景。提高船舶经济性和灵活性，降低船舶能耗和排放。",
  },
  {
    title: "船/岸能量控制系列产品",
    desc: "针对船用配电系统（直流＋交流配电柜）、港口码头岸电桩、船舶岸电接入装置。船舶电力系统的“能源分配中枢”，为船舶推进系统、储能设备、用电终端提供安全、高效的电力分配与管控解决方案与船舶靠港岸电接入、电力智能管理方案。",
  },
];

function ProductsContent({ locale }: { locale: string }) {
  const t = useTranslations();
  const page = t.raw("productsPage");

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="relative h-[60vh] bg-cover bg-center flex flex-col"
        style={{
          backgroundImage: "url('/images/products/product_bg.jpg')",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-[#001524C9] opacity-50"></div>
        <div className="relative flex flex-col h-full">
          <Navigation />
          <div className="flex-1 flex flex-col items-start justify-center">
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                产品中心
              </h1>
              <p className="text-lg md:text-xl text-white max-w-2xl">
                面向绿色船舶领域的零污染、高效能、多防护的能源解决方案。
              </p>
            </div>
          </div>
        </div>
      </div>
      <main>
        <section className="bg-[#eaf7ff] py-20 lg:py-28">
          <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8">
            <h1 className="mb-6 md:mb-8 text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide text-[#2365c4]">
              产品简介
            </h1>

            <div className="space-y-4 md:space-y-6 text-sm md:text-base leading-[1.8] text-[#1f3448] lg:max-w-[500px]">
              {[
                `我们的核心产品与服务贯穿绿色船舶动力总成集成、多燃料混合动力发动机整机研发、多燃料供给系统及船用储能系统等关键领域，具备甲醇、氨、氢等多元清洁燃料的发动机适配能力，可推动船舶动力从传统燃料向低碳及零碳能源平稳过渡。凭借模块化、集成化的系统设计优势，结合国际化技术团队的专业积淀与本土化落地经验，我们能够针对不同船型、运营场景及环保需求，为客户量身定制定制化、高性能、高可靠性的全栈式动力解决方案。`,
                `在 “双碳” 目标与全球航运绿色转型的浪潮下，汉理新能以技术创新为核心驱动力，积极响应国家绿色航运政策，助力船东与船企从容应对日益严格的环保法规，持续为中国乃至全球内河及近海航运的低碳化、零碳化转型赋能，致力于成为全球领先的船舶新能源动力系统整体解决方案提供者与行业变革的核心推动力量。`,
              ].map((intro, index) => (
                <p key={index}>{intro}</p>
              ))}
            </div>
          </div>

          
        </section>

        <section className="w-full bg-white">
            <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-8 lg:py-20">
              {/* title */}
              <h2
                className="
            text-center
            text-[32px]
            font-bold
            tracking-[2px]
            text-[#2463c5]
            md:text-[40px]
          "
              >
                主营系列产品
              </h2>

              {/* products */}
              <div
                className="
            mt-12
            grid
            grid-cols-1
            gap-x-20
            gap-y-12
            md:grid-cols-2
            md:gap-y-14
          "
              >
                {productsContents.map((item) => (
                  <article
                    key={item.title}
                    className="
                border-t
                border-[#e5e7eb]
                pt-10
              "
                  >
                    <h3
                      className="
                  text-[22px]
                  font-bold
                  leading-tight
                  text-[#102a43]
                  md:text-[26px]
                "
                    >
                      {item.title}
                    </h3>

                    <p
                      className="
                  mt-7
                  text-[15px]
                  leading-[2]
                  text-[#34495e]
                  md:text-[16px]
                "
                    >
                      {item.desc}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <ProductCatalog/>
          <div
        className="h-[350px] relative bg-cover bg-center flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/images/products/dy.jpg')",
        }}
      >
        {/* 遮罩 */}
        <div className="absolute inset-0" style={{ backgroundColor: '#1A589BA6' }}></div>

        {/* 内容层 */}
        <div className="relative flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-[2.25rem] font-bold text-white">下载产品单页</h2>
          <a
            href="#"
            className="
              inline-flex items-center gap-3
              rounded-full bg-white
              px-7 py-3
              text-base font-medium text-slate-600
              shadow-sm
              transition-all duration-200
              hover:opacity-90 hover:shadow-md
            "
          >
            <span>{t("focusSection.moreText")}</span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>


        <div
        className="h-[350px] relative bg-cover bg-center flex flex-col items-center justify-center"
        style={{
          backgroundImage: "url('/images/products/yj.jpg')",
        }}
      >
        {/* 遮罩 */}
        <div className="absolute inset-0" style={{ backgroundColor: '#1A589BA6' }}></div>

        {/* 内容层 */}
        <div className="relative flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-[2.25rem] font-bold text-white">下载企业画册</h2>
          <a
            href="#"
            className="
              inline-flex items-center gap-3
              rounded-full bg-white
              px-7 py-3
              text-base font-medium text-slate-600
              shadow-sm
              transition-all duration-200
              hover:opacity-90 hover:shadow-md
            "
          >
            <span>{t("focusSection.moreText")}</span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>

      </main>

      <Footer locale={locale} />
    </div>
  );
}

export default async function Products({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductsContent locale={locale} />;
}
