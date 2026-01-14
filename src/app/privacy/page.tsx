import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "로또탐정 개인정보처리방침",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold mb-2">1. 수집하는 개인정보</h2>
          <p>회원가입 및 서비스 제공을 위해 아래 정보를 수집할 수 있습니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>필수: 이메일, 비밀번호</li>
            <li>선택: 닉네임, 문의 내용</li>
            <li>자동수집: 서비스 이용기록, 접속 로그, 쿠키, IP 주소</li>
            <li>결제: 입금자명, 결제내역</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">
            2. 개인정보 이용 목적
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별 및 서비스 제공</li>
            <li>고객 문의 대응 및 공지 전달</li>
            <li>결제 확인 및 포인트 지급</li>
            <li>서비스 품질 개선 및 보안 강화</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">
            3. 개인정보 보유 및 이용기간
          </h2>
          <p>
            개인정보는 수집 및 이용 목적이 달성된 후 지체 없이 파기합니다. 다만,
            관계 법령에 따라 일정 기간 보관할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>계약/청약철회 기록: 5년</li>
            <li>대금결제 및 재화 공급 기록: 5년</li>
            <li>소비자 불만/분쟁 처리 기록: 3년</li>
            <li>표시/광고 기록: 6개월</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">
            4. 개인정보 제3자 제공
          </h2>
          <p>
            원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만, 법령에 따른
            요청이 있는 경우 제공될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">
            5. 개인정보 처리 위탁
          </h2>
          <p>
            개인정보 처리 업무를 외부에 위탁하지 않습니다. 위탁이 필요한 경우
            관련 법령에 따라 사전 고지합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수
            있습니다. 요청은 고객 문의 이메일로 접수합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">7. 쿠키 운용</h2>
          <p>
            서비스 이용 편의를 위해 쿠키를 사용할 수 있으며, 브라우저 설정을
            통해 쿠키 저장을 거부할 수 있습니다. 단, 일부 기능이 제한될 수
            있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">
            8. 개인정보 보호책임자
          </h2>
          <p>이메일: yeonhokr@gmail.com</p>
        </section>
      </div>

      <p className="text-sm text-muted-foreground mt-8">시행일: 2026-01-15</p>
    </div>
  );
}
