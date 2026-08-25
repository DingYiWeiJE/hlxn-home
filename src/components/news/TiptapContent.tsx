import {
  Fragment,
  type ReactNode,
} from "react";

import type {
  TiptapMark,
  TiptapNode,
} from "@/lib/news/tiptap";

type Props = {
  content: TiptapNode;
};

export default function TiptapContent({
  content,
}: Props) {
  return (
    <div className="news-article-content">
      {renderChildren(
        content,
        "root",
      )}
    </div>
  );
}

function renderChildren(
  node: TiptapNode,
  keyPrefix: string,
): ReactNode {
  return node.content?.map(
    (child, index) =>
      renderNode(
        child,
        `${keyPrefix}-${index}`,
      ),
  );
}

function renderNode(
  node: TiptapNode,
  key: string,
): ReactNode {
  if (node.type === "text") {
    return renderTextNode(
      node,
      key,
    );
  }

  const children =
    renderChildren(node, key);

  const textAlign = normalizeTextAlign(
    node.attrs?.textAlign,
  );

  const alignmentStyle = textAlign
    ? { textAlign }
    : undefined;

  switch (node.type) {
    case "doc":
      return (
        <Fragment key={key}>
          {children}
        </Fragment>
      );

    case "paragraph":
      return (
        <p
          key={key}
          style={alignmentStyle}
          className="my-4 text-[1.5rem] leading-[3rem] text-slate-800 whitespace-pre-wrap"
        >
          {children}
        </p>
      );

    case "heading": {
      const level =
        node.attrs?.level === 3
          ? 3
          : 2;

      if (level === 3) {
        return (
          <h3
            key={key}
            style={alignmentStyle}
            className="mb-3 mt-8 text-xl font-semibold leading-snug text-slate-900"
          >
            {children}
          </h3>
        );
      }

      return (
        <h2
          key={key}
          style={alignmentStyle}
          className="mb-4 mt-10 text-2xl font-bold leading-tight text-slate-950"
        >
          {children}
        </h2>
      );
    }

    case "bulletList":
      return (
        <ul
          key={key}
          className="my-5 list-disc space-y-2 pl-7 text-slate-800"
        >
          {children}
        </ul>
      );

    case "orderedList":
      return (
        <ol
          key={key}
          className="my-5 list-decimal space-y-2 pl-7 text-slate-800"
        >
          {children}
        </ol>
      );

    case "listItem":
      return (
        <li
          key={key}
          className="leading-8"
        >
          {children}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-6 border-l-4 border-slate-300 bg-slate-50 px-5 py-3 text-slate-600"
        >
          {children}
        </blockquote>
      );

    case "horizontalRule":
      return (
        <hr
          key={key}
          className="my-10 border-0 border-t border-slate-200"
        />
      );

    case "hardBreak":
      return <br key={key} />;

    case "image":
      return renderImageNode(
        node,
        key,
      );

    default:
      return (
        <Fragment key={key}>
          {children}
        </Fragment>
      );
  }
}

function renderImageNode(
  node: TiptapNode,
  key: string,
) {
  const src =
    typeof node.attrs?.src ===
    "string"
      ? node.attrs.src
      : "";

  if (!src) {
    return null;
  }

  const alt =
    typeof node.attrs?.alt ===
    "string"
      ? node.attrs.alt
      : "";

  const title =
    typeof node.attrs?.title ===
    "string"
      ? node.attrs.title
      : undefined;

  /*
   * 后续导入器保存了 width 时，
   * 会优先按照公众号原始宽度展示。
   */
  const importedWidth =
    normalizeImageWidth(
      node.attrs?.width,
    );

  return (
    <figure
      key={key}
      className="my-7 flex w-full flex-col items-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        title={title}
        loading="lazy"
        decoding="async"
        className="block h-auto w-4/5 rounded-md"
        style={
          importedWidth
            ? {
                width:
                  importedWidth,
                maxWidth:
                  "80%",
                height:
                  "auto",
              }
            : {
                height:
                  "auto",
              }
        }
      />

      {title && (
        <figcaption className="mt-2 text-center text-sm text-slate-500">
          {title}
        </figcaption>
      )}
    </figure>
  );
}

function renderTextNode(
  node: TiptapNode,
  key: string,
) {
  let result: ReactNode =
    node.text ?? "";

  const marks = [
    ...(node.marks ?? []),
  ].reverse();

  for (
    let index = 0;
    index < marks.length;
    index += 1
  ) {
    result = applyMark(
      result,
      marks[index],
      `${key}-mark-${index}`,
    );
  }

  return (
    <Fragment key={key}>
      {result}
    </Fragment>
  );
}

function applyMark(
  content: ReactNode,
  mark: TiptapMark,
  key: string,
): ReactNode {
  switch (mark.type) {
    case "bold":
      return (
        <strong
          key={key}
          className="font-semibold"
        >
          {content}
        </strong>
      );

    case "italic":
      return (
        <em key={key}>
          {content}
        </em>
      );

    case "underline":
      return (
        <u key={key}>
          {content}
        </u>
      );

    case "textStyle": {
      const color =
        typeof mark.attrs?.color ===
        "string"
          ? mark.attrs.color
          : undefined;

      if (!color) {
        return content;
      }

      return (
        <span
          key={key}
          style={{ color }}
        >
          {content}
        </span>
      );
    }

    case "link": {
      const href =
        typeof mark.attrs?.href ===
        "string"
          ? mark.attrs.href
          : "";

      if (!href) {
        return content;
      }

      return (
        <a
          key={key}
          href={href}
          target={
            href.startsWith("/")
              ? undefined
              : "_blank"
          }
          rel={
            href.startsWith("/")
              ? undefined
              : "noopener noreferrer"
          }
          className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
        >
          {content}
        </a>
      );
    }

    default:
      return content;
  }
}

function normalizeImageWidth(
  value: unknown,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim().toLowerCase();

  const match =
    normalized.match(
      /^(\d+(?:\.\d+)?)(%|px)$/,
    );

  if (!match) {
    return null;
  }

  const amount =
    Number(match[1]);

  const unit = match[2];

  if (
    !Number.isFinite(amount)
  ) {
    return null;
  }

  if (
    unit === "%" &&
    amount >= 10 &&
    amount <= 100
  ) {
    return `${amount}%`;
  }

  if (
    unit === "px" &&
    amount >= 40 &&
    amount <= 1600
  ) {
    return `${amount}px`;
  }

  return null;
}

function normalizeTextAlign(
  value: unknown,
): "left" | "center" | "right" | undefined {
  if (
    value === "left" ||
    value === "center" ||
    value === "right"
  ) {
    return value;
  }

  return undefined;
}