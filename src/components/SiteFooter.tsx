import Link from "next/link";
import { getTranslations } from "next-intl/server";

type FooterLink = {
  label: string;
  href: string;
};

type Props = {
  locale: string;
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "汉理新能源（北京）科技有限责任公司",
  alternateName: "Hanly Energy",
  telephone: "027-86660081",
  address: {
    "@type": "PostalAddress",
    addressCountry: "CN",
    addressRegion: "湖北省",
    addressLocality: "武汉市",
    streetAddress: "武昌区中北路武汉中央大厦B座九层",
  },
};

function FooterNav({
  title,
  links,
  ariaLabel,
}: {
  title: string;
  links: FooterLink[];
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel}>
      <h2 className="text-xl font-semibold tracking-wide text-white md:text-2xl">
        {title}
      </h2>

      <ul className="mt-5 space-y-2 text-sm font-medium leading-6 text-slate-200 md:text-base">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#001927]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default async function SiteFooter({ locale }: Props) {
  const t = await getTranslations({ locale });

  const companyLinks: FooterLink[] = t.raw("siteFooter.companyLinks");
  const newsLinks: FooterLink[] = t.raw("siteFooter.newsLinks");
  const careerLinks: FooterLink[] = t.raw("siteFooter.careerLinks");
  return (
    <footer
      className="bg-[#001927] text-white"
      aria-label="网站页脚"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />

      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 md:py-16 lg:px-6 lg:py-[66px]">
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.25fr_auto]">
          <FooterNav
            title={t("siteFooter.company")}
            links={companyLinks}
            ariaLabel={t("siteFooter.company")}
          />

          <FooterNav
            title={t("siteFooter.news")}
            links={newsLinks}
            ariaLabel={t("siteFooter.news")}
          />

          <FooterNav
            title={t("siteFooter.careers")}
            links={careerLinks}
            ariaLabel={t("siteFooter.careers")}
          />

          <section aria-labelledby="footer-contact-title">
            <h2
              id="footer-contact-title"
              className="text-xl font-semibold tracking-wide text-white md:text-2xl"
            >
              {t("siteFooter.contact")}
            </h2>

            <address className="mt-5 not-italic text-sm font-medium leading-7 text-slate-200 md:text-base">
              <p>
                {t("siteFooter.phone")}：
                <a
                  href="tel:02786660081"
                  className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  {t("siteFooter.phoneNumber")}
                </a>
              </p>

              <p>
                {t("siteFooter.address")}：
                <br />
                {t("siteFooter.addressDetail")}
              </p>
            </address>
          </section>

          <figure className="w-fit">
            <div
              role="img"
              aria-label={t("siteFooter.wechatQR")}
              className="h-[126px] w-[126px] bg-white bg-contain bg-center bg-no-repeat sm:h-[124px] sm:w-[124px]"
              style={{
                backgroundImage: "url('/images/common/qr-code.jpg')",
              }}
            />

            <figcaption className="mt-1 text-center text-sm text-slate-300">
              {t("siteFooter.wechatQR")}
            </figcaption>
          </figure>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-200 md:mt-24 md:flex-row md:items-center md:justify-between md:border-t-0 md:pt-0 md:text-base">
          <p>
            {t("siteFooter.copyright")}
          </p>

          <p className="leading-6 md:text-right">
            {t("siteFooter.companyName")}
            <span className="mx-2 hidden md:inline" aria-hidden="true">
              |
            </span>
            <br className="md:hidden" />
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              {t("siteFooter.icp")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}