import Link from "next/link";

const POLICY_LINKS = [
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/refund-policy", label: "결제 및 환불 정책" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="w-full max-w-screen-xl mx-auto px-4 py-10 text-sm text-muted-foreground">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-foreground font-semibold mb-3">정책/약관</h3>
            <ul className="space-y-2">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3">사업자 정보</h3>
            <div className="space-y-1 leading-relaxed">
              <p>상호명: 로또탐정</p>
              <p>대표자명: 김연호</p>
              <p>사업자등록번호: 미정</p>
              <p>통신판매업 신고번호: 미정</p>
              <p>사업장 소재지: 미정</p>
              <p>고객 문의: yeonhokr@gmail.com</p>
            </div>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3">
              서비스 면책/고지
            </h3>
            <p className="leading-relaxed">
              본 서비스는 로또 당첨을 보장하지 않으며, 분석 결과는 통계적
              참고자료입니다. 서비스 이용 결과에 대한 최종 책임은 이용자에게
              있습니다.
            </p>
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3">
              고객 문의/운영
            </h3>
            <div className="space-y-2 leading-relaxed">
              <p>
                <Link
                  href="/community"
                  className="hover:text-foreground transition-colors"
                >
                  문의/답변
                </Link>
              </p>
              <p>
                <Link
                  href="mailto:yeonhokr@gmail.com"
                  className="hover:text-foreground transition-colors"
                >
                  이메일 문의
                </Link>
              </p>
              <p className="text-xs">* 48시간 내 답변</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} 로또탐정. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
