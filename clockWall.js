  // clockWall runs! Doesn't actually show anything useful right now.
  // original chars are up to 5x6 clocks in size ("1" is 3x6).
  // Goal: Make the clock do this:
  //   - show off a mesmerizing pattern.
  //   - digitally display the time.
  //   - show off another pattern.
  //   - display something else... time until (and of) next sunrise/sunset
  
  // Make an init() function.
  //   - set the canvas dimensions, resolution
  //   - set a var where all clockPositions are idle
   
  try {
    // Get elements
    var canvas0 = document.getElementById("canvas1");  // background
    var canvas1 = document.getElementById("canvas2");  // wall (inert)
    var canvas2 = document.getElementById("canvas3");  // clock face accent (animated circles inside face)
    var canvas3 = document.getElementById("canvas4");  // clock face (inert)
    var canvas4 = document.getElementById("canvas5");  // clock hands (animated)
    var ctx0 = canvas0.getContext("2d");
    var ctx1 = canvas1.getContext("2d");
    var ctx2 = canvas2.getContext("2d");
    var ctx3 = canvas3.getContext("2d");
    var ctx4 = canvas4.getContext("2d");
    var log = document.getElementById("jsLog");
    
    // Get screen sizes
    screenWidth = window.screen.width;
    screenHeight = window.screen.height;
    docWidth = document.width;
    docHeight = document.height;
    innerWidth = window.innerWidth;
    innerHeight = window.innerHeight;

    // Set canvas sizes to device screen size 
    var canvasWidth = screenWidth;
    window.padding = 0;

    canvas0.width = canvasWidth;
    var canvasHeight = screenHeight;
    canvas0.height = canvasHeight;
    canvas0.style.width = canvasWidth;
    canvas0.style.height = canvasHeight;
    canvas1.width = canvasWidth;
    canvas1.height = canvasHeight;
    canvas1.style.width = canvasWidth;
    canvas1.style.height = canvasHeight;
    canvas2.width = canvasWidth;
    canvas2.height = canvasHeight;
    canvas2.style.width = canvasWidth;
    canvas2.style.height = canvasHeight;
    canvas3.width = canvasWidth;
    canvas3.height = canvasHeight;
    canvas3.style.width = canvasWidth;
    canvas3.style.height = canvasHeight;
    canvas4.width = canvasWidth;
    canvas4.height = canvasHeight;
    canvas4.style.width = canvasWidth;
    canvas4.style.height = canvasHeight;
    
    log.innerHTML += "Running JS<br>";
    
    // Clock config variables
    var wallX = 0;          // offset of bg rect within canvas
    var wallY = 0;
    var wallPaddingX = 10;   // affects position of clocks inside bg
    var wallPaddingY = 20;
    var nClockX = 30;        // number of clocks horizontally
    var nClockY = 20;        // number of clocks vertically
    var clockSize = 40;      // diameter, in pixels
    var clockSpacing = 4;
    var clockHrSize = 0.6;   // in percent of clockSize
    var clockMinSize = 0.8;  // in percent of clockSize 
    var strokeThickness = 1; // thickness/boldness of strokes used to draw clocks
    var clockIdlePosition = [Math.PI*1.60, Math.PI*1.60, 0.0];

    // Color (and light/shadow) config
    //  Let's use different color elements: ambient, diffuse, specular.
    //   ambient: the flat color. specifies minimum brightness.
    //   diffuse: the highlight color. the brightness around the glare.
    //   specular: the glare (is the color of the light source).
    var bgColor = "#E6E6E6";
    var bgLight = "#F0F0F0";
    var bgDark  = "#BBBBBB";
    var bgShadowX = 3;
    var bgShadowY = 2;
    var accentColor = "#000000";
    var faceColor = "#EEEEEE";
    var faceLight = "#F0F0F0";
    var faceDark  = "#DDDDDD";
    var handsColor = "#111111";
    var clockShadowX = 3;
    var clockShadowY = 2;
    var lightDarkAngle = (Math.PI*2)*0.05;
    var lightDarkWidth = 3;
    //var lightPosLat = (Math.PI/2)*0.20;  // light position latitude (in radians, north/south)
    //var lightPosLon = (Math.PI/2)*0.50;  // light position longitude (in radians, east/west)

    // Flag variables
    var redrawLayer = [1,1,1,1,1];  // When flag is 1, redraw the layer/canvas


    // Pattern functions.
    //   f(x,y,t) = (h,m) where x=clockCol, y=clockRow, t=timeInSeconds.
    //   t: time (to be used as independent variable in the function).
    //   featureArray = [handsFlag, accentFlag]: indicate which feature(s) to update.
    function clockPattern(patternNum,t,magnifier,featureArray) {
      try {
        var patternOriginX;
        var patternOriginY;
        var clockValues;

        // p1: f(x,y) = sin(t)
        if (patternNum==1) {
          patternOriginX = nClockX/2;
          patternOriginY = nClockY/2;
          clockValues = [-1];
          var t1;
          var i, j;
          for (i=0; i<nClockY; i++) {
            clockValues[i] = [-1];
            for (j=0; j<nClockX; j++) {
              clockValues[i][j] = [-1];

              if (featureArray[0]) {
                t1h = t + ( Math.sqrt(((j+1-patternOriginX)*(j+1-patternOriginX)) + ((i+1-patternOriginY)*(i+1-patternOriginY))) * magnifier );
                t1m = t + ( Math.sqrt(((j+1-patternOriginX)*(j+1-patternOriginX)) + ((i+1-patternOriginY)*(i+1-patternOriginY))) * magnifier );
                clockValues[i][j][0] = Math.sin( t1h )*Math.PI*2;
                clockValues[i][j][1] = Math.tan( t1m )*Math.PI*2;
              };

              if (featureArray[1]) {
                t1a = t + ( Math.sqrt(((j+1-patternOriginX)*(j+1-patternOriginX)) + ((i+1-patternOriginY)*(i+1-patternOriginY))) * magnifier );
                clockValues[i][j][2] = Math.min( Math.abs( Math.tan( t1a ) ), 1 );
              };

              //log.innerHTML += clockValues[i][j][0] + " ";
            }
            //log.innerHTML += "<br>";
          }
        }
        return clockValues;
      } catch(e) {
        log.innerHTML += e + "<br>";
      }
    } // end of clockPattern()


    // clockMessage(): Display a message using the clocks.
    //   messageLayoutNum: indicates a preset layout to use to display the message(s)
    //   messageArray: contains message(s) to display
    function clockMessage(messageLayoutNum, messageArray) {
      try {
        var clockValues;
        var clockIdleValue = clockIdlePosition;

        // Layout 1: Time
        if (messageLayoutNum==1) {
          var messageStr = "";
          var bigMessageX, bigMessageY;
          var messageWidth, messageHeight;
          var messageHandPositions = [[[-1]]]; // clock array for just the chars
          var i, j;

          
          // Compose the message
          getTime();
          messageStr = hr + ":" + min;
          
          for (i=0; i<nClockY; i++) {
            messageHandPositions[i] = [];
            for (j=0; j<nClockX; j++) { messageHandPositions[i][j] = clockIdlePosition }
          }
          
          // Set clocks to show characters
          var xOffset, yOffset = 0;
          var k, l;
          for (k=0; k<clockChar.l["1"].length; k++) {
            for (l=0; l<clockChar.l["1"][0].length; l++) {
              clockHandsPosition[k][l] = clockChar.l["1"][k][l];
            }
          }

          // Calculate the size of the message(s!)
          for (i=0; i<messageArray[0].length; i++) {
            messageWidth += log.innerHTML += clockChar.full[messageArray[0][i]][1].length + "<br>";
          }

          bigMessageX = (nClockX/2) - (messageWidth/2);
          subMessageX = 1;

          // Calculate the clock values
          for (i=0; i<nClockY; i++) {
            clockValues[i] = [-1];
            for (j=0; j<nClockX; j++) {
              clockValues[i][j] = [-1];

              // default to idle position if message doesn't apply to current clock
              clockValues[i][j] = clockIdleValue;

              // Determine if the message applies to the current clock
              if (i>=bigMessageY) { // &&&
                1;
              }
            }
          }

        } // end of if (layout==1)

        return clockValues;
      } catch(e) {
        log.innerHTML += e + "<br>";
      }
    }


    // Get current time
    var d, hr, min, sec, ms;
    function getTime() {
      try {
        // Get the time
        var timezoneOffset = -4;
        d = Date.now();
        hr = (Math.floor(d/1000/60/60) + timezoneOffset) % 24;
        if( hr >= 12 ) { ampm = "PM" } else { ampm = "AM" };
        hr = hr % 12;
        if( hr == 0 ) { hr = 12 };
        min = Math.floor(d/1000/60) % 60;
        sec = Math.floor(d/1000) % 60;
        ms = d % 1000;
        
      } catch(e) {
        log.innerHTML += e.toString() + "<br>";
      }
    }
    
    
    // Set clock hand values to be drawn. hr:0-2PI, min:0-2PI
    // [[ [hr,min],[hr,min],... ], [ [...],...], ... ]
    var clockHandsPosition = [];
    var i,j;
    for (i=0; i<nClockY; i++) {
      clockHandsPosition[i] = [];
      for (j=0; j<nClockX; j++) { clockHandsPosition[i][j] = clockIdlePosition }
    }
    /*function setClocks() {
      // Elements of clock to set
      //  - hands (position, color)
      //  - accent (size, color)
      try {
        for (i=0; i<nClockY; i++) {
          for (j=0; j<nClockX; j++) { clockHandsPosition[i][j] = [ (hr/12)*(2*Math.PI), (min/60)*(2*Math.PI) ] }
        }
      } catch(e) {
        log.innerHTML += e.toString() + "<br>";
      }
    }*/
    
    
    // Draw the clocks based on their setting and config
    // Let's add more canvases to add layer functionality. only edit layers that need changing
    function draw() {
      try {

        // Vars
        hourLength = clockSize*0.5*clockHrSize;
        minLength = clockSize*0.5*clockMinSize;

        // Layer 0: Background
        if ( redrawLayer[0] == 1 ) {
          // Draw background
          ctx0.clearRect(0,0, canvas0.width, canvas0.height);
          ctx0.fillStyle = bgColor;
          wallWidth = (wallPaddingX*2) + (clockSize*nClockX) + ((clockSpacing*nClockX)-clockSpacing);
          wallHeight = (wallPaddingY*2) + (clockSize*nClockY) + ((clockSpacing*nClockY)-clockSpacing);
          ctx0.beginPath();
          ctx0.rect(wallX, wallY, (wallWidth+wallX), (wallHeight+wallY));
          ctx0.fill();
          ctx0.closePath();
        };

        // Layer 2/3/4: individual clock features
        if (redrawLayer[2] || redrawLayer[3] || redrawLayer[4]) {
          //ctx1.lineWidth = strokeThickness;

          if (redrawLayer[2]) { ctx2.clearRect(0,0, canvas2.width, canvas2.height) }
          if (redrawLayer[3]) { ctx3.clearRect(0,0, canvas3.width, canvas3.height) }
          if (redrawLayer[4]) { ctx4.clearRect(0,0, canvas4.width, canvas4.height) }

          // For each clock
          for (i=0; i<nClockY; i++) {
            for (j=0; j<nClockX; j++) {
              // Vars
              // cclockx: currentClockX
              var cclockx = wallX + wallPaddingX + ((clockSize + clockSpacing)*j) + (clockSize/2);
              var cclocky = wallY + wallPaddingY + ((clockSize + clockSpacing)*i) + (clockSize/2);

              // Layer 2: Clock accent
              if (redrawLayer[2]) {
                ctx2.fillStyle = accentColor;
                ctx2.beginPath();
                ctx2.arc(cclockx, cclocky, ((clockSize/2)*clockHandsPosition[i][j][2]), 0, 2*Math.PI);
                ctx2.fill();
                ctx2.closePath();
              }

              // Layer 3: Clock face
              if (redrawLayer[3]) {
                //  face bg
                ctx3.beginPath();
                ctx3.fillStyle = faceColor;
                ctx3.globalAlpha = 0.9;
                ctx3.arc(cclockx, cclocky, clockSize/2, 0, 2*Math.PI);
                ctx3.fill();
                //  face highlight
                ctx3.lineWidth = lightDarkWidth;
                ctx3.strokeStyle = faceLight; 
                ctx3.beginPath();
                ctx3.arc(cclockx, cclocky, clockSize/2, lightDarkAngle+Math.PI, lightDarkAngle+(Math.PI*2));
                ctx3.stroke();
                ctx3.closePath();
                //  face dark
                ctx3.strokeStyle = faceDark;
                ctx3.beginPath();
                ctx3.arc(cclockx, cclocky, clockSize/2, lightDarkAngle, lightDarkAngle+Math.PI);
                ctx3.stroke();
                ctx3.closePath();
                ctx3.lineWidth = strokeThickness;
              }
              
              // Layer 4: clock hands
              if (redrawLayer[4]) {
                // Hour hand
                ctx4.strokeStyle = handsColor;
                ctx4.beginPath();
                ctx4.moveTo(cclockx, cclocky);
                ctx4.lineTo(
                    cclockx + ( ( ( Math.sin( clockHandsPosition[i][j][0] ) ) * hourLength ) ),
                    cclocky + ( ( ( -Math.cos( clockHandsPosition[i][j][0] ) ) * hourLength ) )
                );
                ctx4.stroke();
                ctx4.closePath();
                
                // Minute hand
                ctx4.beginPath();
                ctx4.moveTo(cclockx, cclocky);
                ctx4.lineTo(
                    cclockx + ( ( ( Math.sin( clockHandsPosition[i][j][1] ) ) * minLength ) ),
                    cclocky + ( ( ( -Math.cos( clockHandsPosition[i][j][1] ) ) * minLength ) )
                );
                ctx4.stroke();
                ctx4.closePath();
              }
            }
          }
        } // end of if (redrawLayer[2/3/4])

        redrawLayer = [0,0,0,0,0];
      } catch(e) {
        log.innerHTML += e.toString() + "<br>";
      }
    }

    var fps = 30;
    var t;
    var t0 = Date.now();
    var tFrame = Date.now();
    var interval = 1000/fps;
    var delta;
    var frameNum = 0;
    var minFrame = 100;
    var maxFrame = 10000;
      
    function stepFrame() {
      // Stop execution after so many frames
      if (frameNum < maxFrame || maxFrame == -1) { 
        requestAnimationFrame(stepFrame);
        frameNum++;
      }
      t = Date.now();
      delta = t - tFrame;
      
      if (frameNum > minFrame) { 
        // Run code after time interval has passed  
        if (delta > interval) {
          tFrame = t - (delta % interval);
               
          clockHandsPosition = clockPattern(1, (t-t0)/1000, 0.1, [1, 1] );
          //clockHandsPosition = clockMessage(1, ["11"]);
          redrawLayer[2] = 1;
          redrawLayer[4] = 1;
          draw();
        }
      }
    }
     

    //getTime();
    //setClocks();
    // &&& DEV: Commenting out to manually set clocks to show chars
    // &&& stepFrame();
    // &&& draw();

    // &&& Reset the clocks to idle position
    for (i=0; i<nClockY; i++) {
      for (j=0; j<nClockX; j++) {
        clockHandsPosition[i][j] = clockIdlePosition;
      }
    }
    redrawLayer[2] = 1;
    redrawLayer[4] = 1;
    draw();
    
    // &&& Set clocks to show characters
    var xOffset, yOffset = 0;
    var k, l;
    for (k=0; k<clockChar.l["1"].length; k++) {
      for (l=0; l<clockChar.l["1"][0].length; l++) {
        clockHandsPosition[k][l] = clockChar.l["1"][k][l];
      }
    }
    xOffset = 3;
    for (k=0; k<clockChar.l["2"].length; k++) {
      for (l=0; l<clockChar.l["2"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["2"][k][l];
      }
    }
    xOffset = 8;
    for (k=0; k<clockChar.l["3"].length; k++) {
      for (l=0; l<clockChar.l["3"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["3"][k][l];
      }
    }
    xOffset = 13;
    for (k=0; k<clockChar.l["4"].length; k++) {
      for (l=0; l<clockChar.l["4"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["4"][k][l];
      }
    }
    xOffset = 18;
    for (k=0; k<clockChar.l["5"].length; k++) {
      for (l=0; l<clockChar.l["5"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["5"][k][l];
      }
    }
    xOffset = 23;
    for (k=0; k<clockChar.l["6"].length; k++) {
      for (l=0; l<clockChar.l["6"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["6"][k][l];
      }
    }
    xOffset = 0;
    yOffset = 6;
    for (k=0; k<clockChar.l["7"].length; k++) {
      for (l=0; l<clockChar.l["7"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["7"][k][l];
      }
    }
    xOffset = 4;
    for (k=0; k<clockChar.l["8"].length; k++) {
      for (l=0; l<clockChar.l["8"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["8"][k][l];
      }
    }
    xOffset = 9;
    for (k=0; k<clockChar.l["9"].length; k++) {
      for (l=0; l<clockChar.l["9"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["9"][k][l];
      }
    }
    xOffset = 14;
    for (k=0; k<clockChar.l["0"].length; k++) {
      for (l=0; l<clockChar.l["0"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l["0"][k][l];
      }
    } 
    xOffset = 19;
    for (k=0; k<clockChar.l[":"].length; k++) {
      for (l=0; l<clockChar.l[":"][0].length; l++) {
        clockHandsPosition[k+yOffset][l+xOffset] = clockChar.l[":"][k][l];
      }
    }
    

    redrawLayer[2] = 1;
    redrawLayer[4] = 1;
    draw();

    stepFrame();

  } catch(e) {
    log.innerHTML += e.toString() + "<br>";
  } 