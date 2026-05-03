import json
from collections import defaultdict

with open('fragen.json', 'r', encoding='utf-8') as f:
    fragen = json.load(f)

# Analysiere aktuelle Struktur
genre_fragen = defaultdict(list)  # Welche Frage hat welches Genre
frage_genres = []  # Für jede Frage: welche Genres und mit welchen Punkten

for frage_idx, frage in enumerate(fragen):
    if 'antworten' in frage and not 'filter' in frage:  # Nur echte Fragen, keine Filter
        genres_in_frage = {}
        for antwort in frage['antworten']:
            if 'punkte' in antwort:
                for genre, punkte in antwort['punkte'].items():
                    genres_in_frage[genre] = genres_in_frage.get(genre, 0) + punkte
        
        if genres_in_frage:
            frage_genres.append({
                'index': frage_idx,
                'frage': frage.get('frage', 'Unknown'),
                'genres': genres_in_frage
            })
            for genre in genres_in_frage:
                genre_fragen[genre].append(frage_idx)

print("=" * 80)
print("OPTIMIERUNGSANALYSE - GLEICHGEWICHTETES PUNKTESYSTEM")
print("=" * 80)

# Aktuelle Maximalwerte
current_max = {}
for frage_info in frage_genres:
    for genre in frage_info['genres']:
        if genre not in current_max:
            current_max[genre] = 0
        current_max[genre] += frage_info['genres'][genre]

print("\nAKTUELLE VERTEILUNG (Pro Genre maximal erreichbar):")
sorted_current = sorted(current_max.items(), key=lambda x: x[1], reverse=True)
for genre, max_points in sorted_current:
    print(f"  {genre:<20} {max_points:>3} Punkte")

# Zielsetzung: Alle Genres auf gleichen Wert
min_val = min(current_max.values())
max_val = max(current_max.values())
target = 10  # Zielwert

print(f"\n\nSTRATEGIE: Alle Genres auf {target} Punkte optimieren")
print("-" * 80)

# Berechne Skalierungsfaktoren
print("\nEmpfohlene Skalierungsfaktoren pro Genre:")
scale_factors = {}
for genre in current_max:
    factor = target / current_max[genre]
    scale_factors[genre] = factor
    print(f"  {genre:<20} multiplizieren mit {factor:.2f} ({current_max[genre]} → {target})")

# Simuliere neue Punkte
print("\n\nWIE DIE PUNKTE AUSSEHEN WÜRDEN (gerundet auf ganze Zahlen):")
print("-" * 80)

for frage_info in frage_genres[:5]:  # Zeige erste 5 Fragen als Beispiel
    print(f"\nFrage {frage_info['index']}: {frage_info['frage'][:50]}...")
    print("  Aktuelle Punkte pro Genre:")
    for genre, points in sorted(frage_info['genres'].items()):
        new_points = round(points * scale_factors[genre])
        print(f"    {genre:<20} {points} → {new_points}")

print("\n" + "=" * 80)
print("EMPFEHLUNG:")
print("=" * 80)
print("""
Das aktuelle Problem:
- Drama/Comedy/Fantasy/Music: 11 Punkte maximal
- Family/Mystery/Western: nur 4 Punkte maximal
- Verhältnis ist 11:4 = 2.75x Unterschied!

LÖSUNGSMÖGLICHKEITEN:

1️⃣  EMPFOHLEN - Alle Punkte skalieren (mathematisch einfach):
   → Fantasy und schwache Genres mit Faktor 2.5 multiplizieren
   → Starke Genres mit Faktor 0.91 dividieren
   → NACHTEIL: Krumme Zahlen (z.B. 0.9 Punkte), nicht intuitiv

2️⃣  ALTERNATIVE - Punkte neu verteilen (strukturell):
   → Entferne redundante schwache Genres aus manchen Fragen
   → Gib starken Genres weniger Punkte in den Fragen wo sie vorkommen
   → VORTEIL: Bleibt mit ganzen Zahlen, intuitiver
   
3️⃣  AUSBALANCIEREN - Fragen gezielt anpassen:
   → Behalte die 16 Fragen mit Punkten
   → Reduziere Punkte bei übergewichtigen Genres
   → Erhöhe Punkte bei untergewichtigen Genres
   → VORTEIL: Minimalste Änderungen
""")

# Detaillierte Analyse für Option 3
print("\n" + "=" * 80)
print("OPTION 3 - EMPFEHLUNG: Gezielte Anpassung (minimal invasiv)")
print("=" * 80)

print("\nGENRES DIE REDUZIERT WERDEN SOLLTEN:")
for genre in sorted_current:
    if genre[1] > target:
        overage = genre[1] - target
        print(f"  {genre[0]:<20} {genre[1]} → {target}  (- {overage} Punkte)")

print("\nGENRES DIE ERHÖHT WERDEN SOLLTEN:")
for genre in sorted_current:
    if genre[1] < target:
        shortage = target - genre[1]
        print(f"  {genre[0]:<20} {genre[1]} → {target}  (+ {shortage} Punkte)")
