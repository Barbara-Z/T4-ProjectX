import json
from collections import defaultdict

with open('fragen.json', 'r', encoding='utf-8') as f:
    fragen = json.load(f)

# Berechne aktuelle Punkte
genre_max = defaultdict(int)
genre_in_fragen = defaultdict(list)  # Welche Fragen haben welches Genre

for frage_idx, frage in enumerate(fragen):
    if 'antworten' in frage and 'filter' not in frage:
        for antwort_idx, antwort in enumerate(frage['antworten']):
            if 'punkte' in antwort:
                for genre, punkte in antwort['punkte'].items():
                    genre_max[genre] += punkte
                    if genre not in [g for g, _ in genre_in_fragen[frage_idx]]:
                        genre_in_fragen[frage_idx].append((genre, punkte))

print("=" * 90)
print("DETAILLIERTE OPTIMIERUNGSEMPFEHLUNGEN")
print("=" * 90)

# Definiere Ziel: alle auf 8 Punkte
ziel = 8
print(f"\nZiel: Alle Genres auf {ziel} Punkte normalisieren\n")

# Gruppiere Genres nach Status
zu_erhoehn = {}
zu_reduzieren = {}

for genre, max_pts in sorted(genre_max.items(), key=lambda x: -x[1]):
    if max_pts > ziel:
        zu_reduzieren[genre] = max_pts - ziel
    elif max_pts < ziel:
        zu_erhoehn[genre] = ziel - max_pts
    else:
        print(f"✅ {genre:<20} = {max_pts} Punkte (PERFEKT)")

print("\n" + "=" * 90)
print("GENRES ZU REDUZIEREN (- Punkte):")
print("=" * 90)
for genre, diff in sorted(zu_reduzieren.items(), key=lambda x: -x[1]):
    print(f"\n❌ {genre:<20} {genre_max[genre]} Punkte → {ziel} ({-diff:+d})")
    # Finde wo dieses Genre vorkommt
    for frage_idx, frage in enumerate(fragen):
        if 'antworten' in frage and 'filter' not in frage:
            for antwort_idx, antwort in enumerate(frage['antworten']):
                if 'punkte' in antwort and genre in antwort['punkte']:
                    print(f"    Frage {frage_idx}, Antwort {antwort_idx}: {antwort['punkte'][genre]} Punkte für '{genre}'")

print("\n" + "=" * 90)
print("GENRES ZU ERHÖHEN (+ Punkte):")
print("=" * 90)
for genre, diff in sorted(zu_erhoehn.items(), key=lambda x: -x[1]):
    print(f"\n✅ {genre:<20} {genre_max[genre]} Punkte → {ziel} ({diff:+d})")
    # Finde wo dieses Genre vorkommt
    for frage_idx, frage in enumerate(fragen):
        if 'antworten' in frage and 'filter' not in frage:
            for antwort_idx, antwort in enumerate(frage['antworten']):
                if 'punkte' in antwort and genre in antwort['punkte']:
                    print(f"    Frage {frage_idx}, Antwort {antwort_idx}: {antwort['punkte'][genre]} Punkte für '{genre}'")

print("\n\n" + "=" * 90)
print("KONKRETE ÄNDERUNGSANLEITUNG:")
print("=" * 90)

print("""
🔴 DRAMA (-2):
  → Frage 0, Antwort 2: "Emotionale Geschichte" 
     Von 2 auf 1 reduzieren (drama: 2 → 1)

🟢 FAMILY (+3):
  → Frage 0, Antwort 1: "Lustige Unterhaltung" 
     Von 1 auf 2 erhöhen (family: 1 → 2)
  → Frage 4, Antwort 2: "entspannt"
     Von 1 auf 2 erhöhen (family: 1 → 2)
  → Frage 8, Antwort 2: "Freude" 
     bleibt bereits bei 2 ✓
     ZUSÄTZLICH: Frage 8, Antwort 3: "Mitgefühl"
     Von 1 auf 2 erhöhen (family: 1 → 2) - das macht +1 zu viel
     ODER: Frage 4, Antwort 0: "sehr intensiv" 
     Von 1 auf 2 erhöhen (family: 1 → 2)? - aber family ist nicht dort

  BESSER: Frage 0, Antwort 1: family 1→2 (+1)
          Frage 4, Antwort 2: family 1→2 (+1)
          Frage 8, Antwort 3: family 1→2 (+1)
          = insgesamt +3

🟢 WESTERN (+3):
  → Frage 5, Antwort 3: "Wilder Westen"
     Von 3 auf 4 erhöhen (western: 3 → 4)
  → Frage 7, Antwort 3: "klassisch / traditionell"
     Von 2 auf 3 erhöhen (western: 2 → 3)
     = +2 gesamt, noch 1 Punkt fehlt
  → Allerdings ist western nur in 2 Fragen...
     Evtl. bei Frage 7 von 2 auf 4? Aber das macht +2

🟢 MUSIC (+2):
  → Frage 1, Antwort 2: "Musik und Kunst"
     Von 3 auf 4 erhöhen? (music: 3 → 4)
  → Frage 9, Antwort 0: "Musik / Performance"
     Von 3 auf 3 - bleibt gleich
     Oder: Von 3 auf 4 erhöhen? (music: 3 → 4)
     = nur +1
  BESSER: Frage 1, Antwort 2: music 3→4 (+1)
          Frage 9, Antwort 0: music 3→4 (+1)
          = insgesamt +2

""")
