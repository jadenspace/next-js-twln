"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/shared/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

interface LottoDraw {
  drw_no: number;
  drw_no_date: string;
  drwt_no1: number;
  drwt_no2: number;
  drwt_no3: number;
  drwt_no4: number;
  drwt_no5: number;
  drwt_no6: number;
  bnus_no: number;
  first_win_amnt: number;
  first_przwner_co: number;
  tot_sell_amnt: number;
  rnk2_win_nope: number;
  rnk2_win_amt: number;
  rnk3_win_nope: number;
  rnk3_win_amt: number;
  rnk4_win_nope: number;
  rnk4_win_amt: number;
  rnk5_win_nope: number;
  rnk5_win_amt: number;
  whol_epsd_sum_ntsl_amt: number;
}

interface LottoQueryParam {
  type: "drwNo";
  start: string;
  end: string;
}

export default function SearchPage() {
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const [queryParam, setQueryParam] = useState<Partial<LottoQueryParam>>({});
  const [latestDraw, setLatestDraw] = useState<number | null>(null);
  const [drawNumberOptions, setDrawNumberOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["lottoSearch", queryParam],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryParam) {
        if (queryParam.type === "drwNo") {
          if (queryParam.start) params.append("drwNoStart", queryParam.start);
          if (queryParam.end) params.append("drwNoEnd", queryParam.end);
        }
      }
      const res = await fetch(`/api/lotto/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  useEffect(() => {
    // This effect should only run once to populate the options
    if (
      latestDraw === null &&
      searchResults?.data &&
      searchResults.data.length > 0
    ) {
      const latest = searchResults.data[0].drw_no;
      setLatestDraw(latest);
      const options = Array.from({ length: latest }, (_, i) => ({
        value: (latest - i).toString(),
        label: `${latest - i}회`,
      }));
      setDrawNumberOptions(options);

      if (!startValue && !endValue) {
        setEndValue(latest.toString());
        setStartValue((latest - 9).toString());
      }
    }
  }, [searchResults, latestDraw, startValue, endValue]);

  useEffect(() => {
    if (
      startValue &&
      endValue &&
      parseInt(startValue, 10) > parseInt(endValue, 10)
    ) {
      const temp = startValue;
      setStartValue(endValue);
      setEndValue(temp);
    }
  }, [startValue, endValue]);

  const handleSearch = () => {
    if (!startValue && !endValue) return;
    setQueryParam({ type: "drwNo", start: startValue, end: endValue });
  };

  const handleQuickSelect = (count: number) => {
    if (latestDraw) {
      setEndValue(latestDraw.toString());
      setStartValue((latestDraw - count + 1).toString());
    }
  };

  const LottoNumber = ({ num }: { num: number }) => {
    const getColor = (n: number) => {
      if (n <= 10) return "bg-yellow-500";
      if (n <= 20) return "bg-blue-500";
      if (n <= 30) return "bg-red-500";
      if (n <= 40) return "bg-gray-500";
      return "bg-green-500";
    };
    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getColor(
          num,
        )}`}
      >
        {num}
      </div>
    );
  };

  const BonusLottoNumber = ({ num }: { num: number }) => {
    const getColor = (n: number) => {
      if (n <= 10) return "border-yellow-500 text-yellow-500";
      if (n <= 20) return "border-blue-500 text-blue-500";
      if (n <= 30) return "border-red-500 text-red-500";
      if (n <= 40) return "border-gray-500 text-gray-500";
      return "border-green-500 text-green-500";
    };
    return (
      <div
        className={`w-10 h-10 rounded-full bg-transparent border-2 flex items-center justify-center font-bold ${getColor(
          num,
        )}`}
      >
        {num}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">로또 당첨번호 검색</h1>
      <p className="text-muted-foreground mb-8">
        회차별로 과거 당첨번호를 조회해보세요.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={openStart} onOpenChange={setOpenStart}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openStart}
                className="w-[120px] justify-between"
              >
                {startValue
                  ? drawNumberOptions.find(
                      (option) => option.value === startValue,
                    )?.label
                  : "시작 회차"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="회차 검색..." />
                <CommandList>
                  <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                  <CommandGroup>
                    {drawNumberOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          setStartValue(
                            currentValue === startValue ? "" : currentValue,
                          );
                          setOpenStart(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            startValue === option.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">~</span>

          <Popover open={openEnd} onOpenChange={setOpenEnd}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openEnd}
                className="w-[120px] justify-between"
              >
                {endValue
                  ? drawNumberOptions.find(
                      (option) => option.value === endValue,
                    )?.label
                  : "종료 회차"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="회차 검색..." />
                <CommandList>
                  <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                  <CommandGroup>
                    {drawNumberOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          setEndValue(
                            currentValue === endValue ? "" : currentValue,
                          );
                          setOpenEnd(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            endValue === option.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button onClick={handleSearch} className="shrink-0" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(5)}
          >
            최근 5회
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(10)}
          >
            최근 10회
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(20)}
          >
            최근 20회
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(30)}
          >
            최근 30회
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <Spinner className="text-primary" />
        </div>
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
          {searchResults?.data?.map((draw: LottoDraw) => (
            <Dialog key={draw.drw_no}>
              <Card className="overflow-hidden">
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
                      <LottoNumber key={num} num={num} />
                    ))}
                    <div className="w-full md:w-auto" />
                    <span className="text-xs text-muted-foreground">
                      보너스
                    </span>
                    <BonusLottoNumber num={draw.bnus_no} />
                  </div>
                  <div className="mt-4 text-center">
                    <DialogTrigger asChild>
                      <Button variant="outline">당첨정보 상세보기</Button>
                    </DialogTrigger>
                  </div>
                </CardContent>
              </Card>

              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    <span className="text-primary">{draw.drw_no}회</span> 당첨
                    상세정보
                  </DialogTitle>
                  <DialogDescription>({draw.drw_no_date})</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-center">
                      당첨번호
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      {[
                        draw.drwt_no1,
                        draw.drwt_no2,
                        draw.drwt_no3,
                        draw.drwt_no4,
                        draw.drwt_no5,
                        draw.drwt_no6,
                      ].map((num) => (
                        <LottoNumber key={num} num={num} />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">
                        보너스
                      </span>
                      <BonusLottoNumber num={draw.bnus_no} />
                    </div>
                  </div>

                  {draw.drw_no > 1200 ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-center">
                        등위별 당첨정보
                      </h3>
                      <div className="space-y-2 text-sm">
                        {[
                          {
                            rank: 1,
                            winners: draw.first_przwner_co,
                            amount: draw.first_win_amnt,
                            note: "당첨번호 6개 일치",
                          },
                          {
                            rank: 2,
                            winners: draw.rnk2_win_nope,
                            amount: draw.rnk2_win_amt,
                            note: "당첨번호 5개 + 보너스 번호 일치",
                          },
                          {
                            rank: 3,
                            winners: draw.rnk3_win_nope,
                            amount: draw.rnk3_win_amt,
                            note: "당첨번호 5개 일치",
                          },
                          {
                            rank: 4,
                            winners: draw.rnk4_win_nope,
                            amount: draw.rnk4_win_amt,
                            note: "당첨번호 4개 일치 (50,000원)",
                          },
                          {
                            rank: 5,
                            winners: draw.rnk5_win_nope,
                            amount: draw.rnk5_win_amt,
                            note: "당첨번호 3개 일치 (5,000원)",
                          },
                        ].map((item) => (
                          <div
                            key={item.rank}
                            className="p-3 bg-muted/50 rounded-md grid grid-cols-2 items-center"
                          >
                            <div className="font-bold text-base">
                              {item.rank}등
                            </div>
                            <div className="text-right">
                              <div>
                                <p className="font-semibold">
                                  {Number(item.amount || 0).toLocaleString()}원
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ({(item.winners || 0).toLocaleString()}명)
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.note}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-center">
                        1등 당첨정보
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-muted-foreground">1등 당첨자 수</p>
                          <p className="font-semibold text-lg">
                            {draw.first_przwner_co?.toLocaleString() || "N/A"}명
                          </p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-muted-foreground">1등 당첨금</p>
                          <p className="font-semibold text-lg text-primary">
                            {Number(draw.first_win_amnt || 0).toLocaleString()}
                            원
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">총 판매금액</p>
                    <p className="font-semibold text-lg">
                      {Number(
                        draw.drw_no >= 1201
                          ? draw.whol_epsd_sum_ntsl_amt
                          : draw.tot_sell_amnt || 0,
                      ).toLocaleString()}
                      원
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}
