"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@ticketbooking/shared";

/** Bộ lọc /events đồng bộ với searchParams — share link được, back/forward đúng. */
export function EventFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");

  function applyFilters(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => router.push(`/events?${params.toString()}`));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ keyword, location, category });
  }

  function clearFilters() {
    setKeyword("");
    setLocation("");
    setCategory("");
    startTransition(() => router.push("/events"));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="keyword">Từ khóa</Label>
        <Input
          id="keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tên sự kiện, nghệ sĩ…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Thành phố</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Hà Nội, TP.HCM…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Danh mục</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-md border border-hairline bg-canvas px-3 text-[15px] text-ink outline-none focus-visible:border-primary"
        >
          <option value="">Tất cả</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Áp dụng
        </Button>
        <Button type="button" variant="secondary" onClick={clearFilters}>
          Xóa lọc
        </Button>
      </div>
    </form>
  );
}
