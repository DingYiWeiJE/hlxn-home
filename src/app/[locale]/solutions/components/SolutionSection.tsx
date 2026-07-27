import Image from "next/image";


const solutions = [
  {
    title: "纯电动推进解决方案",
    image: "/images/solution/electric.png",
    desc:
      "纯电动为型以动力电池 + 电力推进系统为核心，推进能量不依赖燃油机组，通过岸电补能或换电，满足固定航线、短中航程与高静音要求的运营场景。",
  },
  {
    title: "串联式混合动力推进解决方案",
    image: "/images/solution/hybrid-series.png",
    desc:
      "该模型以发动机直接连接轴系作为主动力路径，同时在轴系布置轴电机（可电动/可发电），在不同工况下实现“发动机直驱推进、轴带发电、电助推联合推进”。",
  },
  {
    title: "并联式混合动力推进解决方案",
    image: "/images/solution/hybrid-parallel.png",
    desc:
      "通过发动机和电机共同驱动推进系统，根据船舶运行状态智能切换动力模式，提高燃油经济性并降低排放。",
  },
  {
    title: "船岸一体化能源解决方案",
    image: "/images/solution/shore-energy.png",
    desc:
      "融合岸电、储能、智能控制系统，实现船舶能源补给、管理和调度一体化，提高绿色能源利用效率。",
  },
];



export default function SolutionSection() {


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
              text-3xl
              font-bold
              tracking-wide
              text-[#2463c5]
              md:text-4xl
            "
          >
            解决方案
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
            汉理新能源为各型船舶提供电池动力、
            <br className="hidden md:block"/>
            混合动力推进系统整体解决方案，兼容多元能源形式，助力船舶产业零排放升级
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

          {
            solutions.map(item=>(


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
                    src={item.image}
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

                      <span>
                        了解更多
                      </span>


                      <span
                        className="
                          text-xl
                        "
                      >
                        →
                      </span>

                    </button>


                  </div>


                </div>



              </article>


            ))
          }


        </div>


      </div>


    </section>
  );
}