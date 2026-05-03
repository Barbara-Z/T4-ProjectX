import json
from collections import defaultdict

with open('fragen.json', 'r', encoding='utf-8') as f:
    fragen = json.load(f)

# Berechne optimierte Punkte
genre_max = defaultdict(int)

for frage in fragen:
    if 'antworten' in frage and 'filter' not in frage:
        for antwort in frage['antworten']:
            if 'punkte' in antwort:
                for genre, punkte in antwort['punkte'].items():
                    genre_max[genre] += punkte

print("=" * 80)
print("✅ FINALE PUNKTEANALYSE - NACH OPTIMIERUNG")
print("=" * 80)

results = sorted(genre_max.items(), key=lambda x: x[1], reverse=True)

print("\n{:<20} {:<15} {:<10}".format("GENRE", "MAX PUNKTE", "VORKOMMEN"))
print("-" * 80)

for genre, punkte in results:
    # Zähle Vorkommen
    vorkommen = 0
    for frage in fragen:
        if 'antworten' in frage and 'filter' not in frage:
            for antwort in frage['antworten']:
                if 'punkte' in antwort and genre in antwort['punkte']:
                    vorkommen += 1
    
    print(f"{genre:<20} {punkte:<15} {vorkommen:<10}")

print("\n" + "=" * 80)
print("STATISTIK")
print("=" * 80)

values = [p for _, p in results]
min_val = min(values)
max_val = max(values)
avg_val = sum(values) / len(values)
diff = max_val - min_val

print(f"\n  Höchster Wert:      {max_val} Punkte")
print(f"  Niedrigster Wert:   {min_val} Punkte")
print(f"  Durchschnitt:       {avg_val:.1f} Punkte")
print(f"  Unterschied:        {diff} Punkte ({(diff/max_val)*100:.1f}%)")

print("\n" + "=" * 80)
if diff <= 2:
    print("✅ AUSGEWOGEN! Die Genres sind gut gleich gewichtet!")
    print("   Alle Genres haben zwischen {} und {} Punkte.".format(min_val, max_val))
elif diff <= 4:
    print("⚠️  TEILWEISE AUSGEWOGEN. Noch kleine Unterschiede ({} Punkte Diff).".format(diff))
else:
    print("❌ NICHT AUSGEWOGEN. Unterschied zu groß ({} Punkte).".format(diff))

print("=" * 80)
