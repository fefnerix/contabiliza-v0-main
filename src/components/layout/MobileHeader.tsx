import React from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Eye, EyeOff, LogOut } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useAppContext } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/common/BrandLogo";
import { WhatsAppRegisterTopbar } from "@/components/contact/WhatsAppRegisterTopbar";

interface MobileHeaderProps {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ hideValues, toggleHideValues }) => {
  const { t } = usePreferences();
  const { logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b md:hidden">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex-shrink-0">
          <BrandLogo size="sm" />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleHideValues}
            aria-label={hideValues ? t("common.show") : t("common.hide")}
          >
            {hideValues ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>

          <ThemeToggle variant="ghost" size="icon" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label={t("settings.logout")}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <WhatsAppRegisterTopbar className="border-t border-b-0 px-2 pb-2" />
    </div>
  );
};

export default MobileHeader;
