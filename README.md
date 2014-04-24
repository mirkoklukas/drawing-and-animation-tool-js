A drawing & animation tool
=============================

A drawing and animation tool that let's you draw on a screen and play back your mouse tracks.

Try it out yourself: <a href="http://mirkoklukas.github.io/drawing-and-animation-tool-js/demo/">Flat Circle</a>.

The non-static version (i.e. not the demo) allows multiple users to remotely draw on the same canvas. This is accomplished by: 
- emitting mouse events over a socket connection,
- feeding them into an eventsource, and 
- have "drawing layers" listen and react to that source.

