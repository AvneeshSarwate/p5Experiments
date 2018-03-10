var port = new osc.WebSocketPort({
    url: "ws://" + window.location.hostname + ":8086"
});

port.on("message", function (oscMessage) {
    // Configure handlers here
    if (oscMessage.address == "/senselDraw"){
    	pointData = Array.from(oscMessage.args);
    	//console.log(pointData);
    } 
});

port.open();


var pointData = [];

function senselSetup(){
	createCanvas(w, h);
}


w = 1280;
h = 720;
var senselW = 230;
var senselH = 128;
var senselF = 1600; 
var drawXscale = w / senselW; 
var drawYscale = h / senselH; 
var pointScale = 300 / senselF;

var curveCounter = 0;
var activeTouches = new Set();
var curveTracker = {}; //keeps track of the curves that are drawn via id
var touchToCurve = {}; //maps active touches to the curves they are associated with
//touchData is of form [numTouches, touchId_k, k_x, k_y, k_force ...]  repeating for numTouches
getTouchIndices = touchData => new Set((new Array((touchData.length-1)/4)).fill(0).map((elem, i) => touchData[i*4]))
function formatTouchData(touchData){ //map touchIndices to their data (which is[x, y, force])
	var data = {};
	for(var i = 1; i < touchData.length; i += 4){
		data[touchData[i]] = touchData.slice(i+1, i+4);
	}
	return data;
}
//if new touchIDs come in, those are new touches

var rand = Math.random();

function sensel(){
	//clear();
	for(var i = 1; i < pointData.length; i += 4){
		ellipse(pointData[i+1] * drawXscale, pointData[i+2] * drawYscale, pointData[i+3] * pointScale, pointData[i+3] * pointScale);
	}

	var frameTouches = getTouchIndices(pointData);
	var frameTouchData = formatTouchData(pointData);
	var newTouches = frameTouches.difference(activeTouches);
	var deadTouches = activeTouches.difference(frameTouches);
	var continuingTouches = activeTouches.intersection(frameTouches);

	activeTouches = new Set(Array.from(a.values()).filter(el => c.has(el))); //remove dead touches from active

	newTouches.forEach(function(touchId) { //add start point of draw curve for new touches
		touchToCurve[touchId] = curveCounter;
		curveTracker[curveCounter] = [[frameTouchData[touchId]], [random(255), random(255), random(255)]];//list of points in curve and color
		curveCounter++;
	});
	activeTouches.difference(newTouches).forEach(function(touchId){//draw the newest curve segment for each active touch
		var curveId = touchToCurve[touchId];
		var curvePoints = curveTracker[curveId][0];
		var newPoint = frameTouchData[touchId];
		var lastPoint = curvePoints[curvePoints.length-1];
		var curveColor = curveTracker[curveId][1];
		stroke(curveColor[0], curveColor[1], curveColor[2]);
		strokeWeight(newPoint[2])

	});
}






/*

*/