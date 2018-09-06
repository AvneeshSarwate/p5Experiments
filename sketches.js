var capture;
var previousPixels;
var flow;
var w = 1280*1.2,
    h = 720*1.2;
var step = 8;
var vidScale = 2;
var cos = Math.cos;
var sin = Math.sin;
var sinN = n => (sin(n)+1)/2;
var cosN = n => (cos(n)+1)/2;
var canvasX = 1280*1.2;
var canvasY = 720*1.2;
var centerX = canvasX/2;
var centerY = canvasY/2;

function sigmoid(t) {
    return 1/(1+Math.pow(Math.E, -t));
}

var distF = (a, b) => ((a.x-b.x)**2 + (a.y-b.y)**2)**(1/2);


function opticalSetup() {
    createCanvas(w, h);
    capture = createCapture(VIDEO);
    capture.size(w/vidScale, h/vidScale);
    capture.hide();
    flow = new FlowCalculator(step);
    uMotionGraph = new Graph(100, -step / 2, +step / 2);
    vMotionGraph = new Graph(100, -step / 2, +step / 2);
}

var hFlip = (n, x) => (n-x)*-1+x; //flip a point around an x-axis value
var uDev=0, vDev=0; 
var pointDevs = new Array(200);
var mod = (x, n) => ((x%n)+n)%n;
var n = 200;
var PI_n2 = Math.PI/n;
var transRad = [.02, .02];//[15*sinN(t2/2), 15*cosN(t2/2)];

//function that calculates the "original" path of the animation
var calculatePosition = (t0, t2_4, i) => ({x: sinN(sin(t0*2 + cos(t0)*5) * 4) * centerX + centerX/2 + sin(t2_4+i*PI_n2) * transRad[0]*(n-i), 
                                     y: cosN(cos(t0*2 + sin(t0)*5) * 4) * centerY + centerY/2 + cos(t2_4+i*PI_n2) * transRad[1]*(n-i)});
var points = new Array(n).fill(0).map((x, i) => calculatePosition(0 - 0.01*i, 0, i)); //initialize shape
var frameInd = 0;

//the calculation of num-cells comes from flow.js code
var devDim = [Math.floor((w/vidScale-step-1)/(2*step+1))+1, Math.floor((h/vidScale-step-1)/(2*step+1))+1]
var devGrid = new Array(devDim[0]).fill(0).map(x => new Array(devDim[1]).fill(0).map(x => ({x:0, y:0})));
//add scale value because our drawing is a different size than our camera frame
var toCellInd = (x, y, scale) => ({x: Math.max((x/scale-step-1)/(2*step+1), 0), y: Math.max((y/scale-step-1)/(2*step+1), 0)});
var maxFlow = 0;

var positions = new Array(n).fill(0).map((x, i) => calculatePosition(0 - 0.01*i, 0, i));
var lastPositions = new Array(n).fill(0).map((x, i) => calculatePosition(0 - 0.01*(i+1), -0.02, i));

function optical(draw=true){
    if(draw) clear();

    var tStep = 0.01;
    time4 += tStep;
    t2_4 += 0.02;
    var decay = 1 ;//+ sinN(t2) * 0.02;   
    var devWeight = 2;
    var returnDevWeight = 2;
     
    for (var i = n-1; i >= 0; i--) {
        if(draw) fill((time4*(1/tStep)+i)%255);
        if(draw) ellipse(points[i].x, points[i].y, 100, 100);
    }

    positions = new Array(n).fill(0).map((x, i) => calculatePosition(time4 - tStep*i, t2_4, i));

    for (var i = n-1; i >= 0; i--) {
        //if(draw)translate(sin(t2_4+i*PI_n2) * transRad[0]*(n-i), cos(t2_4+i*PI_n2) * transRad[1]*(n-i));
        var point = points[i];
        var t0 = time4 - i*tStep;
        var pos = positions[i]; 
        var lastPos = lastPositions[i]; //position 1 timestep back
        var pathDev = {x: pos.x - lastPos.x, y: pos.y - lastPos.y} //the incrimental movement of the circle due to the "orignal" path movement

        //what "cell" of video to get optical flow value from for this circle
        var circleDevInd = toCellInd(points[i].x, points[i].y, vidScale); 
        circleDevInd = {x: Math.floor(circleDevInd.x), y: Math.floor(circleDevInd.y)};
        var circleDev = devGrid[circleDevInd.x][circleDevInd.y]; //optical flow "force" for the circle

        var returnDev = {x: lastPos.x-point.x, y: lastPos.y-point.y}; //raw position difference between "original" path and current position
        var returnMag = (returnDev.x**2 + returnDev.y**2)**(1/2);
        var returnDevNorm = returnMag == 0 ? 0 : returnDevWeight/returnMag;
        returnDev = {x: returnDev.x * returnDevNorm, y: returnDev.y * returnDevNorm}; //the final "force" pushing a circle back to its original path
        // circleDev = {x:0, y:0};
        

        var posDiff = {x: pathDev.x + circleDev.x*devWeight + returnDev.x, y: pathDev.y + circleDev.y*devWeight + returnDev.y};
        // points[i] = new p5.Vector(pos.x, pos.y);
        // if(draw) ellipse(mod((points[i].x + uDev),w), mod((points[i].y + vDev),h), 100, 100);
        var newPoint = new p5.Vector(mod((point.x + posDiff.x), w), mod((point.y + posDiff.y ), h));
        points[i] = newPoint;
    }

    lastPositions = positions;

    capture.loadPixels();

    if (capture.pixels.length > 0) {
        if (previousPixels) {

            // cheap way to ignore duplicate frames
            if (same(previousPixels, capture.pixels, 4, width)) {
                return;
            }

            flow.calculate(previousPixels, capture.pixels, capture.width, capture.height);
        }
        previousPixels = copyImage(capture.pixels, previousPixels);


        if (flow.flow && flow.flow.u != 0 && flow.flow.v != 0) {
            // uMotionGraph.addSample(flow.flow.u);
            // vMotionGraph.addSample(flow.flow.v);

            strokeWeight(2);
            flow.flow.zones.forEach((zone) => {
                stroke(map(zone.u, -step, +step, 0, 255), map(zone.v, -step, +step, 0, 255), 128);
                //fliped visualization to look like proper mirroring
                line(hFlip((zone.x*vidScale), w/2), zone.y*vidScale, hFlip((zone.x + zone.u)*vidScale, w/2), (zone.y + zone.v)*vidScale);
                var zoneInds =  toCellInd(zone.x, zone.y, 1); 
                zoneInds.x = (devDim[0]-1) - zoneInds.x; //flip x axis b/c camera is flipped
                var flowThresh = 5;
                var filteredFlow = {u: Math.abs(zone.u) < flowThresh ? 0 : zone.u, v: Math.abs(zone.v) < flowThresh ? 0 : zone.v };
                devGrid[zoneInds.x][zoneInds.y] = {x: -filteredFlow.u, y: filteredFlow.v}; //flip x-dev direction b/c camera is flipped

            });
            uDev += -flow.flow.u * 10;
            vDev += flow.flow.v * 10;
        }

        // noFill();
        // stroke(0);

        // // draw left-right motion
        // uMotionGraph.draw(width, height / 2);
        // line(0, height / 4, width, height / 4);

        // vMotionGraph.draw(width, height/2, height/2);
        // line(0, height / 4 + height/2, width, height / 4 + height / 2);
    } 

    frameInd++;
    return points;          
}


function hulldrawSetup(){
    createCanvas(w, h);
    capture = createCapture(VIDEO);
    capture.size(w/vidScale, h/vidScale);
    capture.hide();
    flow = new FlowCalculator(step);
    frameRate(20);
}

function hulldraw(){
    clear();
    background(255);
    capture.loadPixels();

    if (capture.pixels.length > 0) {
        if (previousPixels) {

            // cheap way to ignore duplicate frames
            if (same(previousPixels, capture.pixels, 4, width)) {
                return;
            }

            flow.calculate(previousPixels, capture.pixels, capture.width, capture.height);
        }
        previousPixels = copyImage(capture.pixels, previousPixels);

        var flowScreenPoints = new Array();

        if (flow.flow && flow.flow.u != 0 && flow.flow.v != 0) {
            // uMotionGraph.addSample(flow.flow.u);
            // vMotionGraph.addSample(flow.flow.v);

            strokeWeight(2);
            flow.flow.zones.forEach((zone, i) => {
                stroke(map(zone.u, -step, +step, 0, 255), map(zone.v, -step, +step, 0, 255), 128);
                //fliped visualization to look like proper mirroring
                strokeWeight(Math.abs(zone.u) + Math.abs(zone.v));
                line(hFlip((zone.x*vidScale), w/2), zone.y*vidScale, hFlip((zone.x + zone.u)*vidScale, w/2), (zone.y + zone.v)*vidScale);
                var flowThresh = 5;
                if(Math.abs(zone.u) > flowThresh && Math.abs(zone.v) > flowThresh){
                    flowScreenPoints.push([hFlip((zone.x*vidScale), w/2), zone.y*vidScale]);
                }

                var zoneInds =  toCellInd(zone.x, zone.y, 1); 
                zoneInds.x = (devDim[0]-1) - zoneInds.x; //flip x axis b/c camera is flipped
                var flowThresh = 5;
                var filteredFlow = {u: Math.abs(zone.u) < flowThresh ? 0 : zone.u, v: Math.abs(zone.v) < flowThresh ? 0 : zone.v };

            });
        }

        noFill();
        strokeWeight(10);
        stroke(0);
        var hullPoints = hull(flowScreenPoints, 300);
        var useBezier = false;
        if(useBezier) { 
            bezier.apply(null, [].concat.apply([], hullPoints));
            // bezier(85, 20, 10, 10, 90, 90, 15, 80);
        } else {
            beginShape();
            for(var i = 0; i < hullPoints.length; i++){
                curveVertex(hullPoints[i][0], hullPoints[i][1]);
            }
            endShape(CLOSE);
        }
    } 
}



var dispNoise = [];
function bodygravSetup() {
    vidScale = 1.5;
    createCanvas(w, h);
    capture = createCapture(VIDEO);
    capture.size(w/vidScale, h/vidScale);
    capture.hide();
    flow = new FlowCalculator(step);
    uMotionGraph = new Graph(100, -step / 2, +step / 2);
    vMotionGraph = new Graph(100, -step / 2, +step / 2);
    points = flow.flowCellCenters(w/vidScale, h/vidScale, vidScale);
    refPositions = flow.flowCellCenters(w/vidScale, h/vidScale, vidScale);
    distances = new Array(points.length).fill(0);
    dispNoise = new Array(points.length).fill(0);
    //the calculation of num-cells comes from flow.js code
    devDim = [Math.floor((w/vidScale-step-1)/(2*step+1))+1, Math.floor((h/vidScale-step-1)/(2*step+1))+1]
    devGrid = new Array(devDim[0]).fill(0).map(x => new Array(devDim[1]).fill(0).map(x => ({x:0, y:0})));
    frameRate(30);
}

var refPositions;
var distances; 
function bodygrav(draw=true){
    if(draw) clear();

    var tStep = 0.2; 0.2+0.6*sinN(t2_4);
    time4 += tStep;
    t2_4 += 0.02;
    var decay = 1 ;//+ sinN(t2) * 0.02;   
    var devWeight = 2;
    var returnDevWeight = 2;
    for (var i = 0; i < points.length; i++) {
        fill(sigmoid(distances[i]/4 - 8)*255);
        // ellipse(points[i].x, points[i].y, 10, 10);
        var p=points[i];
        var r=10;
        // rect(p.x-r, p.y-r, 2*r, 2*r);
        dispNoise[i] += (Math.random() - 0.5);
        // rect(p.x-r + dispNoise[i], p.y-r + dispNoise[i], r+2*r*sinN(time4+i*sinN(tStep/4)) + dispNoise[i], r+2*r*cosN(time4+i*cosN(tStep/4)) + dispNoise[i]);
        rect(p.x-r, p.y-r, r+2*r*sinN(time4+dispNoise[i]+i*sinN(tStep/4)), r+2*r*cosN(time4+dispNoise[i]+i*cosN(tStep/4)));
    }

    for (var i = 0; i < points.length; i++) {
        var point = points[i];

        //what "cell" of video to get optical flow value from for this circle
        var circleDevInd = toCellInd(points[i].x, points[i].y, vidScale); 
        circleDevInd = {x: Math.floor(circleDevInd.x), y: Math.floor(circleDevInd.y)};
        var circleDev = devGrid[circleDevInd.x][circleDevInd.y]; //optical flow "force" for the circle

        var returnDev = {x: (refPositions[i].x-point.x)/2, y: (refPositions[i].y-point.y)/2}; //raw position difference between "original" path and current position
        // var returnMag = (returnDev.x**2 + returnDev.y**2)**(1/2);
        // var returnDevNorm = returnMag == 0 ? 0 : returnMag / 2;
        // returnDev = {x: returnDev.x * returnDevNorm, y: returnDev.y * returnDevNorm}; //the final "force" pushing a circle back to its original path
        // circleDev = {x:0, y:0};
        

        var posDiff = {x: circleDev.x*devWeight + returnDev.x, y: circleDev.y*devWeight + returnDev.y};
        // points[i] = new p5.Vector(pos.x, pos.y);
        // if(draw) ellipse(mod((points[i].x + uDev),w), mod((points[i].y + vDev),h), 100, 100);
        var newPoint = new p5.Vector(mod((point.x + posDiff.x), w), mod((point.y + posDiff.y ), h));
        points[i] = newPoint;
        distances[i] = distF(points[i], refPositions[i]);
    }

    capture.loadPixels();

    if (capture.pixels.length > 0) {
        if (previousPixels) {

            // cheap way to ignore duplicate frames
            if (same(previousPixels, capture.pixels, 4, width)) {
                return;
            }

            flow.calculate(previousPixels, capture.pixels, capture.width, capture.height);
        }
        previousPixels = copyImage(capture.pixels, previousPixels);


        if (flow.flow && flow.flow.u != 0 && flow.flow.v != 0) {
            // uMotionGraph.addSample(flow.flow.u);
            // vMotionGraph.addSample(flow.flow.v);

            // strokeWeight(2);
            flow.flow.zones.forEach((zone) => {
                // stroke(map(zone.u, -step, +step, 0, 255), map(zone.v, -step, +step, 0, 255), 128);
                //fliped visualization to look like proper mirroring
                // line(hFlip((zone.x*vidScale), w/2), zone.y*vidScale, hFlip((zone.x + zone.u)*vidScale, w/2), (zone.y + zone.v)*vidScale);
                var zoneInds =  toCellInd(zone.x, zone.y, 1); 
                zoneInds.x = (devDim[0]-1) - zoneInds.x; //flip x axis b/c camera is flipped
                var flowThresh = 5;
                var filteredFlow = {u: Math.abs(zone.u) < flowThresh ? 0 : zone.u, v: Math.abs(zone.v) < flowThresh ? 0 : zone.v };
                devGrid[zoneInds.x][zoneInds.y] = {x: -filteredFlow.u, y: filteredFlow.v}; //flip x-dev direction b/c camera is flipped

            });
            uDev += -flow.flow.u * 10;
            vDev += flow.flow.v * 10;
        }

        // noFill();
        // stroke(0);

        // // draw left-right motion
        // uMotionGraph.draw(width, height / 2);
        // line(0, height / 4, width, height / 4);

        // vMotionGraph.draw(width, height/2, height/2);
        // line(0, height / 4 + height/2, width, height / 4 + height / 2);
    } 

    frameInd++;
    return points;          
}





function blobWarpSetup(){
    createCanvas(w, h);
}


function blobWarp(){
    translate(50, 50);
    stroke(255, 0, 0);
    beginShape();
    // Exterior part of shape, clockwise winding
    curveVertex(-40, -40);
    curveVertex(40, -40);
    curveVertex(40, 40);
    curveVertex(-40, 40);
    curveVertex(-40, -40);
    // Interior part of shape, counter-clockwise winding
    
    endShape(CLOSE);
}



/*the arduino doesn't have enough memory to draw a whole frame at once
so we have to chunk the frame into blocks*/
var blocksPerFrame = 5; 
w=1280;
h=720;
function terraceSetup(){
    createCanvas(w, h);
    var fullFrameRate = 2.66; //
    // frameRate(fullFrameRate * blocksPerFrame);
}

var xPix = 60; //number of pixels in x dimension on LED screen
var yPix = 50; //number of pixels in y dimension on LED screen
var cellX = w/xPix; //number of p5 pixels per LED pixel in x dimension
var cellY = h/yPix; //number of p5 pixels per LED pixel in y dimension
var frames = 0; //counter for number of frames
var rowsPerDrawCycle = yPix / blocksPerFrame; 

//takes 0-1 scaled x and y coordinates and a frame number count, returns an RGB value color array (3 values [0-255])
function colorMap1(x, y, time){
    return [((x * time/6.5) % 1) * 255, ((y * time/3.5) % 1) * 255, sinN(time/2.5) * 255];
}


function colorMap2(x, y, time){
    var circlepoint = [sinN(time/5), cosN(time/3)];
    return [dist(x,y,0.5,0.5)*255, dist(x,y,circlepoint[0],circlepoint[1])*255, sinN(time/11)*255];
}

function colorMap5(x, y, time){
  function warp1(x, y, t){
    return (x + t/10) % 1 * sinN(t/11) * (y + t/10) % 1 * cosN(t/13) * 255;
  }
  var t = time / 10;
    return [warp1(x, y, t), warp1(x, y, t*2), warp1(x, y, t*3)]; 
}

//quantizes a 0-255 valiue into quanLev different levels (e.g, simulate 4 bit range)
function quant(val, quantLevel){
  return Math.floor(val/quantLevel) * quantLevel;
}

function quantV(val, quantLev){
  return val.map(v => quant(v, quantLev)); 
}

//takes actual pixel index intergers as x and y (not normalized [0-1] values)
function colorMap6(x, y, time){
    var t2 = time ^ 255;
    var t3 = time & (3 << 3);
    
    return [(((x << t3) + time) & 255) & 255, ((y + (time << 2)) ^ x) % 255, (t2 ^ 255) % 255];
}

//takes actual pixel index intergers as x and y (not normalized [0-1] values)
function colorMap7(x, y, time){
    var t2 = time ^ 255;
    var t3 = time & (3 << 2);
    
    return [(((x << t3) + time) & 255) & 255, ((y + (time << 2)) ^ x) % 255, ((x^t2) | (y^t2)) % 255];
}

//takes actual pixel index intergers as x and y (not normalized [0-1] values)
function colorMap8(x, y, time){
    var t2 = time ^ 255;
    var t3 = time & (167);
    
    return [((x^time) | (y^time)) % 255, ((x^t3) | (y^t2)) % 255, ((x^t2) | (y^t2)) % 255];
}


function terrace(){
    //loop through the pixels
    var frameSliceRow = (frames % 5) * 10;
    for(var x = 0; x < xPix; x++){
        for(var y = 0; y < yPix; y++){

            //set the color for the pixels
            // var timeVal =Math.floor(frames/5);
            var timeVal = frames;
            var c = colorMap5(x/xPix, y/yPix, timeVal);
            // var c = colorMap6(x, y, timeVal);
            c = quantV(c, 16);
            stroke(c);
            fill(c);
            rect(x * cellX, y*cellY, cellX, cellY);
        }
    }
    frames++;
}

function terrace2Setup(){
    terraceSetup()
}

function terrace2(){
    for(var x = 0; x < xPix; x++){
        for(var y = 0; y < yPix; y++){
            var timeVal = frames;
            var c = colorMap8(x, y, timeVal);
            c = quantV(c, 16);
            stroke(c);
            fill(c);
            rect(x * cellX, y*cellY, cellX, cellY);
        }
    }
    frames++;
}



var p5w = 1280 * 1.5;
var p5h = 720 * 1.5;
var xStep = 10;
var yStep = 10;
var stepDist = 10;
var xPos = p5w/2;
var yPos = p5h/2;
var mat;
var sinN = t => (Math.sin(t)+1)/2
var numPoints = 200;
var arrayOf = n => Array.from(new Array(n), () => 0);
var curvePoints = arrayOf(100);
function mod(n, m) {
  return ((n % m) + m) % m;
}

function wrapVal(val, low, high){
    var range  = high - low;
    if(val > high){
        var dif = val-high;
        var difMod = mod(dif, range);
        var numWrap = (dif-difMod)/range;
        // console.log("high", dif, difMod, numWrap)
        if(mod(numWrap, 2) == 0){
            return high - difMod;
        } else {
            return low + difMod;
        }
    }
    if(val < low){
        var dif = low-val;
        var difMod = mod(dif, range);
        var numWrap = (dif- difMod)/range ;
        // console.log("low", dif, difMod, numWrap)
        if(mod(numWrap, 2.) == 0.){
            return low + difMod;
        } else {
            return high - difMod;
        }
    }
    return val;
}

class Snake {
    constructor(numPoints, snakeColor, switchFunc){
        this.points = arrayOf(numPoints).map(x => [p5w/2, p5h/2]);
        this.switchFunc = switchFunc;
        this.xPos = p5w/2;
        this.yPos = p5h/2;
        this.stepDist = 10;
        this.xStep = 10;
        this.yStep = 10;
        this.snakeColor = snakeColor;
        this.numPoints = numPoints;
    }

    drawSnake(frameCount){
        if(this.xPos + this.xStep > p5w || this.xPos + xStep < 0) this.xStep *= -1;
        if(this.yPos + this.yStep > p5h || this.yPos + this.yStep < 0) this.yStep *= -1;
        this.xPos = wrapVal(this.xPos+this.xStep, 0, p5w);
        this.yPos = wrapVal(this.yPos+this.yStep, 0, p5h);
        if(frameCount%60 == 0) {
            this.xStep = sin(Math.random()*TWO_PI) * this.stepDist;
            this.yStep = cos(Math.random()*TWO_PI) * this.stepDist;
        }
        var curveInd = frameCount%this.numPoints;
        this.points[curveInd] = [this.xPos, this.yPos];
        // fill(this.snakeColor);
        noFill();
        // strokeWeight(30);
        stroke(this.snakeColor);
        // beginShape();
        for(var i = 0; i < this.numPoints-1; i++){ //indexing 
            var p = this.points[(curveInd+i+1)%this.numPoints];
            var p2 = this.points[(curveInd+i+2)%this.numPoints];
            // ellipse(p[0], p[1], 4 + sinN((frameCount + i)/20)*30);
            strokeWeight((4 + sinN((frameCount + i)/20)*50)*4)
            line(p[0], p[1], p2[0], p2[1]);
            // curveVertex(p[0], p[1]);
        }
        endShape();
    }
}

var sneks = arrayOf(6);
function phialSetup(){
    createCanvas(p5w, p5h);
    background(255);
    sneks = sneks.map((x, i) => new Snake(200, color(i*10, i*10, i*10)));
}

function phial(){
    clear();
    background(255);
    
    // fill(0);
    // if(xPos + xStep > p5w || xPos + xStep < 0) xStep *= -1;
    // if(yPos + yStep > p5h || yPos + yStep < 0) yStep *= -1;
    // xPos = wrapVal(xPos+xStep, 0, p5w);
    // yPos = wrapVal(yPos+yStep, 0, p5h);
    // if(frameCount%60 == 0) {
    //     xStep = sin(Math.random()*TWO_PI) * stepDist;
    //     yStep = cos(Math.random()*TWO_PI) * stepDist;
    // }
    // var curveInd = frameCount%numPoints;
    // curvePoints[curveInd] = [xPos, yPos];
    // if(frameCount > numPoints) {
    //     // beginShape();
    //     for(var i = 0; i < numPoints; i++){
    //         var p = curvePoints[(curveInd+i)%numPoints];
    //         // strokeWeight();
    //         ellipse(p[0], p[1], 4 + sinN((frameCount + i)/20)*30);
    //     }
    //     // endShape();
    // }
    sneks.map(snek => snek.drawSnake(frameCount));
    frameCount++;
}

var midiInfo;
var rawMidi;
var trackLen = 77;
var noteColors = [
    "blue",
    "black",
    "blue",
    "blue",
    "red",
    "yellow",
    "green",
    "green"
];
var colorKeyInfo = [
    ["green", "up and down"],
    ["yellow", "flat"],
    ["red", "up"],
    ["blue", "down"],
    ["black", "unique phrase"]
];
//low to high
var pitchOrdering = [5, 3, 4, 2, 1, 0, 6, 7];
function chairSqueakSetup(){
    createCanvas(p5w, p5h);
    MidiConvert.load("chairsqueak.mid", function(midi) {
      console.log(midi);
      rawMidi = midi;
      midiInfo = midi.tracks[0].notes.map( n => [n.midi-64, n.time*2*71.5/60, n.duration*2*71.5/60])
    });
    textSize(15);
    textStyle(NORMAL);
}

function chairSqueak(){
    var endOffsets = 30;
    var pixPerSec = (p5w - 2*endOffsets) / 77;
    var heighOffset = p5h/4;
    var rectHeight = (p5h/2)/noteColors.length;
    strokeWeight(2);

    var keyOffset = 10;
    var titleOffset = 40;
    strokeWeight(0.5);
    text("Pitch curve direction per sonic event", keyOffset, keyOffset*2);
    for(var i = 0; i < 5; i++){
        strokeWeight(2);
        fill(colorKeyInfo[i][0]);
        rect(keyOffset, keyOffset + rectHeight/2 * i + titleOffset, 2.5*pixPerSec, rectHeight/2-10);
        strokeWeight(0.5);
        fill(0);
        text(colorKeyInfo[i][1], keyOffset +2.5*pixPerSec + 10, keyOffset + rectHeight/2 * (i+0.5) + titleOffset);
    }


    strokeWeight(2);
    if(midiInfo){
        midiInfo.forEach(note => {
            fill(noteColors[note[0]]);
            var pitchHeighInd = pitchOrdering.indexOf(note[0]);
            rect(note[1]*pixPerSec+endOffsets, p5h - (heighOffset + rectHeight*pitchHeighInd), note[2]*pixPerSec, rectHeight);
        })
    }
    arrayOf(77).forEach((elem, ind) => {
        stroke(0);
        var tickX = endOffsets + ind*pixPerSec;
        var tickTop = p5h - heighOffset + rectHeight + 10;
        strokeWeight(1);
        if(ind%5 == 0) {
            fill(0);
            strokeWeight(0.5);
            text(""+ind, tickX, tickTop+rectHeight*0.4);
            strokeWeight(5);
        }
        line(tickX, tickTop, tickX, tickTop+rectHeight*0.1);
    });
}