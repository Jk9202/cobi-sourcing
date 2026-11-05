---
name: expert-router
description: 어떤 업무든 시작할 때 사용한다. 업무 유형을 판별해 가장 알맞은 기존 스킬 하나를 골라 호출하고, 그 분야 전문가의 방식으로 작업하도록 안내하는 통합 라우터. 문서, 슬라이드, 엑셀, PDF, UI 디자인, 글쓰기, 마케팅, 리서치, 기획, 코드 리뷰, 디버깅 등.
---

# 통합 라우터

1. 요청의 업무 유형을 아래 표에서 고른다. 중복 스킬이 많으므로 표의 1순위만 쓴다. 해당 스킬이 없으면 2순위로 간다.
2. 고른 스킬을 호출하고, CLAUDE.md의 "전문가 방식 우선" 원칙을 따른다.
3. 표에 없는 업무는 스킬 없이 전문가 방식 조사 후 작업한다.

| 업무 | 1순위 | 2순위 |
|---|---|---|
| Word 문서 | office-docs-skills-a0005:docx | anthropic-skills:docx |
| PDF | office-docs-skills-a0005:pdf | anthropic-skills:pdf |
| 엑셀 | office-docs-skills-a0005:xlsx | anthropic-skills:xlsx |
| PPT 제작 | office-docs-skills-a0005:pptx | anthropic-skills:pptx |
| 이미지를 편집 가능한 PPT로 | ppt-editing-skills-a0015:image-to-editable-ppt | ppt-skills-set-a:image-to-editable-ppt-gorden |
| 웹/앱 UI 디자인 | ui-visual-skills-a0004:ui-ux-pro-max | ui-visual-skills-a0004:frontend-design |
| 디자인 시스템/브랜드 | ui-visual-skills-a0004:design-system | ui-visual-skills-a0004:brand-guidelines |
| 차트/대시보드 | dataviz | artifact-design |
| 심층 리서치 | anthropic-skills:deep-research | curated-skills-a0012:research |
| 경쟁사 분석 | pm-skills-a0008:09-competitive-analysis-gpm | writing-skills-a0002:competitor-profiling |
| PRD/기획서 | pm-skills-a0008:03-prd-writing-gpm | writing-skills-a0002:prd-generator |
| 로드맵/우선순위 | pm-skills-a0008:10-roadmap-narrative-gpm | pm-skills-a0008:11-prioritization-brief-gpm |
| 카피/마케팅 글 | writing-skills-a0002:copywriting | writing-skills-a0002:content-strategy |
| 학술 논문 | writing-skills-a0002:academic-paper | curated-skills-a0012:10-nature-writing |
| AI 말투 제거 | humanizer-skills-a0019:humanizer-zh | humanizer-skills-a0019:humanizer |
| 코드 리뷰 | code-review | curated-skills-a0012:06-code-review |
| 디버깅 | curated-skills-a0012:07-systematic-debugging | - |
| 테스트 주도 개발 | curated-skills-a0012:03-tdd | - |
| 웹앱 테스트 | curated-skills-a0012:08-webapp-testing | - |
| 새 스킬 제작 | anthropic-skills:skill-creator | office-skills-01:skill-29 |
| Claude API 개발 | claude-api | - |
| 공지/사내 커뮤니케이션 | office-skills-01:skill-11 | pm-skills-a0008:01-exec-comms-gpm |
