import React from "react";

interface ListItemRowProps {
  isLast?: boolean;
  children: React.ReactNode;
}

export const ListItemRow: React.FC<ListItemRowProps> = ({
  isLast: _isLast,
  children,
}) => {
  // 行间分隔由父容器 divide-y 承担；这里只负责行的 hover 与排版。
  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-500/[0.02] dark:hover:bg-zinc-100/[0.01]">
      {children}
    </div>
  );
};
