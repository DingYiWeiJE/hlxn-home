# Hanli New Energy - Development Guide

## Project Overview
这是一个nextJs ts tailwind next-intl(仅支持中英)多语言 多语言企业网站，支持中英文切换。主要关注点是确保所有新功能都能正确响应语言变化，在布局的时候一定要想到移动端适配；
在创建页面的时候， 一定要考虑到SEO最佳状态

## Multi-Language Implementation

### Key Rules for Server Components

当创建新的服务端组件时，**必须** 遵循以下规则确保多语言正常工作：

#### 1. 接收 locale prop
```typescript
type Props = {
  locale: string;
};

const MyComponent: React.FC<Props> = async ({ locale }) => {
  // ...
};
```

#### 2. 使用 getTranslations 时显式传递 locale
```typescript
import { getTranslations } from "next-intl/server";

const MyComponent: React.FC<Props> = async ({ locale }) => {
  const t = await getTranslations({ locale }); // 必须传递 locale 参数
  
  return <div>{t("key.path")}</div>;
};
```

**错误做法（不会响应语言切换）：**
```typescript
const t = await getTranslations(); // ❌ 这样不会生效
```

#### 3. 在父页面中传递 locale
在 `src/app/[locale]/page.tsx` 中，确保向子组件传递 `locale`：
```typescript
export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <MyComponent locale={locale} />
      {/* 其他子组件也要传递 locale */}
    </>
  );
}
```

### Adding Translation Keys

所有文本内容都应该在多语言文件中定义：

- `src/messages/zh.json` - 中文翻译
- `src/messages/en.json` - 英文翻译

结构示例：
```json
{
  "myFeature": {
    "title": "功能标题",
    "description": "功能描述",
    "buttonText": "按钮文字"
  }
}
```

### Common Patterns

#### 数组数据的多语言化
```typescript
type Card = {
  heading: string;
  description: string;
};

const MyComponent: React.FC<Props> = async ({ locale }) => {
  const t = await getTranslations({ locale });
  const cards = t.raw("myFeature.cards") as Card[];
  
  return (
    <div>
      {cards.map((card) => (
        <div key={card.heading}>{card.heading}</div>
      ))}
    </div>
  );
};
```

## Component Architecture

### Server Components (Default)
- 用于展示静态内容
- 必须接收并传递 `locale` prop
- 使用 `getTranslations({ locale })`

### Client Components (When Needed)
- 仅当需要交互功能时使用（点击、表单等）
- 添加 `"use client"` 指令
- 可以接收翻译后的文本作为 props

## File Structure
```
src/
├── app/
│   └── [locale]/
│       ├── page.tsx (主页面，传递 locale 给所有子组件)
│       └── abHomeComponents/
│           ├── ChooseHanliSection.tsx (接收 locale)
│           ├── AboutHanli.tsx (接收 locale)
│           └── ...其他组件
├── components/
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── ...其他共享组件
└── messages/
    ├── zh.json (中文翻译)
    └── en.json (英文翻译)
```

## Debugging Language Issues

如果语言切换不生效，检查以下几点：

1. ✅ 组件是否接收了 `locale` prop？
2. ✅ `getTranslations()` 是否传递了 `locale` 参数？
3. ✅ 翻译键是否在 `zh.json` 和 `en.json` 中都存在？
4. ✅ 父组件是否正确传递了 `locale`？
5. ✅ 组件是否是异步的？(服务端组件需要 `async`)

## Examples

### 完整示例 - AboutHanli 组件
```typescript
import React from "react";
import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

const AboutHanli: React.FC<Props> = async ({ locale }) => {
  const t = await getTranslations({ locale });

  return (
    <section>
      <h2>{t("aboutHanli.title")}</h2>
      <p>{t("aboutHanli.description1")}</p>
      <button>{t("aboutHanli.buttonText")}</button>
    </section>
  );
};

export default AboutHanli;
```

对应的翻译文件 (`zh.json`):
```json
{
  "aboutHanli": {
    "title": "走进汉理",
    "description1": "我们依托...",
    "buttonText": "了解更多"
  }
}
```
