"use client";
import { Profile, fallbackErrorMessage } from "@ticketbooking/shared";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/error-state";
import { useProfile, useUpdateProfile } from "@/features/auth/hooks-profile";

function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ fullName, phoneNumber });
      toast.success("Đã cập nhật hồ sơ");
    } catch (err) {
      toast.error(fallbackErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink">Hồ sơ cá nhân</h1>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Họ tên</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phoneNumber">Số điện thoại</Label>
        <Input
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={updateProfile.isPending} className="mt-2 self-start">
        {updateProfile.isPending ? "Đang lưu…" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile();

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !profile) return <ErrorState onRetry={() => refetch()} />;

  // key=profile.id: remount khi đổi user, tránh cần useEffect để đồng bộ state từ props.
  return <ProfileForm key={profile.id} profile={profile} />;
}
