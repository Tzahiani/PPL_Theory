import json
from collections import Counter

with open("open_book_parsed.json", encoding="utf-8") as f:
    data = json.load(f)

questions = data["questions"]
for q in questions:
    if q["category"] == "מטeorולogia":
        q["category"] = "מטאורולogia"

cats = Counter(q["category"] for q in questions)
with open("open_book_cats.json", "w", encoding="utf-8") as f:
    json.dump(dict(cats), f, ensure_ascii=False, indent=2)

lines = ["export const OPEN_BOOK_QUESTIONS = ["]
for q in questions:
    lines.append("  {")
    lines.append(f"    id: {q['id']},")
    lines.append(f"    category: {json.dumps(q['category'], ensure_ascii=False)},")
    lines.append(f"    question: {json.dumps(q['question'], ensure_ascii=False)},")
    opts = ",\n      ".join(json.dumps(o, ensure_ascii=False) for o in q["options"])
    lines.append(f"    options: [\n      {opts}\n    ],")
    lines.append(f"    correctIndex: {q['correctIndex']},")
    lines.append(f"    poh: {json.dumps(q['poh'], ensure_ascii=False)},")
    lines.append("  },")
lines.append("];")
lines.append("")
lines.append("export default OPEN_BOOK_QUESTIONS;")
lines.append("")

with open("src/data/openBookQuestions.js", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("written", len(questions), "categories", dict(cats))
