"use client";

import { useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  SeparatorHorizontal,
  UnderlineIcon,
  Undo2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Palette,
} from "lucide-react";

import type { TiptapNode } from "@/lib/news/tiptap";

type Props = {
  value: TiptapNode;
  onChange: (value: TiptapNode) => void;
};

type UploadResponse = {
  success: boolean;
  data?: {
    url: string;
    relativePath: string;
  };
  error?: {
    message?: string;
  };
};

export default function NewsEditor({
  value,
  onChange,
}: Props) {
  const [uploading, setUploading] =
    useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),

      Underline,

      TextStyle,

      Color.configure({
        types: ["textStyle"],
      }),

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
        alignments: [
          "left",
          "center",
          "right",
        ],
        defaultAlignment: "left",
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),

      Image.configure({
        allowBase64: false,
        inline: false,
      }),

      Placeholder.configure({
        placeholder:
          "输入新闻正文...",
      }),
    ],

    content: value,
    immediatelyRender: false,

    editorProps: {
      attributes: {
        class:
          "min-h-64 outline-none",
      },
    },

    onUpdate: ({
      editor: activeEditor,
    }) => {
      onChange(
        activeEditor.getJSON() as TiptapNode,
      );
    },
  });

  async function uploadAndInsert(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file || !editor) {
      return;
    }

    setUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          "/api/uploads/images",
          {
            method: "POST",
            credentials:
              "include",
            body: formData,
          },
        );

      const result =
        (await response.json()) as UploadResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.data?.url ||
        !result.data?.relativePath
      ) {
        window.alert(
          result.error?.message ??
            "图片上传失败",
        );

        return;
      }

      const proxyUrl =
        `/api/media/${encodeURIComponent(
          result.data.relativePath,
        )}`;

      editor
        .chain()
        .focus()
        .setImage({
          src: proxyUrl,
          alt:
            file.name ||
            "新闻图片",
        })
        .run();
    } catch {
      window.alert(
        "图片上传失败，请稍后重试",
      );
    } finally {
      setUploading(false);
    }
  }

  function setOrEditLink() {
    if (!editor) {
      return;
    }

    const currentHref =
      editor.isActive("link")
        ? String(
            editor.getAttributes(
              "link",
            ).href ?? "",
          )
        : "";

    const input =
      window.prompt(
        "请输入链接地址。留空可删除当前链接。",
        currentHref ||
          "https://",
      );

    if (input === null) {
      return;
    }

    const trimmed =
      input.trim();

    if (!trimmed) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .unsetLink()
        .run();

      return;
    }

    const href =
      normalizeLinkUrl(
        trimmed,
      );

    if (!href) {
      window.alert(
        "链接地址格式不正确",
      );

      return;
    }

    const {
      from,
      to,
      empty,
    } =
      editor.state.selection;

    /*
     * 没有选中文字时，允许直接插入一个链接，
     * 避免用户点击按钮后看不到任何效果。
     */
    if (
      empty &&
      !editor.isActive("link")
    ) {
      const linkText =
        window.prompt(
          "请输入链接文字",
          href,
        );

      if (!linkText?.trim()) {
        return;
      }

      editor
        .chain()
        .focus()
        .setTextSelection({
          from,
          to,
        })
        .insertContent({
          type: "text",
          text:
            linkText.trim(),
          marks: [
            {
              type: "link",
              attrs: {
                href,
                target:
                  "_blank",
                rel:
                  "noopener noreferrer nofollow",
              },
            },
          ],
        })
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href,
      })
      .run();
  }

  if (!editor) {
    return (
      <div className="min-h-72 rounded-lg border border-slate-300 bg-white" />
    );
  }

  return (
    <div className="flex flex-col h-screen rounded-lg border border-slate-300 bg-white">
      <div
        role="toolbar"
        aria-label="新闻正文编辑工具栏"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 flex-shrink-0"
      >
        <ToolbarButton
          label="二级标题"
          active={editor.isActive(
            "heading",
            {
              level: 2,
            },
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
        >
          <Heading2 size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="三级标题"
          active={editor.isActive(
            "heading",
            {
              level: 3,
            },
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 3,
              })
              .run()
          }
        >
          <Heading3 size={19} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="左对齐"
          active={editor.isActive({
            textAlign: "left",
          })}
          onRun={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("left")
              .run()
          }
        >
          <AlignLeft size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="居中"
          active={editor.isActive({
            textAlign: "center",
          })}
          onRun={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("center")
              .run()
          }
        >
          <AlignCenter size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="右对齐"
          active={editor.isActive({
            textAlign: "right",
          })}
          onRun={() =>
            editor
              .chain()
              .focus()
              .setTextAlign("right")
              .run()
          }
        >
          <AlignRight size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="粗体"
          active={editor.isActive(
            "bold",
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
        >
          <Bold size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="斜体"
          active={editor.isActive(
            "italic",
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        >
          <Italic size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="下划线"
          active={editor.isActive(
            "underline",
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
        >
          <UnderlineIcon
            size={19}
          />
        </ToolbarButton>

        <ToolbarDivider />

        <div className="inline-flex h-9 items-center gap-2">
          <Palette size={19} className="text-slate-700" />
          <input
            type="color"
            title="文字颜色"
            value={editor.getAttributes("textStyle").color || "#000000"}
            onChange={(event) =>
              editor
                .chain()
                .focus()
                .setColor(
                  event.target.value,
                )
                .run()
            }
            className="h-7 w-12 cursor-pointer rounded border border-slate-300"
          />
        </div>

        <ToolbarDivider />

        <ToolbarButton
          label="无序列表"
          active={editor.isActive(
            "bulletList",
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        >
          <List size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="有序列表"
          active={editor.isActive(
            "orderedList",
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        >
          <ListOrdered
            size={19}
          />
        </ToolbarButton>

        <ToolbarButton
          label="引用"
          active={editor.isActive(
            "blockquote",
          )}
          onRun={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
        >
          <Quote size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="分割线"
          onRun={() =>
            editor
              .chain()
              .focus()
              .setHorizontalRule()
              .run()
          }
        >
          <SeparatorHorizontal
            size={19}
          />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label={
            editor.isActive("link")
              ? "编辑链接"
              : "添加链接"
          }
          active={editor.isActive(
            "link",
          )}
          onRun={setOrEditLink}
        >
          <LinkIcon size={19} />
        </ToolbarButton>

        <label
          title="上传图片"
          className={[
            "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition",
            uploading
              ? "cursor-not-allowed text-slate-300"
              : "text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          <ImageIcon size={19} />

          <input
            type="file"
            disabled={uploading}
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={
              uploadAndInsert
            }
            className="hidden"
          />
        </label>

        <ToolbarDivider />

        <ToolbarButton
          label="撤销"
          disabled={
            !editor.can().undo()
          }
          onRun={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
        >
          <Undo2 size={19} />
        </ToolbarButton>

        <ToolbarButton
          label="重做"
          disabled={
            !editor.can().redo()
          }
          onRun={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
        >
          <Redo2 size={19} />
        </ToolbarButton>

        {uploading && (
          <span className="ml-2 text-xs text-slate-500">
            图片上传中...
          </span>
        )}
      </div>

      <EditorContent
        editor={editor}
        className={[
          "flex-1 overflow-y-auto px-5 py-4 text-slate-900",

          "[&_.tiptap]:outline-none",
          "[&_.tiptap]:leading-8",

          "[&_.tiptap_p]:my-3",

          "[&_.tiptap_h2]:mb-3",
          "[&_.tiptap_h2]:mt-8",
          "[&_.tiptap_h2]:text-2xl",
          "[&_.tiptap_h2]:font-bold",
          "[&_.tiptap_h2]:leading-tight",
          "[&_.tiptap_h2]:text-slate-950",

          "[&_.tiptap_h3]:mb-2",
          "[&_.tiptap_h3]:mt-6",
          "[&_.tiptap_h3]:text-xl",
          "[&_.tiptap_h3]:font-semibold",
          "[&_.tiptap_h3]:leading-snug",
          "[&_.tiptap_h3]:text-slate-900",

          "[&_.tiptap_ul]:my-4",
          "[&_.tiptap_ul]:list-disc",
          "[&_.tiptap_ul]:pl-7",

          "[&_.tiptap_ol]:my-4",
          "[&_.tiptap_ol]:list-decimal",
          "[&_.tiptap_ol]:pl-7",

          "[&_.tiptap_li]:my-1",
          "[&_.tiptap_li>p]:my-0",

          "[&_.tiptap_blockquote]:my-5",
          "[&_.tiptap_blockquote]:border-l-4",
          "[&_.tiptap_blockquote]:border-slate-400",
          "[&_.tiptap_blockquote]:bg-slate-50",
          "[&_.tiptap_blockquote]:px-4",
          "[&_.tiptap_blockquote]:py-2",
          "[&_.tiptap_blockquote]:italic",
          "[&_.tiptap_blockquote]:text-slate-600",

          "[&_.tiptap_a]:cursor-pointer",
          "[&_.tiptap_a]:text-blue-600",
          "[&_.tiptap_a]:underline",
          "[&_.tiptap_a]:underline-offset-2",

          "[&_.tiptap_hr]:my-8",
          "[&_.tiptap_hr]:border-0",
          "[&_.tiptap_hr]:border-t",
          "[&_.tiptap_hr]:border-slate-300",

          "[&_.tiptap_img]:my-6",
          "[&_.tiptap_img]:h-auto",
          "[&_.tiptap_img]:w-full",
          "[&_.tiptap_img]:rounded-lg",

          "[&_.ProseMirror-selectednode]:outline",
          "[&_.ProseMirror-selectednode]:outline-2",
          "[&_.ProseMirror-selectednode]:outline-blue-500",
          "[&_.ProseMirror-selectednode]:outline-offset-2",
        ].join(" ")}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onRun,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onRun: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      /*
       * 阻止鼠标按下时抢走编辑器选区。
       * 这是标题、列表、引用等命令稳定工作的关键。
       */
      onMouseDown={(event) =>
        event.preventDefault()
      }
      onClick={onRun}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-md transition",
        active
          ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
          : "text-slate-700 hover:bg-slate-200",
        disabled
          ? "cursor-not-allowed opacity-35"
          : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 h-6 w-px bg-slate-300"
    />
  );
}

function normalizeLinkUrl(
  input: string,
) {
  const value = input.trim();

  if (!value) {
    return null;
  }

  if (
    value.startsWith("/") ||
    /^https?:\/\//i.test(value) ||
    /^mailto:/i.test(value)
  ) {
    return value;
  }

  if (
    /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(
      value,
    )
  ) {
    return `https://${value}`;
  }

  return null;
}