"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 公司信息 */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">汉理楚能</h3>
            <p className="text-sm text-gray-400">
              {t("about.description")}
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              {t("nav.home")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-white transition">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link href="#about" className="hover:text-white transition">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition">
                  {t("nav.products")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 产品 */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              {t("nav.products")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-white transition">
                  {t("features.item1.title")}
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  {t("features.item3.title")}
                </Link>
              </li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div>
            <h4 className="text-white font-semibold mb-4">
              {t("nav.contact")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>📧 contact@hanlichuneng.com</li>
              <li>📞 +86 123-4567-8900</li>
              <li>📍 China</li>
            </ul>
          </div>
        </div>

        {/* 底部 */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              {t("footer.copyright")}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition">
                {t("footer.links.privacy")}
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition">
                {t("footer.links.terms")}
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition">
                {t("footer.links.contact")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
