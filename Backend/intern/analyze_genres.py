import json

with open('fragen.json', 'r', encoding='utf-8') as f:
    fragen = json.load(f)

# Dictionary für Genre-Statistiken
genre_stats = {}
genre_max_per_frage = {}  # Max Punkte pro Genre pro Frage

# Durch alle Fragen gehen
for frage_idx, frage in enumerate(fragen):
    if 'antworten' in frage:
        # Nur Fragen mit Punkten (keine Filter-Fragen)
        has_points = any('punkte' in antwort for antwort in frage['antworten'])
        
        if has_points:
            # Max Punkte pro Genre in dieser Frage
            genre_max_this_frage = {}
            
            for antwort in frage['antworten']:
                if 'punkte' in antwort:  # Nur Antworten mit Punkten
                    for genre, punkte in antwort['punkte'].items():
                        if genre not in genre_stats:
                            genre_stats[genre] = {
                                'alle_punkte': [],
                            }
                        if genre not in genre_max_per_frage:
                            genre_max_per_frage[genre] = []
                        
                        genre_stats[genre]['alle_punkte'].append(punkte)
                        
                        # Track maximum für diese Frage
                        if genre not in genre_max_this_frage:
                            genre_max_this_frage[genre] = punkte
                        else:
                            genre_max_this_frage[genre] = max(genre_max_this_frage[genre], punkte)
            
            # Speichere die maximalen Punkte pro Genre für diese Frage
            for genre, max_punkte in genre_max_this_frage.items():
                genre_max_per_frage[genre].append(max_punkte)

# Berechnen
print("=" * 80)
print("GENRE-PUNKTEANALYSE - QUIZ AUSWERTUNG")
print("=" * 80)

results = []
for genre in sorted(genre_stats.keys()):
    alle_punkte = genre_stats[genre]['alle_punkte']
    gesamtpunkte = sum(alle_punkte)
    anzahl_vorkommen = len(alle_punkte)
    
    # Maximum erreichbar: Summe der besten Antwort pro Frage für dieses Genre
    max_erreichbar = sum(genre_max_per_frage[genre]) if genre in genre_max_per_frage else 0
    
    results.append({
        'genre': genre,
        'gesamtpunkte': gesamtpunkte,
        'max_erreichbar': max_erreichbar,
        'anzahl_vorkommen': anzahl_vorkommen
    })

# Sortiert nach max_erreichbar
results_sorted = sorted(results, key=lambda x: x['max_erreichbar'], reverse=True)

for r in results_sorted:
    print(f"\n{r['genre'].upper()}")
    print(f"  Gesamtpunkte (Summe ALLER Punkte):       {r['gesamtpunkte']}")
    print(f"  Max. erreichbar (beste Antwort/Frage):   {r['max_erreichbar']}")
    print(f"  Vorkommen im Quiz:                       {r['anzahl_vorkommen']}x")

print("\n" + "=" * 80)
print("ZUSAMMENFASSUNG - TABELLE")
print("=" * 80)

# Tabelle
print("\n{:<20} {:<20} {:<20}".format("GENRE", "GESAMT PUNKTE", "MAX ERREICHBAR"))
print("-" * 60)
for r in results_sorted:
    print("{:<20} {:<20} {:<20}".format(r['genre'], r['gesamtpunkte'], r['max_erreichbar']))
