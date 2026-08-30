import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface Partner {
  id: string;
  image: string;
  websiteUrl: string;
}

type Props = {
  locale: string;
};

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <a
      href={partner.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit partner website`}
      className="
        group
        relative
        flex
        h-24
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        border
        border-neutral-200/80
        bg-white
        px-4
        outline-none
        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:border-neutral-300
        hover:shadow-sm

        focus-visible:ring-2
        focus-visible:ring-neutral-900
        focus-visible:ring-offset-2

        sm:h-32
        sm:px-6
      "
    >
      <div
        className="
          relative
          flex
          h-full
          w-full
          items-center
          justify-center
        "
      >
        <Image
          src={partner.image}
          alt="Partner logo"
          fill
          sizes="
            (max-width: 640px) 100%,
            (max-width: 1024px) 100%,
            100%
          "
          className="
            object-contain
            opacity-100
            transition-all
            duration-200
            p-2

            group-hover:opacity-100
          "
        />
      </div>

      <span
        className="
          pointer-events-none
          absolute
          right-2.5
          top-2.5
          translate-y-1
          text-neutral-400
          opacity-0
          transition-all
          duration-200

          group-hover:translate-y-0
          group-hover:opacity-100

          group-focus-visible:translate-y-0
          group-focus-visible:opacity-100

          sm:right-3
          sm:top-3
        "
      >
        <ExternalLinkIcon />
      </span>
    </a>
  );
}

async function getPartners(): Promise<Partner[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const apiUrl = `${baseUrl}/api/cms/partners`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`[PartnerSection] Partners API failed, status=${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error(`[PartnerSection] Failed to fetch partners:`, error);
    return [];
  }
}

export async function PartnerSection({ locale }: Props) {
  const partners = await getPartners();
  const t = await getTranslations({ locale });

  if (!partners.length) {
    return null;
  }

  return (
    <section
      id="partners"
      aria-labelledby="partners-title"
      className="bg-white py-14 sm:py-18 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p
            className="
              mb-2
              text-xs
              font-semibold
              uppercase
              tracking-[0.16em]
              text-neutral-500
            "
          >
            {t("partners.label")}
          </p>

          <h2
            id="partners-title"
            className="
              text-2xl
              font-semibold
              tracking-tight
              text-neutral-950

              sm:text-3xl
              lg:text-4xl
            "
          >
            {t("partners.title")}
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-xl
              text-sm
              leading-6
              text-neutral-500

              sm:mt-4
              sm:text-base
              sm:leading-7
            "
          >
            {t("partners.description")}
          </p>
        </div>

        {/* Partner Logo Grid */}
        <div
          className="
            grid
            grid-cols-2
            gap-3

            sm:grid-cols-3
            sm:gap-4

            lg:grid-cols-4

            xl:grid-cols-6
          "
        >
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  );
}