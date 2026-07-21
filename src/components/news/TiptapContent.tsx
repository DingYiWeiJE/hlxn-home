import Image from "next/image";
import Link from "next/link";
import type { TiptapNode, TiptapMark } from "@/lib/news/tiptap";

function renderMarks(text: string, marks: TiptapMark[] | undefined) {
  return (marks ?? []).reduce<React.ReactNode>((children, mark) => {
    if (mark.type === "bold") return <strong>{children}</strong>;
    if (mark.type === "italic") return <em>{children}</em>;
    if (mark.type === "underline") return <span className="underline">{children}</span>;
    if (mark.type === "link" && typeof mark.attrs?.href === "string") {
      const href = mark.attrs.href;
      const external = href.startsWith("http");
      return (
        <Link href={href} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
          {children}
        </Link>
      );
    }
    return children;
  }, text);
}

export default function TiptapContent({ content }: { content: TiptapNode }) {
  return <div className="prose prose-slate max-w-none">{(content.content ?? []).map((node, index) => renderNode(node, index))}</div>;
}

function renderChildren(node: TiptapNode) {
  return (node.content ?? []).map((child, index) => renderNode(child, index));
}

function renderNode(node: TiptapNode, key: React.Key): React.ReactNode {
  if (node.type === "text") return <span key={key}>{renderMarks(node.text ?? "", node.marks)}</span>;
  if (node.type === "paragraph") return <p key={key}>{renderChildren(node)}</p>;
  if (node.type === "heading") {
    return node.attrs?.level === 3 ? <h3 key={key}>{renderChildren(node)}</h3> : <h2 key={key}>{renderChildren(node)}</h2>;
  }
  if (node.type === "bulletList") return <ul key={key}>{renderChildren(node)}</ul>;
  if (node.type === "orderedList") return <ol key={key}>{renderChildren(node)}</ol>;
  if (node.type === "listItem") return <li key={key}>{renderChildren(node)}</li>;
  if (node.type === "blockquote") return <blockquote key={key}>{renderChildren(node)}</blockquote>;
  if (node.type === "horizontalRule") return <hr key={key} />;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "image" && typeof node.attrs?.src === "string") {
    const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
    return (
      <span key={key} className="relative my-6 block aspect-video overflow-hidden rounded-md bg-slate-100">
        <Image src={node.attrs.src} alt={alt} fill className="object-cover" sizes="100vw" />
      </span>
    );
  }
  return null;
}
