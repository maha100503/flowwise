Trigger ─→ RSS fetches 10 articles ─→ Aggregator picks top 5
  ─→ Gemini summarizes into markdown ─→ Markdown converts to HTML
  ─→ Email sends the final digest


Outlook (Read Inbox, filter: subject contains "support")
    │
    ▼
AI (chartgpt) — "Classify this email: urgent/normal/spam"
    │
    ▼
Conditional — if classification == "urgent"
    │                    │
    ▼ TRUE               ▼ FALSE
Teams (Send to           Outlook (Send auto-reply:
 #support-urgent)        "We received your request")