<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:language-policy -->
# Language

- Product UI (nav, dashboard, buttons, toasts) is **one language at a time**. Do not mix languages in chrome.
- Active UI locale: `UI_LOCALE` in `src/lib/i18n/locale.ts` (currently `en`).
- Conversational AI (search chat, admin assistant) must reply in the **user’s message language**.
- Catalog/content generation follows `UI_LOCALE` so listings match the chrome.
<!-- END:language-policy -->
