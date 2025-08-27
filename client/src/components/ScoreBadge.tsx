import { Badge } from "@/components/ui/badge";

interface ScoreBadgeProps {
  grade: string;
  className?: string;
}

export default function ScoreBadge({ grade, className = "" }: ScoreBadgeProps) {
  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A':
        return 'bg-score-a text-white';
      case 'B':
        return 'bg-score-b text-white';
      case 'C':
        return 'bg-score-c text-white';
      case 'D':
        return 'bg-score-d text-white';
      case 'E':
        return 'bg-score-e text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`px-2 py-0.5 text-xs font-bold ${getGradeColor(grade)} ${className}`}
      data-testid={`score-badge-${grade.toLowerCase()}`}
    >
      {grade.toUpperCase()}
    </Badge>
  );
}
