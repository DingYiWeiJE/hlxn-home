import { setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/SiteFooter";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title:
      locale === "zh"
        ? "联系我们 | 汉理楚能"
        : "Contact Us | Hanli Chuneng",
    description:
      locale === "zh"
        ? "联系汉理楚能获取更多信息"
        : "Contact Hanli Chuneng for more information",
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
        <div className="flex min-h-screen flex-col">
          <div
            className="relative h-[60vh] bg-cover bg-center flex flex-col"
            style={{
              backgroundImage: "url('/images/contact/contact-bg.png')",
              backgroundAttachment: "fixed",
            }}
          >
            <div className="absolute inset-0 bg-[#001524C9] opacity-50"></div>
            <div className="relative flex flex-col h-full">
              <Navigation />
              <div className="flex-1 flex flex-col items-start justify-center">
                <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                    联系我们
                  </h1>
                  <p className="text-lg md:text-xl text-white max-w-2xl">
                    阳光、快乐、高效、至善。
                  </p>
                </div>
              </div>
            </div>
          </div>
          <section
      className="
        w-full
        overflow-hidden
        bg-white
      "
    >

      <div
        className="
          grid
          min-h-[520px]
          grid-cols-1
          lg:grid-cols-2
        "
      >


        {/* 图片区域 */}

        <div
          className="
            min-h-[260px]
            bg-cover
            bg-center
            lg:min-h-full
          "
          style={{
            backgroundImage:
              "url('/images/contact/contact-bg.png')",
          }}
        />


        {/* 内容区域 */}

        <div
          className="
            flex
            items-center
            px-6
            py-12
            sm:px-10
            lg:px-20
            xl:px-32
          "
        >

          <div
            className="
              max-w-xl
            "
          >


            <h2
              className="
                text-3xl
                font-bold
                tracking-wide
                text-[#2463c5]
                md:text-4xl
              "
            >
              联系我们
            </h2>



            <div
              className="
                mt-10
                space-y-7
              "
            >


              {/* 地址 */}

              <ContactItem
                icon="📍"
                text="湖北省武汉市武昌区友谊大道与铁机路交汇处北侧武汉中交大厦B座九层"
              />


              {/* 时间 */}

              <ContactItem
                icon="👥"
                text="周一至周五 9:00AM - 6:00PM"
              />



              {/* 电话 */}

              <ContactItem
                icon="☎"
                text="027-86660081（总机）"
              />



              {/* 邮箱 */}

              <ContactItem
                icon="✉"
                text="wuhan@hanlyenergy.com"
              />


            </div>


          </div>


        </div>


      </div>


    </section>
          <Footer locale={locale} />
        </div>
      );
}

function ContactItem({
  icon,
  text,
}:{
  icon:string;
  text:string;
}) {


  return (
    <div
      className="
        flex
        items-start
        gap-4
        text-[#334e68]
      "
    >

      <span
        className="
          mt-1
          flex
          h-6
          w-6
          shrink-0
          items-center
          justify-center
          text-xl
        "
      >
        {icon}
      </span>


      <p
        className="
          text-base
          leading-8
          md:text-lg
        "
      >
        {text}
      </p>


    </div>
  );
}
