var canvasX = 1280*1.2;
var canvasY = 720*1.2;
var centerX = canvasX/2;
var centerY = canvasY/2;
var showTree = true;
var cos = Math.cos;
var sin = Math.sin;
var sinN = n => (sin(n)+1)/2;
var cosN = n => (cos(n)+1)/2;
var textureVid;
var time = 0;
var t2 = 0;
var t3 = 0;
var td1 = 0;
var td4 = 0;
var colorInd = 0;
var frameInd = 0;
var indStart = 0;
var frameInd = 0;


var varying = 'precision highp float; varying vec2 vPos;';

// the vertex shader is called for each vertex
var vs =
  varying +
  'attribute vec3 aPosition;' +
  'void main() { vPos = (gl_Position = vec4(aPosition,1.0)).xy; }';

// the fragment shader is called for each pixel
var fs =
  varying +
  'uniform vec2 p;' +
  'uniform float r;' +
  'const int I = 500;' +
  'void main() {' +
  '  vec2 c = p + vPos * r, z = c;' +
  '  float n = 0.0;' +
  '  for (int i = I; i > 0; i --) {' +
  '    if(z.x*z.x+z.y*z.y > 4.0) {' +
  '      n = float(i)/float(I);' +
  '      break;' +
  '    }' +
  '    z = vec2(z.x*z.x-z.y*z.y, 2.0*z.x*z.y) + c;' +
  '  }' +
  '  gl_FragColor = vec4(0.5-cos(n*17.0)/2.0,0.5-cos(n*13.0)/2.0,0.5-cos(n*23.0)/2.0,1.0);' +
  '}';

var fs2 =
  varying +
  'uniform vec2 p;' +
  'uniform float r;' +
  'const int I = 500;' +
  'void main() {' +
  '  vec2 c = p + vPos * r, z = c;' +
  '  float n = 0.0;' +
  '  for (int i = I; i > 0; i --) {' +
  '    if(z.x*z.x+z.y*z.y > 4.0) {' +
  '      n = float(i)/float(I);' +
  '      break;' +
  '    }' +
  '    z = vec2(z.x*z.x-z.y*z.y, 2.0*z.x*z.y) + c;' +
  '  }' +
  '  gl_FragColor = 1.- vec4(0.5-cos(n*17.0)/2.0,0.5-cos(n*13.0)/2.0,0.5-cos(n*23.0)/2.0,1.0);' +
  '}';

var mandel;
var sh2;
function setupShaders() {
  createCanvas(1280, 720, WEBGL);

  // create and initialize the shader
  mandel = createShader(vs, fs);
  sh2 = createShader(vs, fs2);
  shader(sh2);
  noStroke();
  frameRate(30);
  // 'p' is the center point of the Mandelbrot image
  mandel.setUniform('p', [-0.74364388703, 0.13182590421]);
}

function drawShaders() {
  // 'r' is the size of the image in Mandelbrot-space
  clear();
  shader(sh2);
  quad(-1, -1, 1, -1, 1, 1, -1, 1);
  mandel.setUniform('r', 1.5 * exp(-6.5 * (1 + sin(millis() / 2000))));
  time += 0.1;
  shader(mandel);
  quad(-1, -1, 1*sinN(time)/2, -1, 1*sinN(time)/2, 1*sinN(time)/2, -1, 1*sinN(time)/2);
}

function sigmoid(t) {
    return 1/(1+Math.pow(Math.E, -t));
}

function setup(){
    createCanvas(1280, 720);
}

function draw(){
    clear();
    var v1 = draw1pos();
    var v2 = draw4pos();
    var blend = sigmoid(sin(time/10)*4);
    for(var i = 1; i < v2.length-1; i++){
        fill((time*10+i)%255);
        var x = v1[i].x * blend + v2[i].x * (1-blend);
        var y = v1[i].y * blend + v2[i].y * (1-blend);
        ellipse(x, y, 100, 100);
    }
}

function draw1(){
    clear();
    frameInd++;
    t2 += 0.1;
    time += .1*sigmoid(sin(t2)*3);
    t3 += .1*sigmoid(sin(t2)*3);
    translate(width/2, height/2);
    var n = 200;
    var n2 = n;
    var xRad = (90+cos(time/5)*300);
    var yRad = (90+sin(time/5)*40);
    var mousePos = abs(centerX-mouseX);
    var xDot = 150*sigmoid(sin(time/13)*8);
    var yDot = 150*sigmoid(cos(time/13)*8);
    var transRad = [15*sinN(t2/2), 15*cosN(t2/2)];
    var cent = new p5.Vector(centerX, centerY);
    rotate(PI/16 * t2, cent);
    var PI_5 = PI/5;
    var PI_n2 = PI/n2;
    for(var ind = n; ind > 0; ind--){
        var i = (indStart + ind)%n;
        translate(sin(t2+i*PI_n2) * transRad[0], cos(t2+i*PI_n2) * transRad[1]);
        fill((time*10+i)%255);
        ellipse(sin(i*PI_n2 + time)*xRad + sin(time+i/10)*10 + mousePos, 
                cos(i*PI_n2 + time)*yRad + cos(time+i/10)*10 + mousePos, xDot, yDot);
        rotate(PI_5 * i, cent);
    }
    indStart = 0;
}

function draw1pos(draw){
    if(draw) clear();
    frameInd++;
    t2 += 0.1;
    time += .1*sigmoid(sin(t2)*3);
    t3 += .1*sigmoid(sin(t2)*3);
    var n = 200;
    var points = new Array(n);
    var n2 = n;
    var xRad = (90+cos(time/5)*300);
    var yRad = (90+sin(time/5)*40);
    var mousePos = abs(centerX-mouseX);
    var xDot = 150*sigmoid(sin(time/13)*8);
    var yDot = 150*sigmoid(cos(time/13)*8);
    var transRad = [15*sinN(t2/2), 15*cosN(t2/2)];
    var cent = new p5.Vector(centerX, centerY);
    var PI_5 = PI/5;
    var PI_n2 = PI/n2;
    var translateAccum = [0, 0];
    //translate(centerX, centerY)
    for(var ind = n; ind > 0; ind--){
        var i = (indStart + ind)%n;
        translateAccum = [sin(t2+i*PI_n2) * transRad[0], cos(t2+i*PI_n2) * transRad[1]];
        if(draw) fill((time*10+i)%255);
        //rotate(PI_5 * i, cent);
        var v = (new p5.Vector (sin(i*PI_n2 + time)*xRad + sin(time+i/10)*10 + mousePos + translateAccum[0], 
                                      cos(i*PI_n2 + time)*yRad + cos(time+i/10)*10 + mousePos + translateAccum[1]));
        v = v.rotate(PI_5 * i, cent);
        points[ind] = new p5.Vector(v.x + centerX, v.y+centerY);
        if(draw) ellipse(points[ind].x, points[ind].y, 100, 100);
    }
    indStart = 0;
    return points;
}

function draw2(){
    clear();
    time += 0.1;
    translate(width/2, height/2);
    var n = 200;
    var n2 = n*1.1;
    var rad = 100;
    var xRad = (90+cos(time/5 + sin(time/10)*PI/2)*100);
    var yRad = (90+sin(time/5 + cos(time/10)*PI/2)*100);
    var PI_5 = PI/5; 
    var cent = new p5.Vector(centerX, centerY);
    for(var i = n; i > 0; i--){
        fill((time*10+i)%255);
        ellipse(sin(i/n*2*PI + time)*xRad + rad, 
                cos(i/n*2*PI + time)*yRad + rad, 200, 100);
        rotate(PI_5 * i, cent);
    }
}

function draw3(){
    clear();
    var tStep = 0.01;
    time += tStep;
    t2 += 0.05;
    var n = 100;
    var PI_n2 = PI/n;
    var transRad = [.07, .07];//[15*sinN(t2/2), 15*cosN(t2/2)];
    var decay = 1 ;//+ sinN(t2) * 0.02;
    for (var i = n/2; i > 0; i--) {
        //translate(sin(t2+i*PI_n2) * transRad[0]*(n-i), cos(t2+i*PI_n2) * transRad[1]*(n-i));
        fill((time*(1/tStep)+i)%255);
        var t0 = time - i*tStep;
        ellipse(sinN(sin(t0*2 + cos(t0)*5) * 4) * centerX + centerX/2,  cosN(cos(t0*2 + sin(t0)*5) * 4) * centerY + centerY/2, 100 * (decay**i), 100 * (decay**i));
    }   
    for (var i = n; i > n/2; i--) {
        //translate(sin(t2+i*PI_n2) * transRad[0]*(n-i), cos(t2+i*PI_n2) * transRad[1]*(n-i));
        fill((time*(1/tStep)+i)%255);
        var t0 = time - i*tStep;
        ellipse(sinN(sin(t0*2 + cos(t0)*5) * 4) * centerX + centerX/2,  cosN(cos(t0*2 + sin(t0)*5) * 4) * centerY + centerY/2, 100 * (decay**i), 100 * (decay**i));
    }         
}

function draw4(){
    clear();
    var tStep = 0.01;
    time += tStep;
    t2 += 0.02;
    var n = 200;
    var PI_n2 = PI/n;
    var transRad = [.02, .02];//[15*sinN(t2/2), 15*cosN(t2/2)];
    var decay = 1 ;//+ sinN(t2) * 0.02;
    for (var i = n/2; i > 0; i--) {
        translate(sin(t2+i*PI_n2) * transRad[0]*(n-i), cos(t2+i*PI_n2) * transRad[1]*(n-i));
        fill((time*(1/tStep)+i)%255);
        var t0 = time - i*tStep;
        ellipse(sinN(sin(t0*2 + cos(t0)*5) * 4) * centerX + centerX/2,  cosN(cos(t0*2 + sin(t0)*5) * 4) * centerY + centerY/2, 100 * (decay**i), 100 * (decay**i));

        var i2 = i+n/2;
        translate(sin(t2+i2*PI_n2) * transRad[0]*(n-i2), cos(t2+i2*PI_n2) * transRad[1]*(n-i2));
        fill((time*(1/tStep)+i2)%255);
        t0 = time - i2*tStep;
        ellipse(sinN(sin(t0*2 + cos(t0)*5) * 4) * centerX + centerX/2,  cosN(cos(t0*2 + sin(t0)*5) * 4) * centerY + centerY/2, 100 * (decay**i2), 100 * (decay**i2));
    }           
}

var time4 = 0;
var t2_4 = 0;
function draw4pos(draw){
    if(draw) clear();
    var tStep = 0.01;
    time4 += tStep;
    t2_4 += 0.02;
    var n = 200;
    var PI_n2 = PI/n;
    var transRad = [.02, .02];//[15*sinN(t2/2), 15*cosN(t2/2)];
    var decay = 1 ;//+ sinN(t2) * 0.02;
    var points = new Array(n);
    for (var i = n; i > 0; i--) {
        if(draw)translate(sin(t2_4+i*PI_n2) * transRad[0]*(n-i), cos(t2_4+i*PI_n2) * transRad[1]*(n-i));
        if(draw) fill((time4*(1/tStep)+i)%255);
        var t0 = time4 - i*tStep;
        points[i] = new p5.Vector(sinN(sin(t0*2 + cos(t0)*5) * 4) * centerX + centerX/2 + sin(t2_4+i*PI_n2) * transRad[0]*(n-i), cosN(cos(t0*2 + sin(t0)*5) * 4) * centerY + centerY/2 + cos(t2_4+i*PI_n2) * transRad[1]*(n-i));
        if(draw) ellipse(points[i].x, points[i].y, 100, 100);
    }
    return points;          
}