import { Tabs } from "expo-router";
import { LayoutDashboard, CalendarDays, ScanLine, Wallet } from "lucide-react-native";
import { RoleGuard } from "@/components/role-guard";

export default function OrganizerLayout() {
  return (
    <RoleGuard allow={["ORGANIZER"]}>
      <Tabs screenOptions={{ tabBarActiveTintColor: "#4f46e5", headerTitleAlign: "center" }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Tổng quan",
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="events/index"
          options={{
            title: "Sự kiện",
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="check-in"
          options={{
            title: "Check-in",
            tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: "Ví của tôi",
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="events/new" options={{ href: null, title: "Tạo sự kiện" }} />
        <Tabs.Screen name="events/[eventId]/edit" options={{ href: null, title: "Sửa sự kiện" }} />
        <Tabs.Screen
          name="events/[eventId]/report"
          options={{ href: null, title: "Báo cáo sự kiện" }}
        />
      </Tabs>
    </RoleGuard>
  );
}
