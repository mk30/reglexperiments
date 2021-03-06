const regl = require('regl')()
const mat4 = require('gl-mat4')
var rmat = []

const cyl = require('./bits/implicitcyl.js')
const normals = require('angle-normals')

const camera = require('./bits/camera.js')(regl, {
  center: [0, -1, 0],
  distance: 15,
  phi: 0.4 
})
const drawBunny = regl({
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    vec3 hsl2rgb(vec3 v ) {
      vec3 rgb = clamp( abs(mod(v.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
      return v.z + v.y * (rgb-0.5)*(1.0-abs(2.0*v.z-1.0));
    }
    vec3 warpcolor (vec3 normal){
      return hsl2rgb(vec3(
        0.1+0.8*mod(normal.x*2.0+normal.y-sin(normal.z),
        0.5),
        1.0,
        0.5
      ));
    }
    void main () {
      gl_FragColor = vec4(warpcolor(abs(vnormal)), 1.0);
    }`,
  vert: `
    precision mediump float;
    uniform mat4 model, projection, view;
    attribute vec3 position, normal;
    varying vec3 vnormal;
    uniform float t;
    vec3 warp (vec3 p){
      float r = length(p.zx);
      float theta = atan(p.z, p.x);
      return vec3 (r*cos(theta), p.y, r*sin(theta)) +
      vnormal*(1.0+cos(40.0*t+p.y));
    }
    void main () {
      vnormal = normal;
      gl_Position = projection * view * model * vec4(warp(position), 1.0);
      gl_PointSize =
      (64.0*(1.0+sin(t*20.0+length(position))))/gl_Position.w;
    }`,
  attributes: {
    position: cyl.positions,
    normal: normals(cyl.cells, cyl.positions)
  },
  elements: cyl.cells,
  uniforms: {
    t: function(context, props){
         return context.tick/1000
       },
    model: function(context, props){
      var theta = context.tick/60
      return mat4.rotateY(rmat, mat4.identity(rmat), theta)
    }
  },
  primitive: "triangles"
})
regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  camera(() => {
    drawBunny()
  })
})

