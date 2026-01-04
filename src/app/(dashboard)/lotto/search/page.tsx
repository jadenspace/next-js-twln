"use client";

import { useState, useEffect } from "react";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { DateRange, Range } from "react-date-range";
import { ko } from "date-fns/locale";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar as CalendarIcon, Hash } from "lucide-react";
import { format, subMonths } from "date-fns";
import { cn } from "@/shared/lib/utils";

export default function SearchPage() {
  const [searchType, setSearchType] = useState<"drwNo" | "date">("drwNo");
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: subMonths(new Date(), 1),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [isMobile, setIsMobile] = useState(false);
  const [queryParam, setQueryParam] = useState<{
    type: string;
    start: string;
    end: string;
  } | null>(null);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["lottoSearch", queryParam],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryParam) {
        if (queryParam.type === "drwNo") {
          if (queryParam.start) params.append("drwNoStart", queryParam.start);
          if (queryParam.end) params.append("drwNoEnd", queryParam.end);
        } else if (queryParam.type === "date") {
          if (queryParam.start) params.append("dateStart", queryParam.start);
          if (queryParam.end) params.append("dateEnd", queryParam.end);
        }
      }
      const res = await fetch(`/api/lotto/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    // enabled: !!queryParam // Initial load fetches recent 10
  });

  // 초기 로드 시 또는 searchResults 변경 시 회차 기본값 설정
  useEffect(() => {
    if (
      searchType === "drwNo" &&
      !startValue &&
      !endValue &&
      searchResults?.data &&
      searchResults.data.length > 0
    ) {
      const latestDraw = Math.max(
        ...searchResults.data.map((draw: any) => draw.drw_no),
      );
      setEndValue(latestDraw.toString());
      setStartValue((latestDraw - 9).toString());
    }
  }, [searchResults, searchType, startValue, endValue]);

  const handleSearch = () => {
    if (searchType === "drwNo") {
      if (!startValue && !endValue) return;
      setQueryParam({ type: searchType, start: startValue, end: endValue });
    } else {
      if (!dateRange[0]?.startDate || !dateRange[0]?.endDate) return;
      const start = format(dateRange[0].startDate, "yyyy-MM-dd");
      const end = format(dateRange[0].endDate, "yyyy-MM-dd");
      setQueryParam({ type: searchType, start, end });
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">로또 당첨번호 검색</h1>
      <p className="text-muted-foreground mb-8">
        회차별 또는 날짜별로 과거 당첨번호를 조회해보세요.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-2">
          <Button
            variant={searchType === "drwNo" ? "default" : "outline"}
            onClick={() => {
              setSearchType("drwNo");
              setDateRange([]);

              // 최근 회차 데이터에서 가장 큰 회차 찾기
              if (searchResults?.data && searchResults.data.length > 0) {
                const latestDraw = Math.max(
                  ...searchResults.data.map((draw: any) => draw.drw_no),
                );
                setEndValue(latestDraw.toString());
                setStartValue((latestDraw - 9).toString());
              } else {
                setStartValue("");
                setEndValue("");
              }
            }}
          >
            <Hash className="w-4 h-4 mr-2" />
            회차 검색
          </Button>
          <Button
            variant={searchType === "date" ? "default" : "outline"}
            onClick={() => {
              setSearchType("date");
              setStartValue("");
              setEndValue("");
              const today = new Date();
              const oneMonthAgo = subMonths(today, 1);
              setDateRange([
                {
                  startDate: oneMonthAgo,
                  endDate: today,
                  key: "selection",
                },
              ]);
            }}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            날짜 검색
          </Button>
        </div>

        {searchType === "drwNo" ? (
          <div className="flex gap-2">
            <Input
              placeholder="시작 회차"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <span className="hidden sm:flex items-center text-muted-foreground">
              ~
            </span>
            <Input
              placeholder="종료 회차"
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("flex-1 justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange[0]?.startDate && dateRange[0]?.endDate ? (
                    <>
                      {format(dateRange[0].startDate, "yyyy-MM-dd")} ~{" "}
                      {format(dateRange[0].endDate, "yyyy-MM-dd")}
                    </>
                  ) : (
                    <span>날짜 범위를 선택하세요</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className={cn(
                  "p-0 overflow-hidden",
                  isMobile ? "w-screen max-w-[100vw]" : "w-auto",
                )}
                align={isMobile ? "center" : "start"}
              >
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => setDateRange([item.selection])}
                  locale={ko}
                  months={isMobile ? 1 : 2}
                  direction={isMobile ? "vertical" : "horizontal"}
                  showDateDisplay={false}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleSearch} className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        )}
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
                  <div className="w-full md:w-auto" />
                  <span className="text-xs text-muted-foreground">보너스</span>
                  <div
                    className={`
                      w-10 h-10 rounded-full bg-transparent border-2 flex items-center justify-center font-bold
                      ${
                        draw.bnus_no <= 10
                          ? "border-yellow-500 text-yellow-500"
                          : draw.bnus_no <= 20
                            ? "border-blue-500 text-blue-500"
                            : draw.bnus_no <= 30
                              ? "border-red-500 text-red-500"
                              : draw.bnus_no <= 40
                                ? "border-gray-500 text-gray-500"
                                : "border-green-500 text-green-500"
                      }
                    `}
                  >
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
