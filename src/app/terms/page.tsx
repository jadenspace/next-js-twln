import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "로또탐정 이용약관",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">이용약관</h1>
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold mb-2">1. 목적</h2>
          <p>
            본 약관은 로또탐정(이하 “회사”)이 제공하는 서비스 이용과 관련하여
            회사와 이용자 간 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">2. 용어 정의</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스: 회사가 제공하는 로또 분석 및 관련 기능</li>
            <li>회원: 약관에 동의하고 계정을 생성한 이용자</li>
            <li>유료서비스: 결제 후 이용 가능한 기능</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">3. 회원가입</h2>
          <p>
            회원은 가입 신청 시 정확한 정보를 제공해야 하며, 허위 정보로 인한
            불이익은 회원에게 있습니다. 회사는 부정 이용이 의심되는 경우 서비스
            제공을 제한할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">4. 서비스 제공</h2>
          <p>
            서비스는 연중무휴 제공을 원칙으로 하되, 시스템 점검 및 불가피한
            사유로 일시 중단될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">5. 유료서비스</h2>
          <p>
            유료서비스 이용 요금 및 결제 방식은 별도 안내에 따르며, 환불은 “결제
            및 환불 정책”에 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">6. 게시물 관리</h2>
          <p>
            이용자가 게시한 콘텐츠의 책임은 이용자에게 있으며, 회사는 관련 법령
            및 정책에 위반되는 게시물에 대해 삭제 또는 이용 제한 조치를 할 수
            있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">7. 면책</h2>
          <p>
            회사는 통계 기반 분석 정보를 제공하며, 당첨 보장 또는 기대이익을
            보장하지 않습니다. 서비스 이용의 최종 책임은 이용자에게 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">8. 분쟁 해결</h2>
          <p>
            서비스 이용과 관련된 분쟁은 상호 협의로 해결하며, 협의가 어려운 경우
            관련 법령에 따릅니다.
          </p>
        </section>
      </div>

      <p className="text-sm text-muted-foreground mt-8">시행일: 2026-01-15</p>
    </div>
  );
}
