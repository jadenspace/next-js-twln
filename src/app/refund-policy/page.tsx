import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제 및 환불 정책",
  description: "로또탐정 결제 및 환불 정책",
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">결제 및 환불 정책</h1>
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold mb-2">1. 결제 방식</h2>
          <p>
            서비스는 무통장 입금을 통해 결제되며, 입금 확인 후 포인트가
            지급됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">2. 환불 기준</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>입금 승인 전: 요청 시 결제 취소가 가능합니다.</li>
            <li>
              입금 승인 후(포인트 지급 완료): 디지털 콘텐츠 특성상 환불이 제한될
              수 있습니다.
            </li>
            <li>오류 결제 또는 중복 결제는 확인 후 환불합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">3. 환불 절차</h2>
          <p>
            문의/답변 게시판 또는 이메일로 요청해주세요. 확인 후 안내된 절차에
            따라 처리됩니다.
          </p>
          <p className="mt-2">이메일: yeonhokr@gmail.com</p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">4. 기타</h2>
          <p>
            환불 처리는 영업일 기준으로 진행되며, 금융기관 사정에 따라 지연될 수
            있습니다.
          </p>
        </section>
      </div>

      <p className="text-sm text-muted-foreground mt-8">시행일: 2026-01-15</p>
    </div>
  );
}
