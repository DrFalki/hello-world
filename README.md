# hello-world
Beginning of all

Hallo Welt

Hiermit beginne ich die Reise die Medizin zu verändern.

---

## 🚀 Dr. Grünie – Space Health Impact (Minispiel)

Ein kleines, einbettbares Browser-Spiel im Stil von **Space Impact** (Nokia):
ein horizontaler Weltraum-Shooter. Dr. Grünie fliegt als „Held", feuert automatisch
Medizin nach rechts und kämpft Level für Level gegen die großen Volkskrankheiten.

**Spielfigur:** Dr. Grünie – ein freundlicher Comic-Arzt mit Kittel, Stethoskop
und Lockenhaar, gezeichnet nach der Charaktervorlage und als fliegender Held animiert.

**Ablauf:** Pro Level überstehst du eine **Gegnerwelle** und besiegst danach den
jeweiligen **Boss** (mit Lebensbalken):

| Level | Krankheit | Boss |
|---|---|---|
| 1 | Herzinfarkt 🫀 | Der große Herzinfarkt (Herzschlag-Salven) |
| 2 | Krebs 🦠 | Der Tumor-König (spawnt Zell-Minions) |
| 3 | Diabetes 🩸 | Zucker-Bestie (Streuschüsse) |
| 4 | Demenz 🧠 | Der Vergesser (teleportiert) |

### Steuerung
| Aktion | Tastatur | Touch / Maus |
|---|---|---|
| Fliegen | Pfeiltasten / `WASD` | Finger/Maus über den Bildschirm ziehen |
| Schießen 💊 | automatisch | automatisch |

Zerstöre die Krankheiten mit Medizin, weiche dem Gegnerfeuer aus und sammle 🍏 für
Bonuspunkte (und gelegentliche Heilung). Bei jedem Treffer verlierst du ein ❤️ –
nach 3 Treffern ist das Spiel vorbei. Besiege alle 4 Bosse, um zu gewinnen.
Der Bestwert wird lokal im Browser gespeichert.

### Dateien
- `dr-gruenie.html` – das komplette Spiel (eine einzige Datei, keine externen Abhängigkeiten)
- `index.html` – Demo-/Landingpage mit Vorschau und Einbettungs-Code

### In die eigene Website einbetten
Lade `dr-gruenie.html` auf deinen Webspace und füge ein:

```html
<iframe src="dr-gruenie.html"
        style="width:100%;max-width:880px;aspect-ratio:8/5;border:0;"
        title="Dr. Grünie Gesundheits-Minispiel"
        loading="lazy"></iframe>
```

Das Spiel ist responsiv und funktioniert auch auf dem Smartphone.
