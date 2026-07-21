"use client";

import Image from "next/image";
import { Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function CustomContactBar() {
  const [show, setShow] = useState<"phone" | "wechat" | null>(null);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 max-md:bottom-5 max-md:left-1/2 max-md:right-auto max-md:top-auto max-md:-translate-x-1/2 max-md:flex-row">
      {/* 电话 */}
      <ContactItem
        type="phone"
        show={show}
        onMouseEnter={() => setShow("phone")}
        onMouseLeave={() => setShow(null)}
        onClick={() => setShow(show === "phone" ? null : "phone")}
      >
        <PhoneContent />
      </ContactItem>

      {/* 微信 */}
      <ContactItem
        type="wechat"
        show={show}
        onMouseEnter={() => setShow("wechat")}
        onMouseLeave={() => setShow(null)}
        onClick={() => setShow(show === "wechat" ? null : "wechat")}
      >
        <WechatContent />
      </ContactItem>
    </div>
  );
}


/**
 * 联系项容器 - 处理电话和微信的交互逻辑
 */
function ContactItem({
  type,
  show,
  onMouseEnter,
  onMouseLeave,
  onClick,
  children,
}: {
  type: "phone" | "wechat";
  show: "phone" | "wechat" | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      <ContactButton type={type} />
      <Popup visible={show === type}>{children}</Popup>
    </div>
  );
}

/**
 * 悬浮按钮
 */
function ContactButton({ type }: { type: "phone" | "wechat" }) {
  const isPhone = type === "phone";
  const bgColor = isPhone ? "bg-[#00658c]" : "bg-[#00c768]";

  return (
    <div
      className={`w-[68px] h-[108px] rounded-full flex flex-col items-center justify-center text-white cursor-pointer select-none max-md:w-auto max-md:h-[68px] max-md:px-4 max-md:flex-row max-md:gap-2 max-md:rounded-lg ${bgColor}`}
    >
      {isPhone ? (
        <>
          <Phone size={28} className="flex-shrink-0" />
          <span className="text-sm mt-2 leading-tight text-center max-md:mt-0 max-md:whitespace-nowrap">
            联系<br className="max-md:hidden" />
            我们
          </span>
        </>
      ) : (
        <>
          <MessageCircle size={30} className="flex-shrink-0" />
          <span className="text-sm mt-2 max-md:mt-0 max-md:whitespace-nowrap">微信</span>
        </>
      )}
    </div>
  );
}



/**
 * 公共弹窗容器 - 负责 PC / 移动端箭头和动画
 */
function Popup({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  const visibilityClasses = visible ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95";

  return (
    <div
      className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 max-md:right-1/2 max-md:top-auto max-md:bottom-full max-md:mb-3 max-md:translate-x-1/2 max-md:translate-y-0 transition-all duration-300 ${visibilityClasses}`}
    >
      {children}

      {/* 箭头 - PC端指向左边，移动端指向下方 */}
      <div className="absolute right-[-13px] top-1/2 -translate-y-1/2 w-[18px] h-[24px] bg-white [clip-path:polygon(0_0,100%_50%,0_100%)] max-md:right-auto max-md:left-1/2 max-md:top-full max-md:-translate-x-1/2 max-md:w-[24px] max-md:h-[14px] max-md:[clip-path:polygon(0_0,100%_0,50%_100%)]" />
    </div>
  );
}





function PhoneContent() {
  return (
    <div className="w-[300px] h-[140px] bg-white rounded-xl shadow-xl flex items-center justify-center text-[26px] font-bold">
      027-86660081
    </div>
  );
}





function WechatContent() {
  return (
    <div className="w-[300px] h-[350px] bg-white rounded-xl shadow-xl flex flex-col items-center justify-center">
      <div className="relative w-[230px] h-[230px]">
        <Image src="/images/common/qr-code.jpg" alt="微信二维码" fill className="object-contain" />
      </div>

      <p className="mt-3 text-gray-500 text-sm">扫码关注汉理新能</p>
    </div>
  );
}