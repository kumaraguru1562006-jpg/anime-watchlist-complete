# 🍙 AniChat Fine-Tuning Guide (Using AniList API Dataset)

This guide explains how to use your extracted AniList training datasets to fine-tune a custom AI model for **AniChat**.

---

## 1. Generated Dataset Files

The extraction pipeline creates two standard dataset formats inside `server/data/`:

| File | Format | Best For |
|------|--------|----------|
| `anilist_training_dataset.jsonl` | Chat Messages (`system`, `user`, `assistant`) | **Google AI Studio (Gemini)**, **OpenAI (GPT-4o-mini)** |
| `anilist_training_dataset_alpaca.json` | Instruction/Input/Output | **Local Models** (Ollama, LLaMA-Factory, Unsloth, HuggingFace) |

---

## 2. Re-running or Expanding the Extractor

You can extract more pages (hundreds or thousands of anime) anytime by running:

```bash
# In the server directory:
npm run train:extract

# Or with custom pages and per-page limits:
node scripts/extractAniListDataset.js --pages=5 --per-page=50
```

This will automatically query AniList's GraphQL API, paginate through the top-ranked and trending anime, and append newly structured instruction pairs.

---

## 3. How to Fine-Tune on Google AI Studio (Gemini Tuned Models)

1. Open [Google AI Studio](https://aistudio.google.com).
2. On the left sidebar, click **"Model Tuning"** (or **"Create Tuned Model"**).
3. Under **Dataset**, click **Import** and upload:
   `server/data/anilist_training_dataset.jsonl`
4. Choose the base model:
   - `gemini-1.5-flash-001` or `gemini-2.5-flash` (recommended for fast, lightweight responses)
5. Set hyperparameters (default settings work great, or set Epochs: 3–5).
6. Click **Tune Model**. Google AI Studio will train the model in the cloud.
7. Once finished, copy your tuned model resource name (e.g., `tunedModels/anichat-v1-...`).
8. Add this model ID to your server's `.env` or client AI settings!

---

## 4. How to Fine-Tune on OpenAI

1. Open the [OpenAI Fine-Tuning Dashboard](https://platform.openai.com/finetune).
2. Click **Create**.
3. Select base model: `gpt-4o-mini`.
4. Upload `server/data/anilist_training_dataset.jsonl` as the Training Data.
5. Click **Create** to launch the fine-tuning job.
6. Once complete, your custom model name (e.g., `ft:gpt-4o-mini:your-org::...`) will be ready to use in AniChat.

---

## 5. Local Fine-Tuning (Ollama / Unsloth / Hugging Face)

For local training using Llama 3, Mistral, or Qwen:
- Use `server/data/anilist_training_dataset_alpaca.json`.
- Compatible directly with [Unsloth](https://github.com/unslothai/unsloth) or [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory).
