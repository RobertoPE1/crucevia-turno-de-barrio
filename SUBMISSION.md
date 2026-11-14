# Datos para el formulario de CrazyGames

Preparado el 15 de noviembre de 2026. Los siguientes textos están en inglés,
igual que el juego. Son texto plano: copiar el contenido, no los títulos Markdown.

## Título

Crucevia — Neighborhood Shift

## Categoría

Recomendación: Casual. Si el selector pide un subgénero, priorizar la opción que
describa gestión de tráfico o puzles. No se ha inspeccionado la lista de opciones
de la cuenta; no seleccionar una categoría inexistente o no relacionada.

## Etiquetas (hasta cinco)

Traffic, Management, Strategy, 2D, Simulation

Elegir únicamente las que aparezcan en el selector y describan el juego.
No hace falta utilizar cinco si no están disponibles.

## Descripción (copiar este párrafo sin HTML)

Keep the neighborhood moving in Crucevia — Neighborhood Shift, a traffic-management puzzle game where every signal matters. Coordinate cars, ambulances and pedestrians across eight districts, from a busy market and school crossing to rainy avenues and a night-time finale. Finish timed shifts, meet each district's service targets and protect your remaining lives to unlock the next neighborhood. Earn up to three stars, improve your best scores and return to your saved campaign or unfinished shift. Choose when traffic moves, give pedestrians their turn and keep ambulances from waiting too long.

## Controles (copiar estas líneas sin HTML)

Desktop: Click the on-screen buttons or press 1 for north–south traffic, 2 for east–west traffic, and 3 for pedestrians.
Press Space or click Pause to pause or resume.
Click Map to select an unlocked district or return to your saved shift.
Mobile: Tap the on-screen traffic controls.
Let vehicles clear the intersection before switching directions. Complete every target before the shift ends while keeping at least one life.

## ¿Qué herramientas utilizaste?

HTML5 Canvas, JavaScript, CSS and the CrazyGames SDK v3. Custom browser game with AI-assisted development using ChatGPT/Codex. No third-party game engine.

Si es un selector, elegir HTML5/JavaScript o Custom/Other según las opciones.
Si ofrece un campo de herramientas de IA, declarar ChatGPT/Codex. No seleccionar
Unity, Unreal, Godot o GDevelop: este proyecto no los utiliza.

Las portadas se dibujan con Canvas mediante código propio. Los vídeos se generan
con Microsoft Edge, Canvas captureStream y MediaRecorder MP4 usando el motor real.
Node.js se utiliza para pruebas, empaquetado y exportación.

## Tiendas y URL de creativos de marketing

- Google Play, iOS App Store y Steam: dejar vacíos si no hay fichas publicadas.
  El repositorio de GitHub no sustituye esos enlaces.
- URL de creativos de marketing: dejar vacía si es opcional y se suben los
  archivos directamente. Una ruta local D:\... no es una URL pública.
  Si el portal exige un enlace, publicar/compartir solo los cinco archivos
  finales mediante una carpeta de acceso público autorizada.

## Portadas: archivos para subir individualmente

release/marketing/cover-landscape.png — 1920 x 1080
release/marketing/cover-portrait.png — 800 x 1200
release/marketing/cover-square.png — 800 x 800

Las tres mantienen la misma estética, contienen solo el título, sin logos de
tiendas, marcos, llamadas a jugar ni material artístico descargado de terceros.
En la herramienta del portal, activar Mostrar zona de etiqueta y comprobar que
la etiqueta no tape el título.

## Vídeos: archivos para subir individualmente

release/marketing/preview-landscape.mp4 — 1920 x 1080, unos 18 segundos
release/marketing/preview-portrait.mp4 — 1080 x 1620, unos 18 segundos

Vídeos MP4/H.264 sin pista de audio, con la portada como primer fotograma,
sin cursor, pantalla negra, barras negras ni llamadas promocionales a jugar.
Muestran estados y simulación del juego real a velocidad natural, con sus
controles/contadores reorganizados para el encuadre. Se cambia de distrito a los
9 segundos. Los estados iniciales preparados son alcanzables dentro del juego;
no se muestran niveles, funciones o recompensas que no existan.

El ZIP de materiales es solo una comodidad para descargar. Descomprimirlo y
subir cada imagen/vídeo a su casilla. No subir el ZIP de materiales como juego.
El juego sigue siendo release/crucevia-crazygames.zip.

## Pantalla completa y guardados

- Marcar pantalla completa como Sí después de probarla en la vista previa del
  portal: tablero, objetivos y botones visibles, controles funcionando.
- Probar también salir de pantalla completa y reanudar la partida.
- Progress Save: Yes, using the Data Module from the CrazyGames SDK.
- No declarar pruebas en dispositivos que no se hayan realizado.

## Exportar / verificar de nuevo

node tools/export-marketing.cjs
node tools/export-marketing.cjs --verify

Exports are not included in the game ZIP file. Only the following are included in Git:
las tres portadas, los dos vídeos finales y el ZIP de materiales; las capturas
de diagnóstico y las demás exportaciones de release/ siguen excluidas.
No se han enviado archivos ni aceptado condiciones en el portal por el usuario.
Las comprobaciones técnicas no sustituyen la aprobación editorial de CrazyGames.

Fuentes:
https://docs.crazygames.com/requirements/game-covers/
https://www.crazygames.com/tags
https://docs.crazygames.com/sdk/data/
