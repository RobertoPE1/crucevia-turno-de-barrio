CRUCEVIA — NEIGHBORHOOD SHIFT
HTML5 traffic-management game. Open index.html in a modern browser.
Default language: English. No build step, libraries or external assets.

GOAL AND CONTROLS
Survive a 90-second shift with at least one of your 3 lives remaining.
Use the on-screen buttons or keys 1 (north–south), 2 (east–west),
3 (pedestrians). Space pauses/resumes; buttons also work with touch.
Let cars clear the intersection before opening another direction.
Ambulances can wait 8 seconds; other drivers and pedestrians 18 seconds.
Cars earn 1 point, ambulances 4 points, and pedestrians 2 points.
Collisions and excessive waiting cost lives.

STORAGE
The best score is saved locally when browser storage is available.
The game remains playable if storage is blocked; the record is then temporary.

AUTOMATED CHECKS
Run node tests/smoke.cjs for controls, scoring, win/loss and storage checks.
On Windows with Edge installed, run node tests/browser.cjs for browser checks.
Validated in headless Edge at 1280x800, 390x844 and 320x568:
load under 20 seconds, no horizontal overflow, pause/resume, a simulated
session through the end screen, replay, and no JavaScript exceptions.
These automated checks do not replace Chrome, physical-device or human testing.

SUBMISSION CHECKS
Confirm loading in desktop Chrome within 20 seconds.
Test on actual mobile devices before claiming mobile support.
Arrange a complete playthrough by another person.
The owner must confirm originality and rights to all code and assets.
No third-party libraries, images, audio or network requests are included.
The provisional name requires a trademark check before commercial release.
