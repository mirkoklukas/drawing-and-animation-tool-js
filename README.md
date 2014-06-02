A drawing & animation tool
=============================

A drawing and animation tool that let's you draw on a screen and play back your mouse tracks. 

Try it out yourself (static version): <a href="http://mirkoklukas.github.io/drawing-and-animation-tool-js/demo/">Flat Circle</a>.

Note that the demo has not been cross browser tested - it's a sketch! Works fine in **Chrome** (v34.0) and **Firefox** (v28.0).

The non-static version (i.e. not the demo) allows multiple users to remotely draw on the same canvas. This is accomplished by: 
- emitting mouse events over a socket connection,
- feeding them into an eventsource, and 
- have "drawing layers" listen and react to that source.

The tool has been inspired by Andreas Gysin's <a href="http://www.ertdfgcvb.com/p1/chronodraw/">Chronodraw</a>.
