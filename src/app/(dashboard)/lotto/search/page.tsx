"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { LottoDraw } from "@/features/lotto/types";

export default function SearchPage() {
  const [searchType, setSearchType] = useState<"drwNo" | "date">("drwNo");
  const [searchValue, setSearchValue] = useState("");
  const [queryParam, setQueryParam] = useState<{
    type: string;
    value: string;
  } | null>(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["lottoSearch", queryParam],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryParam) {
        params.append(queryParam.type, queryParam.value);
      }
      const res = await fetch(`/api/lotto/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    // enabled: !!queryParam // Initial load fetches recent 10
  });

  const handleSearch = () => {
    if (!searchValue) return;
    setQueryParam({ type: searchType, value: searchValue });
  };

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6">로또 당첨번호 검색</h1>
      <p className="text-muted-foreground mb-8">
        회차별 또는 날짜별로 과거 당첨번호를 조회해보세요.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex gap-2">
          <Button
            variant={searchType === "drwNo" ? "default" : "outline"}
            onClick={() => {
              setSearchType("drwNo");
              setSearchValue("");
            }}
          >
            <Hash className="w-4 h-4 mr-2" />
            회차 검색
          </Button>
          <Button
            variant={searchType === "date" ? "default" : "outline"}
            onClick={() => {
              setSearchType("date");
              setSearchValue("");
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            날짜 검색
          </Button>
        </div>
        <div className="flex flex-1 gap-2">
          <Input
            placeholder={
              searchType === "drwNo"
                ? "회차 번호 (예: 1100)"
                : "날짜 (예: 2024-01-01)"
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">로딩 중...</div>
      ) : (
        <div className="grid gap-4">
          {!queryParam && (
            <h2 className="text-xl font-bold mb-2">최근 당첨번호</h2>
          )}
          {searchResults?.data?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}
          {searchResults?.data?.map((draw: any) => (
            <Card key={draw.drw_no} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      {draw.drw_no}회
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({draw.drw_no_date})
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    1등: {Number(draw.first_win_amnt || 0).toLocaleString()}원
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2 justify-center items-center">
                  {[
                    draw.drwt_no1,
                    draw.drwt_no2,
                    draw.drwt_no3,
                    draw.drwt_no4,
                    draw.drwt_no5,
                    draw.drwt_no6,
                  ].map((num) => (
                    <div
                      key={num}
                      className={`
                                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                                            ${
                                              num <= 10
                                                ? "bg-yellow-500"
                                                : num <= 20
                                                  ? "bg-blue-500"
                                                  : num <= 30
                                                    ? "bg-red-500"
                                                    : num <= 40
                                                      ? "bg-gray-500"
                                                      : "bg-green-500"
                                            }
                                        `}
                    >
                      {num}
                    </div>
                  ))}
                  <span className="text-2xl font-bold text-muted-foreground mx-1">
                    +
                  </span>
                  <div className="w-10 h-10 rounded-full bg-transparent border-2 border-green-500 flex items-center justify-center font-bold text-green-500">
                    {draw.bnus_no}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
