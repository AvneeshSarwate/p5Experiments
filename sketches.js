var capture;
var previousPixels;
var flow;
var w = 1280*1.2,
    h = 720*1.2;
var step = 8;
var vidScale = 2;


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
function optical(draw=true){
    if(draw) clear();
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
            uMotionGraph.addSample(flow.flow.u);
            vMotionGraph.addSample(flow.flow.v);

            //the calculation of num-cells comes from flow.js code
            var devDim = [Math.floor((capture.width-step-1)/(2*step+1))+1, Math.floor((capture.height-step-1)/(2*step+1))+1]
            var devGrid = new Array(devDim[0]).fill(0).map(x => new Array(devDim[1]));
            var toCellInd = (x, y) => ({x: (x-step-1)/(2*step+1), y: (y-step-1)/(2*step+1)});

            strokeWeight(2);
            flow.flow.zones.forEach((zone) => {
                stroke(map(zone.u, -step, +step, 0, 255), map(zone.v, -step, +step, 0, 255), 128);
                //todo - flip visualization
                line(hFlip((zone.x*vidScale), w/2), zone.y*vidScale, hFlip((zone.x + zone.u)*vidScale, w/2), (zone.y + zone.v)*vidScale);
                var zoneInds =  toCellInd(zone.x, zone.y);
                try{
                    devGrid[zoneInds.x][zoneInds.y] = [zone.u, zone.v];
                }
                catch(err){
                    console.log(zoneInds);
                }
            });
            uDev += -flow.flow.u * 10;
            vDev += flow.flow.v * 10;
        }

        noFill();
        stroke(0);

        // draw left-right motion
        uMotionGraph.draw(width, height / 2);
        line(0, height / 4, width, height / 4);

        vMotionGraph.draw(width, height/2, height/2);
        line(0, height / 4 + height/2, width, height / 4 + height / 2);
    } 

    var tStep = 0.01;
    time4 += tStep;
    t2_4 += 0.02;
    var n = 200;
    var PI_n2 = PI/n;
    var transRad = [.02, .02];//[15*sinN(t2/2), 15*cosN(t2/2)];
    var decay = 1 ;//+ sinN(t2) * 0.02;
    var points = new Array(n);
    for (var i = n-1; i >= 0; i--) {
        //if(draw)translate(sin(t2_4+i*PI_n2) * transRad[0]*(n-i), cos(t2_4+i*PI_n2) * transRad[1]*(n-i));
        if(draw) fill((time4*(1/tStep)+i)%255);
        var t0 = time4 - i*tStep;
        points[i] = new p5.Vector(sinN(sin(t0*2 + cos(t0)*5) * 4) * centerX + centerX/2 + sin(t2_4+i*PI_n2) * transRad[0]*(n-i), cosN(cos(t0*2 + sin(t0)*5) * 4) * centerY + centerY/2 + cos(t2_4+i*PI_n2) * transRad[1]*(n-i));
        if(draw) ellipse(mod((points[i].x + uDev),w), mod((points[i].y + vDev),h), 100, 100);
    }

    return points;          
}