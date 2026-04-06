# Hitster Bingo Cards

A **mobile-friendly digital companion app** for Hitster Bingo – a fast-paced music-quiz party game.

---

## What Is It?

Hitster Bingo Cards turns your phone into an interactive 5×5 bingo card for the [Hitster](https://www.hitster.game/) card game.  
Each cell belongs to one of five colour-coded categories. The first player to mark five cells in a row, column, or diagonal wins!

---

## How to Play

1. **The DJ spins the disco ball** to determine which category is active for the round.
2. The DJ plays a mystery song for **25 seconds**.
3. While the song plays, every player uses the **scratchpad** at the bottom of the screen to jot down their guess.
4. After the reveal, players **type the correct answer** (artist, year, decade, etc.) into any matching coloured cell on their board.
5. Tap the **background of the cell** (not the text field) to **check it off**.
6. The **first player to check 5 cells in a row** (horizontally, vertically, or diagonally) wins. 🎉

### Category Colours

| Colour | Category |
|--------|----------|
| 🟩 Green | Künstler / Band |
| 🟨 Yellow | Jahr ± 4 |
| 🟦 Blue | Jahr ± 2 |
| 🩷 Pink | Vor / Nach 2000 |
| 🟣 Purple | Jahrzehnt |

---

## Tech Stack

- **Vanilla JavaScript (ES6+)** – no framework, no build step
- **Tailwind CSS** via CDN
- **Canvas-Confetti** via CDN for the win animation
- Game state persisted in **`localStorage`** – reloading the page restores your board

---

## Project Structure

```
Hitster-Bingo-Cards/
├── index.html      # App shell & layout
├── css/
│   └── style.css   # Custom styles (scrollbar hiding, cell states)
├── js/
│   └── app.js      # All game logic & state management
└── README.md
```

---

## Hosting on GitHub Pages (Free)

1. Push the repository to GitHub (if not already).
2. Open your repository on GitHub and click **Settings**.
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment → Source**, select **Deploy from a branch**.
5. In the **Branch** dropdown, choose **`main`** and the folder **`/ (root)`**.
6. Click **Save**.
7. After ~60 seconds, GitHub will display your live URL:  
   `https://<your-username>.github.io/<repository-name>/`

That's it – your Hitster Bingo Cards app is now live for free! 🎶

---

## Local Development

No build tools required. Just open `index.html` directly in your browser, or serve it with any static file server:

```bash
# Python 3
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

---

## License

MIT
