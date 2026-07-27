import Image from "next/image";

const categories = [
];

const subCategories = [
];

const products = [
];

export default function ProductCatalog() {
  return (
    <section
      className="
bg-[#eef8ff]
py-20
"
    >
      <div
        className="
mx-auto
max-w-[1200px]
px-5
"
      >
        {/* 标题 */}

        <h1
          className="
text-center
text-4xl
font-bold
text-[#2364c7]
"
        >
          产品目录
        </h1>

        {/* 一级分类 */}

        <div
          className="
mt-12
flex
flex-wrap
justify-center
gap-4
"
        >
          <button
            className="
rounded-full
bg-[#42c86b]
px-8
py-3
text-white
shadow
"
          >
            全部产品
          </button>

          {categories.map((item) => (
            <button
              key={item.id}
              className="
rounded-full
bg-white
px-8
py-3
text-[#334155]
shadow-sm
hover:shadow-md
transition
"
            >
              {item.name}
            </button>
          ))}
        </div>

        <div
          className="
mt-16
grid
grid-cols-1
gap-10
md:grid-cols-[220px_1fr]
"
        >
          {/* 二级筛选 */}

          <aside
            className="
rounded-2xl
bg-white
p-6
shadow-sm
h-fit
"
          >
            <h3
              className="
font-bold
text-lg
"
            >
              产品类型
            </h3>

            <div
              className="
mt-5
space-y-3
"
            >
              {subCategories.map((item) => (
                <div
                  key={item.id}
                  className="
cursor-pointer
rounded-lg
px-4
py-3
text-gray-600
hover:bg-blue-50
hover:text-blue-600
"
                >
                  {item.name}
                </div>
              ))}
            </div>
          </aside>

          {/* 产品 */}

          <div
            className="
grid
grid-cols-1
gap-6
sm:grid-cols-2
lg:grid-cols-3
"
          >
            {products.map((item) => (
              <div
                key={item.name}
                className="
group
rounded-2xl
bg-white
p-5
shadow-sm
transition
hover:-translate-y-1
hover:shadow-xl
"
              >
                <div
                  className="
relative
aspect-square
overflow-hidden
rounded-xl
bg-[#f7fafc]
"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="
object-contain
p-8
transition
group-hover:scale-105
"
                  />
                </div>

                <h3
                  className="
mt-5
text-lg
font-bold
text-[#102a43]
"
                >
                  {item.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
