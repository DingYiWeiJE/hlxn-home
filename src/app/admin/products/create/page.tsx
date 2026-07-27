import type { Metadata } from "next";

import ProductForm from "@/components/admin/products/ProductForm";

export const metadata: Metadata = {
  title: "创建产品",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateProductPage() {
  return <ProductForm mode="create" />;
}