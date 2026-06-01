"use client";

import { useAtom, useSetAtom } from "jotai";
import {
  isLogoutConfirmOpenAtom,
  userAtom,
  isSettingsOpenAtom,
  isCancelSubscriptionOpenAtom,
  isManagePaymentOpenAtom,
} from "@/store/atoms";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function LogoutConfirmModal() {
  const [isOpen, setIsOpen] = useAtom(isLogoutConfirmOpenAtom);
  const setUser = useSetAtom(userAtom);
  const router = useRouter();
  const { toast } = useToast();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const setIsCancelSubscriptionOpen = useSetAtom(isCancelSubscriptionOpenAtom);
  const setIsManagePaymentOpen = useSetAtom(isManagePaymentOpenAtom);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        setUser(null);
        setIsOpen(false);
        setIsSettingsOpen(false);
        setIsCancelSubscriptionOpen(false);
        setIsManagePaymentOpen(false);
        router.push("/");
        toast({
          title: "Logged out successfully",
          description: "See you next time!",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-[400px] rounded-2xl p-6">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-lg font-medium text-[#151515]">
            Log out?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[#62646A] mt-1">
            Are you sure you want to log out of your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="h-10 px-5 rounded-lg border-gray-200 text-[#101828] hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            className="h-10 px-5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-medium"
          >
            Log out
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
