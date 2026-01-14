"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { createClient } from "@/shared/lib/supabase/client";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { TrendingUp, ExternalLink, MapPin } from "lucide-react";

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
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function LottoResultCard() {
  const [latestDraw, setLatestDraw] = useState<LottoDraw | null>(null);
  const [countdown, setCountdown] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestDraw();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatestDraw = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("lotto_draws")
        .select("*")
        .order("drw_no", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLatestDraw(data);
      }
    } catch (error) {
      console.error("Failed to fetch latest draw:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();

    const daysUntilSaturday = (6 - dayOfWeek) % 7;
    let nextSaturday: Date;

    if (daysUntilSaturday === 0 && now.getHours() >= 20) {
      nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + 7);
      nextSaturday.setHours(20, 30, 0, 0);
    } else {
      nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + daysUntilSaturday);
      nextSaturday.setHours(20, 30, 0, 0);
    }

    const diff = nextSaturday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setCountdown({ days, hours, minutes, seconds });
  };

  const winningNumbers = latestDraw
    ? [
        latestDraw.drwt_no1,
        latestDraw.drwt_no2,
        latestDraw.drwt_no3,
        latestDraw.drwt_no4,
        latestDraw.drwt_no5,
        latestDraw.drwt_no6,
      ]
    : [];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            최신 로또 당첨번호
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            불러오는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          최신 로또 당첨번호
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestDraw ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                제{latestDraw.drw_no}회
              </span>
              <span className="text-sm text-muted-foreground">
                {latestDraw.drw_no_date}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {winningNumbers.map((num) => (
                <LotteryBall key={num} number={num} />
              ))}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm font-medium text-muted-foreground">
                  보너스
                </span>
                <LotteryBall number={latestDraw.bnus_no} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            당첨번호 정보가 없습니다.
          </div>
        )}

        <div className="border-t pt-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">다음 회차까지</p>
            <div className="flex justify-center gap-3">
              <CountdownItem value={countdown.days} label="일" />
              <CountdownItem value={countdown.hours} label="시" />
              <CountdownItem value={countdown.minutes} label="분" />
              <CountdownItem value={countdown.seconds} label="초" />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex gap-2">
            <a
              href="https://www.dhlottery.co.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                로또 구매하기
              </Button>
            </a>
            <a
              href="https://www.dhlottery.co.kr/prchsplcsrch/home"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full" size="lg" variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                판매점 찾기
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CountdownItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-xl">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
