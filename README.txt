CRUCEVIA — NEIGHBORHOOD SHIFT
Eight-district English HTML5 campaign for CrazyGames Basic Launch.
Serve the folder over HTTP, for example through XAMPP. No npm build is needed.
The game uses platform.js, campaign.js, game.js and the remotely hosted official
CrazyGames SDK v3. Graphics are drawn in code; no third-party art/audio is bundled.

CAMPAIGN
Complete each shift with lives remaining AND all its score/service targets.
Finish districts in order to unlock the next one. Replay unlocked districts.
1. Market Morning: 45s, 10 points.
2. School Crossing: 50s, 14 points, 4 pedestrians.
3. Clinic Call: 55s, 18 points, 3 ambulances.
4. Station Rush: 60s, 24 points, 10 regular cars.
5. Park Festival: 60s, 26 points, 8 pedestrians.
6. Harbor Freight: 70s, 32 points, 16 regular cars.
7. Rainy Avenues: 75s, 32 points, 8 cars and 6 pedestrians, slower wet roads.
8. Night Connection: 90s, 48 points, 12 cars, 8 pedestrians, 4 ambulances.
Earn 1 star for passing, 2 with at least 2 lives, or 3 with all lives and no collisions.
A defeat preserves all previously earned stars/unlocks. Best results never decrease.

CONTROLS
Buttons/touch or 1 (north–south), 2 (east–west), 3 (pedestrians).
Space pauses/resumes. Map opens district selection. Focus loss pauses the shift.
Let cars clear the intersection before changing directions.
Ambulances can wait 8 seconds; regular cars and pedestrians 18 seconds.
Regular cars earn 1 point, ambulances 4, pedestrians 2.

SAVES
A checkpoint is written when starting, every 5 seconds of gameplay, when pausing,
opening the map, hiding/leaving the page and when finishing a district.
Resume saved shift restores the timer, score, lives and traffic state.
Only one unfinished shift is stored: starting another district replaces it.
On CrazyGames, only the SDK Data module is used for campaign persistence.
In submission settings, select Progress Save:
"Yes, using the Data Module from the CrazyGames SDK".
If it is disabled, the game warns that saving is unavailable rather than silently
substituting a browser-local save. The game remains playable in memory.
Outside CrazyGames the fallback is localStorage when SDK Data is unavailable.
Signed-in cross-device sync is provided by CrazyGames, not independently verified
on two accounts/devices here. Guest saves are browser-local according to the SDK.
Old best scores are imported once; existing campaign progress takes precedence.
A closed tab may lose up to the last checkpoint if the browser cannot flush writes.
See privacy.html and https://docs.crazygames.com/sdk/data/

PLATFORM
SDK.init completes before gameplay/data methods. Start/resume report gameplayStart;
pause/focus loss/map/results report gameplayStop. Menus do not count as gameplay.
No ads, accounts, purchases, game promotion or custom fullscreen button is added.
The 50 MB requirement is a MAXIMUM initial download, never a minimum.
Basic integration is not certification of Full Launch compliance.
https://docs.crazygames.com/requirements/technical/

CHECKS
node tests/smoke.cjs
node tests/balance.cjs
node tests/platform.cjs
node tests/browser.cjs
node tests/browser.cjs --live-sdk
Browser checks require Windows/Edge. Default uses a mocked SDK Data store;
--live-sdk checks the real official SDK on localhost.
Checks cover goals/unlocks, stars, invalid saves, pause, failed storage,
reload/resume, SDK ordering, layout and JS exceptions. The balance check simulates
all eight districts with a priority strategy to verify every goal is reachable.
Real Chrome, iOS/Android and an independent human playthrough remain required.

BUILD / SUBMIT
node build.cjs
Upload release/crucevia-crazygames.zip, not the repository or README.
The ZIP has six root files: index.html, platform.js, campaign.js, game.js,
privacy.html and NOTICE.txt. The official SDK remains externally hosted.
Activate Progress Save, then check SDK detection and saving in portal preview.
No automatic QA submission, publishing terms acceptance or exclusivity choice.

RIGHTS
See RIGHTS.md for the source/asset inventory and unresolved initial authorship
and trademark checks. NOTICE.txt grants no open-source license.
Do not claim worldwide uniqueness, trademark clearance or human-only authorship.
