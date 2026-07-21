"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Heading2, Heading3, ImageIcon, Italic, LinkIcon, List, ListOrdered, Quote, Redo2, SeparatorHorizontal, UnderlineIcon, Undo2 } from "lucide-react";
import type { TiptapNode } from "@/lib/news/tiptap";

type Props = {
  value: TiptapNode;
  onChange: (value: TiptapNode) => void;
};

export default function NewsEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "输入新闻正文..." }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getJSON() as TiptapNode),
  });

  async function uploadAndInsert(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/uploads/images", { method: "POST", body: formData });
    const data = (await response.json()) as { success: boolean; data?: { url: string }; error?: { message: string } };
    if (data.success && data.data) {
      editor.chain().focus().setImage({ src: data.data.url }).run();
    } else {
      alert(data.error?.message ?? "图片上传失败");
    }
    event.target.value = "";
  }

  if (!editor) return <div className="min-h-52 rounded-md border border-slate-300 bg-white" />;

  const buttons = [
    { label: "H2", icon: <Heading2 size={18} />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "H3", icon: <Heading3 size={18} />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "粗体", icon: <Bold size={18} />, action: () => editor.chain().focus().toggleBold().run() },
    { label: "斜体", icon: <Italic size={18} />, action: () => editor.chain().focus().toggleItalic().run() },
    { label: "下划线", icon: <UnderlineIcon size={18} />, action: () => editor.chain().focus().toggleUnderline().run() },
    { label: "无序列表", icon: <List size={18} />, action: () => editor.chain().focus().toggleBulletList().run() },
    { label: "有序列表", icon: <ListOrdered size={18} />, action: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "引用", icon: <Quote size={18} />, action: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "分割线", icon: <SeparatorHorizontal size={18} />, action: () => editor.chain().focus().setHorizontalRule().run() },
    { label: "撤销", icon: <Undo2 size={18} />, action: () => editor.chain().focus().undo().run() },
    { label: "重做", icon: <Redo2 size={18} />, action: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="rounded-md border border-slate-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
        {buttons.map((button) => (
          <button key={button.label} type="button" title={button.label} onClick={button.action} className="rounded p-2 text-slate-700 hover:bg-slate-100">
            {button.icon}
          </button>
        ))}
        <button
          type="button"
          title="链接"
          onClick={() => {
            const href = prompt("请输入链接地址");
            if (href) editor.chain().focus().setLink({ href }).run();
          }}
          className="rounded p-2 text-slate-700 hover:bg-slate-100"
        >
          <LinkIcon size={18} />
        </button>
        <label className="cursor-pointer rounded p-2 text-slate-700 hover:bg-slate-100" title="上传图片">
          <ImageIcon size={18} />
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadAndInsert} className="hidden" />
        </label>
      </div>
      <EditorContent editor={editor} className="min-h-72 px-4 py-3 text-slate-900 [&_.tiptap]:min-h-64 [&_.tiptap]:outline-none" />
    </div>
  );
}
