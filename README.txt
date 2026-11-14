CRUCEVIA — NEIGHBORHOOD SHIFT
English HTML5 traffic-management game for CrazyGames Basic Launch.
Serve this folder over HTTP (for example through XAMPP). No npm build is needed.
index.html uses platform.js and the official, remotely hosted CrazyGames SDK v3.
No third-party image, sound or font files are bundled.

GOAL AND CONTROLS
Survive a 90-second shift with at least one of your 3 lives remaining.
Buttons/touch or keys 1 (north–south), 2 (east–west), 3 (pedestrians).
Space pauses/resumes. Losing focus pauses the shift; resume with the button.
Let cars clear the intersection before opening another direction.
Ambulances can wait 8 seconds; other drivers and pedestrians 18 seconds.
Cars earn 1 point, ambulances 4 points, and pedestrians 2 points.
Collisions and excessive waiting cost lives.

CRAZYGAMES BASIC INTEGRATION
The adapter awaits SDK.init before reporting gameplayStart/gameplayStop.
Start/replay/resume report start; pause, focus loss and game end report stop.
Menus do not report active gameplay. Duplicate events are suppressed.
The game stays playable if SDK loading/init fails or exceeds five seconds.
No ads, accounts, purchases, external game links or fullscreen buttons are added.
This is a Basic Launch integration, not certification of Full Launch compliance.
SDK documentation: https://docs.crazygames.com/sdk/intro/
Requirements: https://docs.crazygames.com/requirements/technical/

STORAGE AND RIGHTS
The best score stays in local storage when available; no score upload is added.
See privacy.html for the storage/platform notice.
See RIGHTS.md for the evidence, asset inventory and unresolved ownership checks.
See NOTICE.txt for the distribution notice. No open-source license is granted.
Do not declare worldwide uniqueness, trademark clearance or human-only authorship.

AUTOMATED CHECKS (Node.js)
node tests/smoke.cjs
node tests/platform.cjs
node tests/browser.cjs
node tests/browser.cjs --live-sdk
Browser tests require Windows and Microsoft Edge. They use a temporary profile
and a loopback HTTP server. Default mode mocks the SDK for deterministic event
checks; --live-sdk loads and initializes the real official SDK on localhost.
Test sizes: 1280x800, 907x510, 821x462, 800x450, 390x844 and 320x568.
The tests cover loading, layout, pause/replay, session end and JS exceptions.
Actual Chrome, iOS, Android and an independent human playthrough remain required.

BUILD AND SUBMIT
Run: node build.cjs
Upload release/crucevia-crazygames.zip to the CrazyGames developer portal.
The ZIP contains only index.html, platform.js, privacy.html and NOTICE.txt,
with index.html at the ZIP root. It excludes Git metadata, tests and build tools.
The official SDK remains externally hosted; it is not copied into the archive.
Check SDK detection and events in the portal preview before submitting to QA.
Complete RIGHTS.md owner checks and use only support/orientation settings tested
on real devices. This script does not submit to QA or accept publishing terms.
