import json
from collections import defaultdict

with open('fragen.json', 'r', encoding='utf-8') as f:
    fragen = json.load(f)

# Analysiere: Welche Fragen sind spezifisch für nur 1-2 Genres?
print("=" * 90)
print("ANALYSE: REDUNDANTE & SPEZIALISIERTE FRAGEN")
print("=" * 90)

genre_coverage = defaultdict(set)  # Welche Fragen decken welches Genre ab

for idx, frage in enumerate(fragen):
    if 'filter' not in frage:  # Nur Punktefragen
        genres_in_frage = set()
        for antwort in frage.get('antworten', []):
            if 'punkte' in antwort:
                genres_in_frage.update(antwort['punkte'].keys())
        
        for genre in genres_in_frage:
            genre_coverage[genre].add(idx)
        
        # Zeige Frage
        print(f"\n📋 Frage {idx}: {frage.get('frage', 'N/A')[:60]}")
        print(f"   Genres abgedeckt: {', '.join(sorted(genres_in_frage))}")
        print(f"   Anzahl Genres: {len(genres_in_frage)}")

print("\n\n" + "=" * 90)
print("SPEZIALISIERTE FRAGEN (für nur 1 Genre):")
print("=" * 90)

spezialisierte = []
for idx, frage in enumerate(fragen):
    if 'filter' not in frage:
        genres_in_frage = set()
        for antwort in frage.get('antworten', []):
            if 'punkte' in antwort:
                genres_in_frage.update(antwort['punkte'].keys())
        
        if len(genres_in_frage) == 1:
            genre = list(genres_in_frage)[0]
            print(f"\n❌ Frage {idx}: {frage.get('frage')[:60]}")
            print(f"   → NUR für '{genre}' relevant")
            spezialisierte.append((idx, genre, frage.get('frage')))

print("\n\n" + "=" * 90)
print("EMPFEHLUNG: DIESE FRAGEN ENTFERNEN (REDUNDANT)")
print("=" * 90)

zu_entfernen = []
for idx, genre, frage_text in spezialisierte:
    print(f"\nFrage {idx}: '{frage_text}'")
    print(f"  → Entfernen? JA - reduziert Punkte für {genre}")
    zu_entfernen.append(idx)

print("\n\n" + "=" * 90)
print("SZENARIO: WENN SPEZIALISIERTE FRAGEN ENTFERNT WERDEN")
print("=" * 90)

# Berechne Punkte ohne spezialisierte Fragen
genre_ohne_spezialisiert = defaultdict(int)
genre_mit_spezialisiert = defaultdict(int)

for idx, frage in enumerate(fragen):
    if 'filter' not in frage:
        for antwort in frage.get('antworten', []):
            if 'punkte' in antwort:
                for genre, punkte in antwort['punkte'].items():
                    genre_mit_spezialisiert[genre] += punkte
                    if idx not in zu_entfernen:
                        genre_ohne_spezialisiert[genre] += punkte

print("\nGENRE                    MIT SPEZIELLEN      OHNE SPEZIELLEN      DIFFERENZ")
print("                         (AKTUELL)           (WENN ENTFERNT)")
print("-" * 90)

sorted_genres = sorted(genre_mit_spezialisiert.keys())
for genre in sorted_genres:
    mit = genre_mit_spezialisiert[genre]
    ohne = genre_ohne_spezialisiert[genre]
    diff = mit - ohne
    print(f"{genre:<20} {mit:>5} Punkte           {ohne:>5} Punkte           -{diff}")

print("\n\n" + "=" * 90)
print("PUNKTE-ANPASSUNGEN IN DEN ALLGEMEINEN FRAGEN")
print("=" * 90)

print("\nWenn wir diese speziellen Fragen entfernen und die Punkte in den allgemeinen")
print("Fragen anpassen, um alle Genres auf 8-10 Punkte zu bringen:")

print("\n📌 FRAGEN ZUM ANPASSEN (allgemeine Fragen):\n")

for idx, frage in enumerate(fragen):
    if 'filter' not in frage and idx not in zu_entfernen:
        print(f"Frage {idx}: {frage.get('frage')[:60]}")
        print(f"  Antworten mit Punktvergabe:")
        for a_idx, antwort in enumerate(frage.get('antworten', [])):
            if 'punkte' in antwort:
                print(f"    [{a_idx}] {antwort.get('text', 'N/A')[:40]}")
                print(f"        Punkte: {antwort['punkte']}")
        print()
