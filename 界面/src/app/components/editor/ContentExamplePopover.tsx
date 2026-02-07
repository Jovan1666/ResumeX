import React, { useState } from 'react';
import { Lightbulb, ChevronRight, Copy } from 'lucide-react';
import { ModuleType } from '@/app/types/resume';
import { getExamplesForModule } from '@/app/data/contentExamples';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';

interface ContentExamplePopoverProps {
  moduleType: ModuleType;
  currentValue: string;
  onInsert: (text: string) => void;
}

export const ContentExamplePopover: React.FC<ContentExamplePopoverProps> = ({
  moduleType,
  currentValue,
  onInsert,
}) => {
  const categories = getExamplesForModule(moduleType);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (categories.length === 0) return null;

  const activeCategory = categories.find(c => c.category === selectedCategory);

  const handleInsert = (example: string) => {
    if (currentValue.trim()) {
      onInsert(currentValue + '\n' + example);
    } else {
      onInsert(example);
    }
    setOpen(false);
    setSelectedCategory(null);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedCategory(null); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute top-2 right-2 p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors z-10"
          title="参考示例"
        >
          <Lightbulb size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0 max-h-[400px] overflow-hidden"
      >
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-500" />
            参考示例
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">点击文案可一键填入</p>
        </div>

        <div className="overflow-y-auto max-h-[320px]">
          {!selectedCategory ? (
            // 分类列表
            <div className="py-1">
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors"
                >
                  <span className="font-medium text-gray-700">{cat.category}</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="text-xs">{cat.examples.length}条</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // 示例列表
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-full px-3 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 font-medium border-b border-gray-100"
              >
                ← 返回分类
              </button>
              <div className="py-1">
                {activeCategory?.examples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInsert(example)}
                    className="w-full px-3 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-b-0 transition-colors group"
                  >
                    <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-4 leading-relaxed">
                      {example}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-blue-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy size={10} />
                      <span>点击填入</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
