import "./style.css";
import { resizeCanvasToDisplaySize } from "../../node_modules/twgl.js";

let vertexShaderSource = `#version 300 es

// attribute is an input (in) to a vertex shader.
// it will receive data from a buffer.

in vec2 a_position;

uniform vec2 u_resolution;

// all shaders have a main function
void main() {

  vec2 zeroToOne = a_position / u_resolution;

  vec2 zeroToTwo = zeroToOne * 2.0;

  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

let fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default, it means high precision.
precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // Just set the output to a constant reddish purple
  outColor = u_color;
}
`;

function init() {
  let canvas = <HTMLCanvasElement>document.querySelector("#c");

  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  let fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  if (!vertexShader || !fragmentShader) {
    return;
  }

  // Create a GLSL program on the GPU.
  let program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) {
    return;
  }

  let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  let resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution"
  );
  let colorLocation = gl.getUniformLocation(program, "u_color");

  let positionBuffer = gl.createBuffer();

  if (!positionBuffer) {
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  let positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30];
  // STATIC_DRAW tells WebGL that the buffer data will likely not change
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // a collection of attribute states
  let vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttributeLocation);

  let size = 2; // 2 components per iteration
  let type = gl.FLOAT; // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  resizeCanvasToDisplaySize(gl.canvas);

  // This tells WebGL the -1 +1 clip space maps to 0 <-> gl.canvas.width for x and 0 <-> gl.canvas.height for y.
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Pass in the canvas resolution so we can convert from
  // pixels to clip space in the shader
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  gl.bindVertexArray(vao);

  // Because we set primitiveType to gl.TRIANGLES, each time our vertex shader
  // is run 3 times WebGL will draw a triangle based on the 3 values we set
  // gl_Position to. No matter what size our canvas is those values are in clip
  // space coordinates that go from -1 to 1 in each direction.
  // let primitiveType = gl.TRIANGLES;
  // offset = 0;
  // // execute shader 3 times
  // let count = 6;
  // gl.drawArrays(primitiveType, offset, count);

  for (var ii = 0; ii < 50; ++ii) {
    // Setup a random rectangle
    setRectangle(
      gl,
      randomInt(300),
      randomInt(300),
      randomInt(300),
      randomInt(300)
    );

    // Set a random color.
    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

// Returns a random integer from 0 to range - 1.
function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  let shader = gl.createShader(type);
  if (!shader) {
    console.log("fail to create shader");
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log("fail to compile shader");
    gl.deleteShader(shader);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  let program = gl.createProgram();
  if (!program) {
    console.log("fail to create program");
    return program;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  return program;
}

function setRectangle(
  gl: WebGL2RenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

init();
