import { Check, Users, FileText, MessageSquare, Shield, Radio, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OnboardingProfile,
  getApproachLabel,
  getApproachLevel,
  getChannelAdaptation,
  generateAudiences,
  getScriptFocus,
  getMainArgument,
} from "@/lib/onboardingGenerator";

interface OnboardingPreviewProps {
  profile: OnboardingProfile;
}

interface PreviewItem {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode | null;
  filled: boolean;
}

export default function OnboardingPreview({ profile }: OnboardingPreviewProps) {
  const approachLabel = getApproachLabel(profile.offerType);
  const audiences = generateAudiences(profile);
  const scriptFocus = getScriptFocus(profile.mainPain);
  const mainArgument = getMainArgument(profile.differential);
  const channelAdapt = getChannelAdaptation(profile.contactChannel);
  const approachLevel = getApproachLevel(profile.averageTicket);

  const items: PreviewItem[] = [
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Estrutura de abordagem",
      content: approachLabel ? <p className="text-sm text-muted-foreground">{approachLabel}</p> : null,
      filled: !!approachLabel,
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Públicos-alvo",
      content: audiences ? (
        <ul className="space-y-1.5">
          {audiences.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span><span className="text-foreground font-medium">{a.name}</span> — {a.segment}</span>
            </li>
          ))}
        </ul>
      ) : null,
      filled: !!audiences,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Foco central do script",
      content: scriptFocus ? <p className="text-sm text-muted-foreground">"{scriptFocus}"</p> : null,
      filled: !!scriptFocus,
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      title: "Argumento principal",
      content: mainArgument ? <p className="text-sm text-muted-foreground">"{mainArgument}"</p> : null,
      filled: !!mainArgument,
    },
    {
      icon: <Radio className="h-4 w-4" />,
      title: "Formato de mensagem",
      content: channelAdapt ? (
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{channelAdapt.label}</span> — {channelAdapt.description}
        </p>
      ) : null,
      filled: !!channelAdapt,
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Nível da abordagem",
      content: approachLevel ? <p className="text-sm text-muted-foreground">{approachLevel}</p> : null,
      filled: !!approachLevel,
    },
  ];

  const filledCount = items.filter((i) => i.filled).length;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Sua máquina está sendo montada</h3>
        <span className="text-xs text-muted-foreground">{filledCount}/{items.length}</span>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`transition-all duration-500 ${item.filled ? "animate-fade-in" : "opacity-40"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`flex items-center justify-center h-5 w-5 rounded-full ${item.filled ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                {item.filled ? <Check className="h-3 w-3" /> : item.icon}
              </div>
              <span className={`text-xs font-medium ${item.filled ? "text-foreground" : "text-muted-foreground"}`}>
                {item.title}
              </span>
            </div>
            <div className="ml-7">
              {item.filled ? item.content : <Skeleton className="h-4 w-3/4" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
