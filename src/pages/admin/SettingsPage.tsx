import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Type,
  Palette,
  Bell,
  Shield,
  Building,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/providers/ThemeProvider";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { theme, setTheme, fontSize, setFontSize, resolvedTheme } = useTheme();
  const { toast } = useToast();

  const handleThemeChange = (value: string) => {
    setTheme(value as "light" | "dark" | "system");
    toast({
      title: "Theme Updated",
      description: `Theme set to ${value}`,
    });
  };

  const handleFontSizeChange = (value: string) => {
    setFontSize(value as "small" | "medium" | "large");
    toast({
      title: "Font Size Updated",
      description: `Font size set to ${value}`,
    });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your application preferences
          </p>
        </div>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Palette className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred color theme
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center">
                    <Sun className="w-6 h-6 text-yellow-500" />
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-900 border flex items-center justify-center">
                    <Moon className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => handleThemeChange("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === "system"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white to-gray-900 border flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current theme: {resolvedTheme}
              </p>
            </div>

            <Separator />

            {/* Font Size */}
            <div className="space-y-3">
              <Label className="text-base">Font Size</Label>
              <p className="text-sm text-muted-foreground">
                Adjust the text size throughout the application
              </p>
              <div className="flex items-center gap-4">
                <Type className="w-4 h-4 text-muted-foreground" />
                <Select value={fontSize} onValueChange={handleFontSizeChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">
                      <span className="text-sm">Small (14px)</span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="text-base">Medium (16px)</span>
                    </SelectItem>
                    <SelectItem value="large">
                      <span className="text-lg">Large (18px)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="font-medium mb-1">Preview</p>
                <p className="text-muted-foreground">
                  This is how text will appear with your selected font size.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure notification preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>PTO Request Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when employees submit PTO requests
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Time Entry Flags</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when time entries are flagged for review
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Payroll Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Remind before payroll processing deadlines
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage security and privacy settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log out after inactivity
                </p>
              </div>
              <Select defaultValue="30">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Building className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>
                  Configure company-wide preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require GPS for Clock-In</Label>
                <p className="text-sm text-muted-foreground">
                  Employees must enable location for time tracking
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Approve Time Entries</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve verified time entries
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Pay Period Type</Label>
                <p className="text-sm text-muted-foreground">
                  How often employees are paid
                </p>
              </div>
              <Select defaultValue="biweekly">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              toast({
                title: "Settings Saved",
                description: "Your preferences have been updated successfully.",
              });
            }}
          >
            Save All Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
