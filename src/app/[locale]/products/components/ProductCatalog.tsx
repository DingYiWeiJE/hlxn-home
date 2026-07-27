import Image from "next/image";

type CategoryItem = {
  id: string;
  name: string;
};

type SubCategoryItem = {
  id: string;
  name: string;
};

type ProductItem = {
  id: string;
  name: string;
  image: string;
};

const categories: CategoryItem[] = [];

const subCategories: SubCategoryItem[] = [];

const products: ProductItem[] = [];

export default function ProductCatalog() {
  return (
    <section className="bg-[#eef8ff] py-20">
      <div className="mx-auto max-w-[1200px] px-5">
        <h1 className="text-center text-4xl font-bold text-[#2364c7]">
          产品目录
        </h1>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="rounded-full bg-[#42c86b] px-8 py-3 text-white shadow"
          >
            全部产品
          </button>

          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className="rounded-full bg-white px-8 py-3 text-[#334155] shadow-sm transition hover:shadow-md"
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">产品类型</h2>

            <div className="mt-5 space-y-3">
              {subCategories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full rounded-lg px-4 py-3 text-left text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </aside>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((item) => (
              <article
                key={item.id}
                className="group rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7fafc]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-8 transition group-hover:scale-105"
                  />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#102a43]">
                  {item.name}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}