import json

with open('fragen.json', 'r', encoding='utf-8') as f:
    fragen = json.load(f)

# Alle Änderungen in einer strukturierten Liste
# Format: (frage_idx, antwort_idx, genre, neuer_wert, grund)
aenderungen = [
    # REDUZIERUNGEN
    (0, 2, "drama", 1, "Drama: 10→8 (zu hoch)"),
    (10, 1, "history", 0, "History: 9→8 (zu hoch)"),
    
    # ERHÖHUNGEN - FAMILY +3
    (0, 1, "family", 2, "Family: 5→8 +1"),
    (4, 2, "family", 2, "Family: 5→8 +1"),
    (8, 3, "family", 2, "Family: 5→8 +1"),
    
    # ERHÖHUNGEN - WESTERN +3
    (5, 3, "western", 4, "Western: 5→8 +1"),
    (7, 3, "western", 4, "Western: 5→8 +2"),
    
    # ERHÖHUNGEN - ACTION +2
    (0, 0, "action", 3, "Action: 6→8 +1"),
    (6, 0, "action", 3, "Action: 6→8 +1"),
    
    # ERHÖHUNGEN - ROMANCE +2
    (0, 2, "romance", 2, "Romance: 6→8 +1"),
    (3, 1, "romance", 3, "Romance: 6→8 +1"),
    
    # ERHÖHUNGEN - FANTASY +2
    (0, 3, "fantasy", 3, "Fantasy: 6→8 +1"),
    (7, 1, "fantasy", 3, "Fantasy: 6→8 +1"),
    
    # ERHÖHUNGEN - CRIME +2
    (1, 0, "crime", 3, "Crime: 6→8 +1"),
    (6, 2, "crime", 3, "Crime: 6→8 +1"),
    
    # ERHÖHUNGEN - MYSTERY +2
    (1, 0, "mystery", 3, "Mystery: 6→8 +1"),
    (6, 2, "mystery", 3, "Mystery: 6→8 +1"),
    
    # ERHÖHUNGEN - MUSIC +2
    (1, 2, "music", 4, "Music: 6→8 +1"),
    (9, 0, "music", 4, "Music: 6→8 +1"),
    
    # ERHÖHUNGEN - DOCUMENTARY +2
    (1, 3, "documentary", 3, "Documentary: 6→8 +1"),
    (9, 1, "documentary", 4, "Documentary: 6→8 +1"),
    
    # ERHÖHUNGEN - ADVENTURE +2
    (3, 0, "adventure", 3, "Adventure: 6→8 +1"),
    (6, 3, "adventure", 3, "Adventure: 6→8 +1"),
    
    # ERHÖHUNGEN - THRILLER +1
    (0, 0, "thriller", 2, "Thriller: 7→8 +1"),
    
    # ERHÖHUNGEN - SCIENCE_FICTION +1
    (0, 3, "science_fiction", 2, "SciFi: 7→8 +1"),
    
    # ERHÖHUNGEN - HORROR +1
    (2, 0, "horror", 3, "Horror: 7→8 +1"),
]

print("ANWENDUNG VON {} ÄNDERUNGEN...".format(len(aenderungen)))

for frage_idx, antwort_idx, genre, neuer_wert, grund in aenderungen:
    old_val = fragen[frage_idx]['antworten'][antwort_idx]['punkte'].get(genre, "N/A")
    fragen[frage_idx]['antworten'][antwort_idx]['punkte'][genre] = neuer_wert
    print(f"  ✓ Frage {frage_idx}, Antwort {antwort_idx}: {genre} {old_val}→{neuer_wert}")

# Speichere
with open('fragen.json', 'w', encoding='utf-8') as f:
    json.dump(fragen, f, indent=2, ensure_ascii=False)

print("\n✅ fragen.json aktualisiert!")
print("\nAnalysiere neue Punkte...")

# Neue Analyse
from collections import defaultdict
genre_max = defaultdict(int)

for frage in fragen:
    if 'antworten' in frage and 'filter' not in frage:
        for antwort in frage['antworten']:
            if 'punkte' in antwort:
                for genre, punkte in antwort['punkte'].items():
                    genre_max[genre] += punkte

results = sorted(genre_max.items(), key=lambda x: x[1], reverse=True)

print("\n{:<20} {:<15}".format("GENRE", "MAX PUNKTE"))
print("-" * 35)
for genre, punkte in results:
    print(f"{genre:<20} {punkte:<15}")

values = [p for _, p in results]
min_val = min(values)
max_val = max(values)
diff = max_val - min_val

print(f"\nHöchster: {max_val}, Niedrigster: {min_val}, Unterschied: {diff}")
if diff <= 1:
    print("✅ PERFEKT ausgewogen!")
elif diff <= 2:
    print("✅ SEHR GUT ausgewogen!")
else:
    print("⚠️  Noch Unterschiede vorhanden")
