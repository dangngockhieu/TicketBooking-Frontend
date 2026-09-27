import { Tabs } from "expo-router";
import { LayoutDashboard, Users, Tags, CalendarRange, Banknote } from "lucide-react-native";
import { RoleGuard } from "@/components/role-guard";

export default function AdminLayout() {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <Tabs screenOptions={{ tabBarActiveTintColor: "#4f46e5", headerTitleAlign: "center" }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Tổng quan",
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="organizers"
          options={{
            title: "Organizer",
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="payouts"
          options={{
            title: "Rút tiền",
            tabBarIcon: ({ color, size }) => <Banknote color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Danh mục",
            tabBarIcon: ({ color, size }) => <Tags color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="events/index"
          options={{
            title: "Sự kiện & phí",
            tabBarIcon: ({ color, size }) => <CalendarRange color={color} size={size} />,
          }}
        />
      </Tabs>
    </RoleGuard>
  );
}
