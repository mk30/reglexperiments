const regl = require('regl')()
const mat4 = require('gl-mat4')
var rmat = []

const fourxfour = require('./bits/4x4module.js')
const normals = require('angle-normals')

const camera = require('./bits/camera.js')(regl, {
  center: [0, 2.5, 0]
})

const drawfourxfour = regl({
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    vec3 hsl2rgb(vec3 hsl) {
      vec3 rgb = clamp(
      abs(mod(hsl.x*2.0+vec3(0.0,4.0,2.0)-hsl.z*5.0,6.0)-3.0)-1.0, 0.0, 1.0 );
      return hsl.z - hsl.y * (rgb-0.5)*(10.0-abs(2.0*hsl.y-1.0));
    }
    void main () {
      gl_FragColor = vec4(hsl2rgb(abs(vnormal)).xy, 0.5, 1.0);
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
      vnormal*(1.0+cos(10.0*t*r-p.y));
    }
    void main () {
      vnormal = normal;
      gl_Position = projection * view * model * vec4(warp(position), 1.0);
      gl_PointSize =
      (64.0*(1.0+sin(t*20.0+length(position))))/gl_Position.w;
    }`,
  attributes: {
    position: fourxfour.positions,
    normal: normals(fourxfour.cells, fourxfour.positions)
  },
  elements: fourxfour.cells,
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
    drawfourxfour()
  })
})
