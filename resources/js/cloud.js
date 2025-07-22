// 캔버스 설정
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
  alert('WebGL을 지원하지 않는 브라우저입니다.');
  console.error('WebGL 초기화 실패');
}

// 디버그 정보
console.log('WebGL 초기화 완료');

// 캔버스 크기 설정
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 노이즈 텍스처 생성
function createNoiseTexture(size) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size * 4; i += 4) {
    const value = Math.random() * 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.generateMipmap(gl.TEXTURE_2D);
  
  return texture;
}

// 쉐이더 설정
const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;
  
  varying highp vec2 vTextureCoord;
  
  void main() {
    gl_Position = aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

const fragmentShaderSource = `
  precision highp float;
  varying highp vec2 vTextureCoord;
  
  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec2 iMouse;
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;
  
  #define LOOK 1
  #define NOISE_METHOD 1
  #define USE_LOD 1
  
  mat3 setCamera(in vec3 ro, in vec3 ta, float cr) {
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw,cp));
    vec3 cv = normalize(cross(cu,cw));
    return mat3(cu, cv, cw);
  }
  
  float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    
    vec2 uv = (p.xy+vec2(37.0,239.0)*p.z) + f.xy;
    vec2 rg = texture2D(iChannel0, (uv+0.5)/256.0).yx;
    return mix(rg.x, rg.y, f.z) * 2.0 - 1.0;
  }
  
  float map5(in vec3 p) {    
    vec3 q = p - vec3(0.0, 0.1, 1.0) * iTime;    
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;    
    f += 0.25000 * noise(q); q = q * 2.03;    
    f += 0.12500 * noise(q); q = q * 2.01;    
    f += 0.06250 * noise(q); q = q * 2.02;    
    f += 0.03125 * noise(q);    
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }
  
  float map4(in vec3 p) {    
    vec3 q = p - vec3(0.0, 0.1, 1.0) * iTime;    
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;    
    f += 0.25000 * noise(q); q = q * 2.03;    
    f += 0.12500 * noise(q); q = q * 2.01;   
    f += 0.06250 * noise(q);    
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }
  
  float map3(in vec3 p) {
    vec3 q = p - vec3(0.0, 0.1, 1.0) * iTime;    
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;    
    f += 0.25000 * noise(q); q = q * 2.03;    
    f += 0.12500 * noise(q);    
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }
  
  float map2(in vec3 p) {    
    vec3 q = p - vec3(0.0, 0.1, 1.0) * iTime;    
    float f;
    f  = 0.50000 * noise(q); q = q * 2.02;    
    f += 0.25000 * noise(q);    
    return clamp(1.5 - p.y - 2.0 + 1.75 * f, 0.0, 1.0);
  }
  
  const vec3 sundir = vec3(-0.7071, 0.0, -0.7071);
  
  #define MARCH(STEPS,MAPLOD) for(int i=0; i<STEPS; i++) { vec3 pos = ro + t*rd; if( pos.y<-3.0 || pos.y>2.0 || sum.a>0.99 ) break; float den = MAPLOD( pos ); if( den>0.01 ) { float dif = clamp((den - MAPLOD(pos+0.3*sundir))/0.6, 0.0, 1.0 ); vec3  lin = vec3(1.0,0.6,0.3)*dif+vec3(0.91,0.98,1.05); vec4  col = vec4( mix( vec3(1.0,0.95,0.8), vec3(0.25,0.3,0.35), den ), den ); col.xyz *= lin; col.xyz = mix( col.xyz, bgcol, 1.0-exp(-0.003*t*t) ); col.w *= 0.4; col.rgb *= col.a; sum += col*(1.0-sum.a); } t += max(0.06,0.05*t); }
  
  vec4 raymarch(in vec3 ro, in vec3 rd, in vec3 bgcol, in vec2 px) {    
    vec4 sum = vec4(0.0);    
    float t = 0.05 * texture2D(iChannel1, mod(px/256.0, 1.0)).x;    
    
    MARCH(40, map5);    
    MARCH(40, map4);    
    MARCH(30, map3);    
    MARCH(30, map2);    
    
    return clamp(sum, 0.0, 1.0);
  }
  
  vec4 render(in vec3 ro, in vec3 rd, in vec2 px) {
    // 배경 하늘         
    float sun = clamp(dot(sundir, rd), 0.0, 1.0);    
    vec3 col = vec3(0.6, 0.71, 0.75) - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;    
    col += 0.2 * vec3(1.0, 0.6, 0.1) * pow(sun, 8.0);    
    
    // 구름        
    vec4 res = raymarch(ro, rd, col, px);    
    col = col * (1.0 - res.w) + res.xyz;        
    
    // 태양 반사        
    col += vec3(0.2, 0.08, 0.04) * pow(sun, 3.0);    
    
    return vec4(col, 1.0);
  }
  
  void main() {
    vec2 fragCoord = vTextureCoord * iResolution;
    vec2 p = (2.0 * fragCoord - iResolution) / iResolution.y;
    
    vec2 m = iMouse / iResolution;
    
    // 카메라
    vec3 ro = 4.0 * normalize(vec3(sin(3.0 * m.x), 0.8 * m.y, cos(3.0 * m.x))) - vec3(0.0, 0.1, 0.0);
    vec3 ta = vec3(0.0, -1.0, 0.0);
    mat3 ca = setCamera(ro, ta, 0.07 * cos(0.25 * iTime));
    
    // 레이
    vec3 rd = ca * normalize(vec3(p.xy, 1.5));
    
    gl_FragColor = render(ro, rd, fragCoord - 0.5);
  }
`;

// 쉐이더 컴파일
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('쉐이더 컴파일 오류:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

// 쉐이더 프로그램 생성
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
  console.error('쉐이더 프로그램 링크 오류:', gl.getProgramInfoLog(shaderProgram));
}

// 버퍼 설정
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
  -1.0, -1.0,
   1.0, -1.0,
  -1.0,  1.0,
   1.0,  1.0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const textureCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
const textureCoordinates = [
  0.0, 0.0,
  1.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

// 위치 정보 가져오기
const programInfo = {
  program: shaderProgram,
  attribLocations: {
    vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
  },
  uniformLocations: {
    iResolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
    iTime: gl.getUniformLocation(shaderProgram, 'iTime'),
    iMouse: gl.getUniformLocation(shaderProgram, 'iMouse'),
    iChannel0: gl.getUniformLocation(shaderProgram, 'iChannel0'),
    iChannel1: gl.getUniformLocation(shaderProgram, 'iChannel1'),
  },
};

// 텍스처 생성
const noiseTexture = createNoiseTexture(256);
const noiseTexture2 = createNoiseTexture(256);

// 마우스 위치 추적
let mousePosition = [0, 0];

canvas.addEventListener('mousemove', (e) => {
  mousePosition = [e.clientX, e.clientY];
});

// 애니메이션 드로우 함수
function draw(time) {
  // 시간을 초 단위로 변환
  const timeInSeconds = time * 0.001;
  
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // 버텍스 위치 설정
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  
  // 텍스처 좌표 설정
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  
  // 프로그램 사용
  gl.useProgram(programInfo.program);
  
  // 유니폼 설정
  gl.uniform2f(programInfo.uniformLocations.iResolution, canvas.width, canvas.height);
  gl.uniform1f(programInfo.uniformLocations.iTime, timeInSeconds);
  gl.uniform2f(programInfo.uniformLocations.iMouse, mousePosition[0], canvas.height - mousePosition[1]);
  
  // 텍스처 바인딩
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
  gl.uniform1i(programInfo.uniformLocations.iChannel0, 0);
  
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, noiseTexture2);
  gl.uniform1i(programInfo.uniformLocations.iChannel1, 1);
  
  // 드로우
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  // 다음 프레임 요청
  requestAnimationFrame(draw);
}

// 애니메이션 시작
requestAnimationFrame(draw);