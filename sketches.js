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