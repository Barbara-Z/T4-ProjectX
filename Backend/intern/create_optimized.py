import json
from copy import deepcopy

with open('fragen.json', 'r', encoding='utf-8') as f:
    fragen = json.load(f)

# Skalierungsfaktoren basierend auf Optimierung
skalierungsfaktoren = {
    "action": 1.67,
    "thriller": 1.43,
    "comedy": 0.91,
    "family": 2.00,
    "drama": 0.91,
    "romance": 1.11,
    "fantasy": 0.91,
    "science_fiction": 1.43,
    "crime": 1.67,
    "mystery": 2.50,
    "history": 1.11,
    "war": 1.25,
    "music": 0.91,
    "documentary": 1.67,
    "horror": 1.25,
    "adventure": 1.67,
    "western": 2.50,
}

# Erstelle optimierte Version
fragen_optimiert = deepcopy(fragen)

# Wende Skalierung an
for frage in fragen_optimiert:
    if 'antworten' in frage and 'filter' not in frage:  # Nur echte Fragen
        for antwort in frage['antworten']:
            if 'punkte' in antwort:
                neue_punkte = {}
                for genre, punkte in antwort['punkte'].items():
                    # Skaliere und runde
                    neuer_wert = punkte * skalierungsfaktoren[genre]
                    neue_punkte[genre] = round(neuer_wert)
                antwort['punkte'] = neue_punkte

# Speichere optimierte Version
with open('fragen_optimiert.json', 'w', encoding='utf-8') as f:
    json.dump(fragen_optimiert, f, indent=2, ensure_ascii=False)

print("✅ Optimierte fragen.json erstellt: fragen_optimiert.json")
print("\nVERGLEICH - Vor und Nach:")
print("=" * 80)

# Vergleich anzeigen
genre_max_original = {}
genre_max_optimiert = {}

for frage in fragen:
    if 'antworten' in frage and 'filter' not in frage:
        for antwort in frage['antworten']:
            if 'punkte' in antwort:
                for genre, punkte in antwort['punkte'].items():
                    genre_max_original[genre] = genre_max_original.get(genre, 0) + punkte

for frage in fragen_optimiert:
    if 'antworten' in frage and 'filter' not in frage:
        for antwort in frage['antworten']:
            if 'punkte' in antwort:
                for genre, punkte in antwort['punkte'].items():
                    genre_max_optimiert[genre] = genre_max_optimiert.get(genre, 0) + punkte

print(f"\n{'GENRE':<20} {'ORIGINAL':<12} {'OPTIMIERT':<12} {'DIFF':<6}")
print("-" * 80)

for genre in sorted(genre_max_original.keys()):
    orig = genre_max_original.get(genre, 0)
    opt = genre_max_optimiert.get(genre, 0)
    diff = opt - orig
    sign = "+" if diff > 0 else ""
    print(f"{genre:<20} {orig:<12} {opt:<12} {sign}{diff:<6}")

print("\n" + "=" * 80)
print("BEISPIEL - Erste Frage (ORIGINAL):")
print("=" * 80)
print(json.dumps(fragen[0], indent=2, ensure_ascii=False)[:400])

print("\n" + "=" * 80)
print("BEISPIEL - Erste Frage (OPTIMIERT):")
print("=" * 80)
print(json.dumps(fragen_optimiert[0], indent=2, ensure_ascii=False)[:400])
