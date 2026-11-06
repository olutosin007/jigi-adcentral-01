# Phase 5 — Video (Deferred)

**Initiative:** [Generation Studio](./README.md)
**Status:** Deferred (provider) — scaffold shipped Wave 5 (`038_generation_jobs`, `POST /api/generate/video` → 501, `VIDEO_ENABLED=false`, no UI)

---

## Why deferred

Video takes 1–5 minutes per clip, which does not fit a synchronous API request. It needs job infrastructure the image path doesn't.

## When picked up

1. **Jobs:** `generation_jobs` table (`id, campaign_id, kind, provider, provider_task_id, status, progress, result_asset_id, error`), Supabase Realtime for progress.
2. **Kling video:** `POST /v1/videos/image2video` with `callback_url` → `POST /api/webhooks/kling` (verify `external_task_id`), download to storage (Kling purges at 30 days).
3. **Default:** image→video from an *approved* still ("Animate" on approved cards). Kling 2.6 no-audio ($0.042/s @720p) for drafts, Kling 3.0 ($0.084/s) for finals.
4. **Router:** add `modality: 'video'` to `buildRouteChain`; registry entries priced per second.
5. **Alternatives to re-price at the time:** Veo 3.1 Lite (audio, $0.05/s), MiniMax Hailuo H3 ($0.08/s with audio).
