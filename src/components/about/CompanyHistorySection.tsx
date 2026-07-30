import CompanyHistoryTimeline from "./CompanyHistoryTimeline";
import type { CompanyHistoryPublicItem } from "@/lib/company-history/types";

type Props = {
  items: CompanyHistoryPublicItem[];
  labels: {
    title: string;
    previous: string;
    next: string;
    scrollHint: string;
    emptyTitle: string;
    emptyDescription: string;
    timelineLabel: string;
    itemLabel: string;
  };
};

export default function CompanyHistorySection({ items, labels }: Props) {
  return (
    <section className="bg-[#f6fbff] py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-wide text-[#2365c4] md:text-3xl lg:text-4xl">
          {labels.title}
        </h2>

        {items.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[#cfe7f7] bg-white px-6 py-10 text-center shadow-sm">
            <h3 className="text-lg font-bold text-[#07101f] md:text-xl">
              {labels.emptyTitle}
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#52677f] md:text-base">
              {labels.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="mt-10">
            <CompanyHistoryTimeline
              items={items}
              labels={{
                previous: labels.previous,
                next: labels.next,
                scrollHint: labels.scrollHint,
                timelineLabel: labels.timelineLabel,
                itemLabel: labels.itemLabel,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
