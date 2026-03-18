# Azure OpenAI image deployments

## DALL·E 3 deprecated (March 2026)

**DALL·E 3** (Version 3.0) is deprecated in Azure OpenAI and can no longer be deployed. The error you may see:

- `ServiceModelDeprecated: The model '...dall-e-3,Version:3.0' has been deprecated since 03/04/2026`

**Use the GPT Image family instead:** deploy **GPT-Image-1-Mini**, **GPT-Image-1**, or **GPT-Image-1.5** and point the app at that deployment name.

---

## Working alternative: GPT Image family

The app is configured to use **GPT Image** models. You need **one** deployment (or more if you want different tiers on different models):

| Deployment name (use in Azure) | Model in Azure | Use in app |
|-------------------------------|----------------|------------|
| `gpt-image-1-mini`            | GPT-Image-1-Mini | Draft, Refine, Final (default in .env.example) |
| `gpt-image-1`                 | GPT-Image-1    | Optional; set `AZURE_OPENAI_IMAGE_MODEL_FINAL=gpt-image-1` for higher quality final tier |
| `gpt-image-1.5`               | GPT-Image-1.5  | Optional; same as above |

- **GPT-Image-1-Mini:** cost-efficient, fast; good for draft/refine and as single deployment for all tiers.
- **GPT-Image-1 / 1.5:** higher quality; use for “Final Polish” if you set the env vars accordingly.

---

## What to do in Azure

1. Open **Azure Portal** → your **Azure OpenAI** resource (e.g. `jigi-openai`).
2. Go to **Deployments** (Resource management → Deployments, or Azure OpenAI Studio).
3. **Create a new deployment** (do **not** select DALL·E 3):
   - **Model:** Choose **GPT-Image-1-Mini** (or GPT-Image-1 / GPT-Image-1.5 if available in your region).
   - **Deployment name:** Set to **`gpt-image-1-mini`** (must match exactly what the app uses).
4. If you don’t see GPT Image models, you may need to **apply for limited access**: [GPT-image-1 access](https://aka.ms/oai/gptimage1access), [GPT-image-1.5 access](https://aka.ms/oai/gptimage1.5access).
5. After the deployment is created, wait a minute and retry “Generate Image” in the app.

---

## App configuration

The app uses these env vars (see `uiux/jigi-app/.env.example`):

- `AZURE_OPENAI_IMAGE_DEPLOYMENT` or `AZURE_OPENAI_DEPLOYMENT_DALLE` — deployment name for image generation (default: `gpt-image-1-mini`).
- `AZURE_OPENAI_IMAGE_MODEL_DRAFT` / `_REFINE` / `_FINAL` — per-tier deployment names (default: all `gpt-image-1-mini`).
- `AZURE_OPENAI_IMAGE_API_VERSION` — use **`2025-04-01-preview`** (or later) for GPT Image.

The code in `api/lib/azure-image.ts` detects GPT Image deployments (name contains `gpt-image`), uses GPT-Image–compatible sizes (1024×1024, 1536×1024, 1024×1536), sends `quality: medium`, and supports both `url` and `b64_json` responses.

---

## If you still see DeploymentNotFound

That means the **deployment name** in your env does not exist in your Azure resource. Ensure:

1. A deployment exists in Azure with **exactly** the name you use in env (e.g. `gpt-image-1-mini`).
2. `.env.local` (or your runtime env) has:
   - `AZURE_OPENAI_IMAGE_DEPLOYMENT=gpt-image-1-mini` (or your deployment name)
   - `AZURE_OPENAI_IMAGE_API_VERSION=2025-04-01-preview`
3. Restart the app/API after changing env.
