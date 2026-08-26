import Image from "next/image";
import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

type Solution = {
  title: string;
  desc: string;
};

const solutionImages = [
  "/images/solution/electric.png",
  "/images/solution/hybrid-series.png",
  "/images/solution/hybrid-parallel.png",
];

export default async function SolutionSection({ locale }: Props) {
  const t = await getTranslations({ locale });
  const solutions = t.raw("solutionsPageContent.solutions") as Solution[];
  const sectionTitle = t("solutionsPageContent.sectionTitle");
  const sectionSubtitle = t("solutionsPageContent.sectionSubtitle");
  const learnMore = t("solutionsPageContent.learnMore");

  return (
    <section
      className="
        w-full
        bg-[#eef8ff]
        py-16
        md:py-20
      "
    >
      <div
        className="
          mx-auto
          max-w-[1280px]
          px-5
          md:px-8
        "
      >
        {/* 标题 */}
        <div
          className="
            text-center
          "
        >
          <h2
            className="
              text-[3rem]
              font-bold
              tracking-wide
              text-[#2463c5]
            "
          >
            {sectionTitle}
          </h2>

          <p
            className="
              mx-auto
              mt-5
              max-w-4xl
              text-base
              font-semibold
              leading-8
              text-[#102a43]
              md:text-xl
            "
          >
            {sectionSubtitle}
          </p>
        </div>

        {/* 卡片列表 */}
        <div
          className="
            mt-14
            grid
            grid-cols-1
            gap-8
            md:grid-cols-2
          "
        >
          {solutions.map((item, index) => (
            <article
              key={item.title}
              className="
                flex
                flex-col
                rounded-2xl
                bg-white
                p-7
                shadow-[0_5px_25px_rgba(0,80,160,0.12)]
                transition
                duration-300
                hover:-translate-y-1
                hover:shadow-xl
              "
            >
              {/* 图片 */}
              <div
                className="
                  relative
                  aspect-[16/9]
                  w-full
                  overflow-hidden
                  bg-[#f4f7fa]
                "
              >
                <Image
                  src={solutionImages[index]}
                  alt={item.title}
                  fill
                  className="
                    object-contain
                    p-5
                  "
                />
              </div>

              {/* 内容 */}
              <div
                className="
                  mt-8
                  flex
                  flex-1
                  flex-col
                "
              >
                <h3
                  className="
                    text-xl
                    font-bold
                    text-[#102a43]
                    md:text-2xl
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    mt-5
                    text-[15px]
                    leading-8
                    text-[#334e68]
                    md:text-base
                  "
                >
                  {item.desc}
                </p>

                {/* 按钮 */}
                <div
                  className="
                    mt-auto
                    pt-8
                  "
                >
                  <button
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-full
                      bg-[#2864c7]
                      px-8
                      py-3
                      text-white
                      shadow-md
                      transition
                      hover:bg-[#174fa8]
                    "
                  >
                    <span>{learnMore}</span>
                    <span className="text-xl">→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
