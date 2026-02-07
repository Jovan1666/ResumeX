import { memo, useCallback } from 'react';
import { useResumeStore } from '@/app/store/useResumeStore';
import { BasicInfoForm } from './BasicInfoForm';
import { ModuleList } from './ModuleList';
import { themes, ThemeColor } from '@/app/types/theme';
import { LayoutTemplate } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

export const Sidebar = memo(() => {
  // 细粒度选择器：仅订阅当前主题色，避免 profile/modules 变更触发重渲染
  const themeColor = useResumeStore(state => state.resumes[state.activeResumeId]?.settings.themeColor);

  const handleThemeChange = useCallback((themeId: ThemeColor) => {
    useResumeStore.getState().updateSettings({ themeColor: themeId });
  }, []);

  if (!themeColor) return null;

  return (
    <div className="flex flex-col h-full bg-white text-sm border-r border-gray-200">
      {/* Template Selector */}
      <div className="p-4 border-b border-gray-200 bg-white z-10 sticky top-0">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <LayoutTemplate size={16} />
          选择配色
        </h3>
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-5 gap-2">
            {Object.values(themes).map((t) => (
              <Tooltip key={t.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleThemeChange(t.id)}
                    className={cn(
                      "h-8 rounded-md border-2 transition-all",
                      themeColor === t.id ? "border-gray-900 scale-110 shadow-sm" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: t.colors.primary }}
                    aria-label={`选择${t.nameZh}主题`}
                    aria-pressed={themeColor === t.id}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-center">
                  <p className="font-medium">{t.nameZh}</p>
                  <p className="text-xs text-muted-foreground">{t.sceneHint}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        <div className="mt-2 text-center text-xs font-medium text-gray-500">
          {themes[themeColor]?.nameZh}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        {/* Basic Info */}
        <div className="onboarding-basic">
          <BasicInfoForm />
        </div>

        {/* Modules */}
        <div className="onboarding-modules">
          <ModuleList />
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
