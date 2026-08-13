"use client";

import { ReactNode, useState } from "react";

type DropdownItem = {
  label: string;
  element: ReactNode;
};

type Position = "left" | "right";

type Props = {
  trigger: ReactNode;
  items: DropdownItem[];
  position?: Position;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export default function Dropdown({
  trigger,
  items,
  position = "left",
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClass = position === "right" ? "right-0" : "left-0";

  return (
    <div
      className="relative group"
      onMouseEnter={(e) => {
        setIsOpen(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsOpen(false);
        onMouseLeave?.(e);
      }}
    >
      {trigger}
      {isOpen && (
        <div className={`absolute ${positionClass} top-full pt-2 z-10`}>
          <div
            className="backdrop-blur-md rounded shadow-lg overflow-hidden whitespace-nowrap"
            style={{ backgroundColor: "rgba(100, 116, 139, 0.6)" }}
          >
            {items.map((item, index) => (
              <div key={index}>{item.element}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
