# Генерация казахской озвучки (голос kk-KZ-AigulNeural) для всех текстов платформы.
# Запуск: python3 -m pip install edge-tts && python3 tools/make_audio.py
import asyncio, json, os, re, sys
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = "kk-KZ-AigulNeural"

REPL = [
    ("км²", " шаршы километр"), ("м²", " шаршы метр"), ("м³", " текше метр"),
    ("км/сағ", " километр сағатына"), ("км/с", " километр секундына"), ("м/с²", " метр секунд квадратқа"),
    ("м/с", " метр секундына"), ("мм сын. бағ.", " миллиметр сынап бағанасы"),
    ("°C", " градус"), ("°", " градус"), ("≈", " шамамен "), ("%", " пайыз"), ("·", " көбейту "),
    ("√", " түбір астында "), ("π", " пи "), ("⅓", " үштен бір "), ("½", " жарты "), ("¼", " төрттен бір "), ("⅛", " сегізден бір "),
    ("log₂", " екі негізді логарифм "), ("²", " квадрат"), ("−", " минус "), (" : ", " бөлу "), ("×", " көбейту "),
    ("ҚР", "Қазақстан Республикасы"), ("₸", " теңге"), ("F₁l₁ = F₂l₂", "эф бір эль бір тең эф екі эль екі"),
]
UNITS = [(r"(\d) ?км\b", r"\1 километр"), (r"(\d) ?см\b", r"\1 сантиметр"), (r"(\d) ?мм\b", r"\1 миллиметр"),
         (r"(\d) ?м\b", r"\1 метр"), (r"(\d) ?т\b", r"\1 тонна"), (r"(\d) ?Н\b", r"\1 ньютон"),
         (r"(\d) ?с\b", r"\1 секунд"), (r"(\d) ?сағ\b", r"\1 сағат"), (r"(\d) ?ж\.", r"\1 жылы")]

def ttsify(s):
    s = re.sub(r"(\d) (\d{3})", r"\1\2", s)
    s = re.sub(r"(\d) (\d{3})", r"\1\2", s)
    for a, b in REPL:
        s = s.replace(a, b)
    for a, b in UNITS:
        s = re.sub(a, b, s)
    s = s.replace("«", "").replace("»", "").replace("(", ", ").replace(")", ", ")
    return re.sub(r"\s+", " ", s).strip()

async def one(key, text, sem, done):
    path = os.path.join(ROOT, "audio", key + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        done.append(key); return
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(ttsify(text), VOICE, rate="-4%").save(path)
                done.append(key); return
            except Exception as e:
                print("retry", key, e, file=sys.stderr); await asyncio.sleep(2)

async def main():
    data = json.load(open(os.path.join(ROOT, "js", "data.json"), encoding="utf-8"))
    items = [("ui_" + k, v) for k, v in data["ui"].items()]
    for p in data["places"]:
        items.append((p["id"], p["say"]))
        for i, t in enumerate(p["tasks"]):
            items.append((f"{p['id']}_t{i}", t["t"]))
        if p.get("scientist"):
            sc = p["scientist"]
            items.append((p["id"] + "_sci", f"{sc['name']}. {sc['field']}. {sc['found']}"))
    extra = os.path.join(ROOT, "tools", "voice_extra.json")
    if os.path.exists(extra):
        items += list(json.load(open(extra, encoding="utf-8")).items())
    os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
    sem, done = asyncio.Semaphore(4), []
    await asyncio.gather(*(one(k, t, sem, done) for k, t in items))
    json.dump(sorted(done), open(os.path.join(ROOT, "audio", "manifest.json"), "w"), ensure_ascii=False)
    print(len(done), "/", len(items), "files")

asyncio.run(main())
