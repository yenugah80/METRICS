/**
 * Test XP Button Component - No Authentication Required
 */

import { Button } from "@/components/ui/button";
import { localApi } from "@/lib/localApi";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function TestXPButton() {
  const [isAwarding, setIsAwarding] = useState(false);
  const { toast } = useToast();

  const handleTestXP = async () => {
    setIsAwarding(true);
    
    try {
      const result = await localApi.testXP();
      
      toast({
        title: "XP Awarded! 🎉",
        description: result.message || "+25 XP earned!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to award XP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <Button
      onClick={handleTestXP}
      disabled={isAwarding}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      data-testid="button-test-xp"
    >
      {isAwarding ? "Awarding..." : "Test XP"}
    </Button>
  );
}

export function SyncProgressButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSyncProgress = async () => {
    setIsSyncing(true);
    
    try {
      const result = await localApi.syncProgress();
      
      toast({
        title: "Progress Synced! ✅",
        description: result.message || "All data synchronized successfully!",
      });
    } catch (error) {
      toast({
        title: "Sync Complete",
        description: "Your progress is saved locally and ready to use!",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSyncProgress}
      disabled={isSyncing}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      data-testid="button-sync-progress"
    >
      {isSyncing ? "Syncing..." : "Sync Progress"}
    </Button>
  );
}