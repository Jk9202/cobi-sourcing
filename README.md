# COBI Sourcing OS — 배포 가이드

## 1단계: Supabase DB 설정 (3분)

1. [supabase.com](https://supabase.com) → 프로젝트 대시보드 접속
2. 왼쪽 메뉴 **SQL Editor** 클릭
3. `supabase-migration.sql` 파일 내용 전체 복사 → 붙여넣기 → **▶ Run**
4. 왼쪽 메뉴 **Database → Replication** 접속
5. `events`, `suppliers`, `purchase_orders` 옆 토글 **ON** (Realtime 활성화)

---

## 2단계: GitHub에 올리기 (2분)

1. [github.com](https://github.com) 로그인 → **New repository**
2. 이름: `cobi-sourcing` → **Create repository**
3. 터미널에서:

```bash
cd cobi-sourcing
npm install
git init
git add .
git commit -m "init"
git remote add origin https://github.com/[내아이디]/cobi-sourcing.git
git push -u origin main
```

> 터미널이 없다면 GitHub 웹에서 파일을 직접 업로드해도 됩니다.

---

## 3단계: Vercel 배포 (2분)

1. [vercel.com](https://vercel.com) → GitHub 계정으로 로그인
2. **Add New → Project** → `cobi-sourcing` 저장소 선택
3. 설정 건드리지 말고 그냥 **Deploy** 클릭
4. 완료! → 발급된 URL을 폰에서도 접속 가능

---

## 앱 사용 방법

- 처음 접속 시 **워크스페이스 코드** 입력 (예: `cobi2026`)
- 같은 코드를 폰/컴퓨터 어디서든 입력하면 **같은 데이터 공유**
- 데이터는 Supabase 클라우드에 저장 → 새로고침해도 유지
- 헤더 오른쪽 🟢 점 = 동기화 상태 표시

---

## 폰 홈화면에 앱으로 추가

**아이폰**: Safari로 접속 → 공유 버튼 → 홈 화면에 추가  
**안드로이드**: Chrome으로 접속 → 메뉴 → 앱 설치 / 홈 화면에 추가
