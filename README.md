# Sleep Log Plugin for Obsidian

ADHD-friendly sleep tracker. Logs YAML frontmatter + summary to active file via bed icon. UK date/time formats.

## Features
- Date picker (DD-MM-YYYY, backdating supported).
- Total sleep as HH:MM (saves "7h 45m").
- Sleep stages (deep/light/REM/awake min).
- Restless moments, energy (1-5).
- Crash-day? (yes/no), Dexamfetamine (none/am/pm).
- Appends to active file (e.g., Sleep-Charts.md).

## Installation
1. Create plugin folder: `.obsidian/plugins/sleep-log/`. 
2. Add `main.ts` (from previous messages). 
3. Add `manifest.json`:
```json
{
  "id": "sleep-log",
  "name": "ADHD Sleep Log",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "Quick sleep logging with YAML for ADHD tracking.",
  "author": "Stevie",
  "isDesktopOnly": false
}
```
4. Enable in Settings → Community plugins → Browse → Load from folder. 

## Usage
- Click bed 🛏️ ribbon icon (top-left). 
- Fill form → "Log to file".
- Output example:
```
---
sleep_date: 19-03-2026 (2026-03-19)
total_sleep: 7h 45m
deep_sleep_min: 120
light_sleep_min: 200
rem_sleep_min: 90
awake_min: 15
restless_moments: 3
next_day_energy_1-5: 4
crash_day: no
dexamfetamine: am
med_notes:

# Sleep Log (ADHD-style)
Date: 19-03-2026 | Sleep: 7h 45m
- Deep: 120 min | Light: 200 | REM: 90 | Awake: 15
- Restless: 3 | Energy: 4/5 | Crash: no | Dex: am
```


## UI Preview
```
Sleep date: [2026-03-19] (DD-MM-YYYY)
ADHD Sleep Log
File: Sleep-Charts.md
Total sleep: [07:45 ⏰]
Deep sleep (min): [ ]
...
Crash-day? [no ▼]
Dexamfetamine: [am ▼]
[Log to file]
```

## Customisation
- Edit `main.ts` → reload (full restart).
- Chart YAML: Use Dataview or Tasks plugin (query `sleep_date`, `total_sleep`).

Repo includes:
├── main.ts                 # (main changes here!)
├── manifest.json         	# (metadata changes)
├── package.json            # (version etc changed)
├── tsconfig.json           
├── .gitignore              
├── LICENSE					# (MIT)                  
├── README.md               
├── .editorconfig           
├── versions.json           
├── version-bump.mjs        
├── package-lock.json       # (npm install && git add)
├── main.js                 # (npm run build)
└── styles.css             

## Troubleshooting
- Old UI? Full restart Obsidian + OFF/ON plugin.
- Errors? Console (Ctrl+Shift+I).
- No icon? Check manifest ID matches folder.

Built for Obsidian v1.6+ (March 2026). MIT license. 
