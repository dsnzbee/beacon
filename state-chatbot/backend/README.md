# Beacon Python AI Backend

This is the first Python backend for the Beacon chatbot.

Run it from the `state-chatbot` folder:

```bash
python backend/server.py
```

The React app sends chatbot requests to:

```txt
POST /api/chat
```

The current AI flow is intentionally simple and beginner-friendly:

1. Detect the user's intent with keyword-based NLP.
2. Load local text documents for the selected province.
3. Retrieve the most relevant notes.
4. Generate a structured answer from those notes.

Later, PDF support can be added by extracting PDF text into the matching folder under `backend/documents`.
