import { useUserRole } from "@/hooks/useUserRole";

const FEATURE_FLAGS: Record<string, boolean> = {
  FEATURE_GOOGLE_CALENDAR: false,
};

export function useFeatureFlag(flag: string): boolean {
  const { isAdmin } = useUserRole();
  const envValue = FEATURE_FLAGS[flag] ?? false;
  return envValue || isAdmin;
}
