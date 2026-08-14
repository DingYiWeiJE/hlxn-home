"use client";

import { useEffect } from "react";
import { trackPageView, AnalyticsResourceType } from "@/lib/analytics/track";

export function ProductTracker({ productId }: { productId: string }) {
  useEffect(() => {
    void trackPageView(AnalyticsResourceType.Product, { resourceId: productId });
  }, [productId]);

  return null;
}

export function NewsTracker({ newsId }: { newsId: string }) {
  useEffect(() => {
    void trackPageView(AnalyticsResourceType.News, { resourceId: newsId });
  }, [newsId]);

  return null;
}

export function SolutionTracker({ solutionId }: { solutionId: string }) {
  useEffect(() => {
    void trackPageView(AnalyticsResourceType.Solution, { resourceId: solutionId });
  }, [solutionId]);

  return null;
}

export function CaseTracker({ caseId }: { caseId: string }) {
  useEffect(() => {
    void trackPageView(AnalyticsResourceType.Case, { resourceId: caseId });
  }, [caseId]);

  return null;
}

export function ContactTracker() {
  useEffect(() => {
    void trackPageView(AnalyticsResourceType.Contact);
  }, []);

  return null;
}

export function PageTracker({ path }: { path?: string }) {
  useEffect(() => {
    void trackPageView(AnalyticsResourceType.Page, { path });
  }, [path]);

  return null;
}
