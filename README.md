# Dock Point – Maritime Port Container Management Simulator

## Run locally
**Best (saves to the JSON files):** install Python 3, then in this folder run `python server.py` and open http://localhost:8000
**Quick look:** double-click `index.html` (works, but data is kept in the browser's localStorage, not the JSON files).

## Files
- `index.html` – all pages (landing, login, sign up, client and authority dashboards)
- `css/style.css`, `js/app.js` (logic), `js/captcha.js` (separate CAPTCHA module)
- `data/clients.json` – 9 seeded clients and their cargo
- `data/new_users.json` – empty, ready for new sign-ups (saved here and used for later login checks)
- `data/authority.json` – the single authority (read-only; no sign-up exists and the server refuses writes)
- `data/port.json` – 30 ships (5 under maintenance), 12 time slots, 50,000 labour, containers
- `data/seed.js` – copy of the data used only in double-click mode (regenerate with `python build_data.py`)
- `server.py` – tiny local server, no installs needed

## Demo logins
Client: Rajat Shetty / 9817394829 / rajatshetty12@gmail.com / 6627112892
Authority: Ashok Gupta / 846283974931 / ASGU343
CAPTCHA is case-insensitive.

## Rules enforced
- The same email id can never register twice (any mobile number). Same mobile with a new email is allowed.
- No authority sign-up; only one authority.
- Price: up to 10 t $10,000; 10-50 t $20,000; above 50 t $45,000; immediate loading +15%.
To reset sign-ups: set `data/new_users.json` back to `[]`.


## Private AI API key (prepared; AI feature not connected yet)

1. Open the project folder.
2. Open the `.env` file in Notepad or VS Code.
3. Replace `PASTE_YOUR_API_KEY_HERE` with your real key and save.
4. Keep `.env` private. It is excluded from Git by `.gitignore`.

The Python server reads `AI_API_KEY` on startup and keeps it on the server side. It does **not** expose the key to the browser. The current Dock Point app does not yet make AI requests, so adding a key alone will not add AI features; an AI feature and provider-specific API call still need to be implemented.

For GitHub, `.env.example` is the safe template. Do not upload `.env`. If you ever accidentally commit a real key, revoke/rotate it immediately; deleting it in a later commit is not enough.

## Important before publishing

- `data/new_users.json` is ignored because it can contain information entered by users. Keep real registrations out of GitHub.
- Review the sample records in `data/clients.json`, `data/authority.json`, `data/seed.js`, and `build_data.py`. They contain realistic-looking names, contact details, email addresses, and identity numbers. Publish them only if they are fictional demo data and you have permission to share them.
- The included demo passwords are for local demonstration only. Do not use them for a real deployment.
