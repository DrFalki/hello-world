# hello-world
Beginning of all

Hallo Welt

Hiermit beginne ich die Reise die Medizin zu verändern.

---

## 🩺 Dr. Grünie – Der Gesundheits-Held (Minispiel)

Ein kleines, einbettbares Browser-Spiel im Stil des Google-Dino-Spiels (Springen)
kombiniert mit einer Schuss-Mechanik wie beim alten Nokia-Spiel (Medizin werfen).

**Spielfigur:** Dr. Grünie – ein freundlicher Comic-Arzt mit Kittel und Stethoskop.

**Ziel:** Kämpfe Level für Level gegen die großen Volkskrankheiten:
**Herzinfarkt** 🫀 · **Krebs** 🎗️ · **Diabetes** 🩸 · **Demenz** 🧠

### Steuerung
| Aktion | Tastatur | Touch / Maus |
|---|---|---|
| Springen | Leertaste / Pfeil hoch / `W` | oberer Bildschirm-Tipp oder Button **⬆️** |
| Medizin werfen 💊 | Pfeil runter / `F` / `S` | unterer Bildschirm-Tipp oder Button **💊** |

Springe über Krankheiten oder zerstöre sie mit Medizin, sammle 🍏 für Bonuspunkte.
Bei jedem Treffer verlierst du ein ❤️ – nach 3 Treffern ist das Spiel vorbei.
Der Bestwert wird lokal im Browser gespeichert.

### Dateien
- `dr-gruenie.html` – das komplette Spiel (eine einzige Datei, keine externen Abhängigkeiten)
- `index.html` – Demo-/Landingpage mit Vorschau und Einbettungs-Code

### In die eigene Website einbetten
Lade `dr-gruenie.html` auf deinen Webspace und füge ein:

```html
<iframe src="dr-gruenie.html"
        style="width:100%;max-width:860px;aspect-ratio:8/3;border:0;"
        title="Dr. Grünie Gesundheits-Minispiel"
        loading="lazy"></iframe>
```

Das Spiel ist responsiv und funktioniert auch auf dem Smartphone.
