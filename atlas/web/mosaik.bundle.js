(()=>{var _l=0,Za=1,Sl=2;var cs=1,bl=2,Ei=3,Bn=0,Lt=1,hn=2,un=0,Ci=1,hs=2,Ja=3,Ka=4,Al=5;var jn=100,Tl=101,wl=102,El=103,Cl=104,Rl=200,Pl=201,Il=202,Ll=203,ja=204,Qa=205,Dl=206,Nl=207,Ul=208,Fl=209,Ol=210,Bl=211,zl=212,Vl=213,Gl=214,Zs=0,Js=1,Ks=2,yi=3,js=4,Qs=5,$s=6,er=7,$a=0,kl=1,Hl=2,Qt=0,eo=1,to=2,no=3,io=4,so=5,ro=6,ao=7;var oo=300,zn=301,Qn=302,Tr=303,wr=304,us=306,tr=1e3,an=1001,nr=1002,_t=1003,Wl=1004;var ds=1005;var xt=1006,Er=1007;var Vn=1008;var Gt=1009,lo=1010,co=1011,Ri=1012,Cr=1013,$t=1014,en=1015,tn=1016,Rr=1017,Pr=1018,Pi=1020,ho=35902,uo=35899,fo=1021,po=1022,Xt=1023,on=1026,Gn=1027,mo=1028,Ir=1029,kn=1030,Lr=1031;var Dr=1033,fs=33776,ps=33777,ms=33778,gs=33779,Nr=35840,Ur=35841,Fr=35842,Or=35843,Br=36196,zr=37492,Vr=37496,Gr=37488,kr=37489,xs=37490,Hr=37491,Wr=37808,Xr=37809,qr=37810,Yr=37811,Zr=37812,Jr=37813,Kr=37814,jr=37815,Qr=37816,$r=37817,ea=37818,ta=37819,na=37820,ia=37821,sa=36492,ra=36494,aa=36495,oa=36283,la=36284,vs=36285,ca=36286;var ki=2300,ir=2301,Xs=2302,Ga=2303,ka=2400,Ha=2401,Wa=2402;var Xl=3200;var go=0,ql=1,Mn="",Bt="srgb",Hi="srgb-linear",Wi="linear",nt="srgb";var qs=7680;var Yl=519,Zl=512,Jl=513,Kl=514,ha=515,jl=516,Ql=517,ua=518,$l=519,ec=35044;var xo="300 es",jt=2e3,Xi=2001;function Qc(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function $c(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Mi(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function tc(){let i=Mi("canvas");return i.style.display="block",i}var Qo={},_i=null;function vo(...i){let e="THREE."+i.shift();_i?_i("log",e,...i):console.log(e,...i)}function nc(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Re(...i){i=nc(i);let e="THREE."+i.shift();if(_i)_i("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Ie(...i){i=nc(i);let e="THREE."+i.shift();if(_i)_i("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Jn(...i){let e=i.join(" ");e in Qo||(Qo[e]=!0,Re(...i))}function ic(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var sc={[Zs]:Js,[Ks]:$s,[js]:er,[yi]:Qs,[Js]:Zs,[$s]:Ks,[er]:js,[Qs]:yi},ln=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},At=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],$o=1234567,Vi=Math.PI/180,Si=180/Math.PI;function Ii(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(At[i&255]+At[i>>8&255]+At[i>>16&255]+At[i>>24&255]+"-"+At[e&255]+At[e>>8&255]+"-"+At[e>>16&15|64]+At[e>>24&255]+"-"+At[t&63|128]+At[t>>8&255]+"-"+At[t>>16&255]+At[t>>24&255]+At[n&255]+At[n>>8&255]+At[n>>16&255]+At[n>>24&255]).toLowerCase()}function Je(i,e,t){return Math.max(e,Math.min(t,i))}function yo(i,e){return(i%e+e)%e}function eh(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function th(i,e,t){return i!==e?(t-i)/(e-i):0}function Gi(i,e,t){return(1-t)*i+t*e}function nh(i,e,t,n){return Gi(i,e,1-Math.exp(-t*n))}function ih(i,e=1){return e-Math.abs(yo(i,e*2)-e)}function sh(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function rh(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function ah(i,e){return i+Math.floor(Math.random()*(e-i+1))}function oh(i,e){return i+Math.random()*(e-i)}function lh(i){return i*(.5-Math.random())}function ch(i){i!==void 0&&($o=i);let e=$o+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function hh(i){return i*Vi}function uh(i){return i*Si}function dh(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function fh(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function ph(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function mh(i,e,t,n,s){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),u=a((e+n)/2),f=r((e-n)/2),h=a((e-n)/2),m=r((n-e)/2),x=a((n-e)/2);switch(s){case"XYX":i.set(o*u,l*f,l*h,o*c);break;case"YZY":i.set(l*h,o*u,l*f,o*c);break;case"ZXZ":i.set(l*f,l*h,o*u,o*c);break;case"XZX":i.set(o*u,l*x,l*m,o*c);break;case"YXY":i.set(l*m,o*u,l*x,o*c);break;case"ZYZ":i.set(l*x,l*m,o*u,o*c);break;default:Re("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function xi(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Pt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Mo={DEG2RAD:Vi,RAD2DEG:Si,generateUUID:Ii,clamp:Je,euclideanModulo:yo,mapLinear:eh,inverseLerp:th,lerp:Gi,damp:nh,pingpong:ih,smoothstep:sh,smootherstep:rh,randInt:ah,randFloat:oh,randFloatSpread:lh,seededRandom:ch,degToRad:hh,radToDeg:uh,isPowerOfTwo:dh,ceilPowerOfTwo:fh,floorPowerOfTwo:ph,setQuaternionFromProperEuler:mh,normalize:Pt,denormalize:xi},Be=class i{static{i.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},cn=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],u=n[s+2],f=n[s+3],h=r[a+0],m=r[a+1],x=r[a+2],_=r[a+3];if(f!==_||l!==h||c!==m||u!==x){let g=l*h+c*m+u*x+f*_;g<0&&(h=-h,m=-m,x=-x,_=-_,g=-g);let d=1-o;if(g<.9995){let w=Math.acos(g),R=Math.sin(w);d=Math.sin(d*w)/R,o=Math.sin(o*w)/R,l=l*d+h*o,c=c*d+m*o,u=u*d+x*o,f=f*d+_*o}else{l=l*d+h*o,c=c*d+m*o,u=u*d+x*o,f=f*d+_*o;let w=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=w,c*=w,u*=w,f*=w}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],u=n[s+3],f=r[a],h=r[a+1],m=r[a+2],x=r[a+3];return e[t]=o*x+u*f+l*m-c*h,e[t+1]=l*x+u*h+c*f-o*m,e[t+2]=c*x+u*m+o*h-l*f,e[t+3]=u*x-o*f-l*h-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(s/2),f=o(r/2),h=l(n/2),m=l(s/2),x=l(r/2);switch(a){case"XYZ":this._x=h*u*f+c*m*x,this._y=c*m*f-h*u*x,this._z=c*u*x+h*m*f,this._w=c*u*f-h*m*x;break;case"YXZ":this._x=h*u*f+c*m*x,this._y=c*m*f-h*u*x,this._z=c*u*x-h*m*f,this._w=c*u*f+h*m*x;break;case"ZXY":this._x=h*u*f-c*m*x,this._y=c*m*f+h*u*x,this._z=c*u*x+h*m*f,this._w=c*u*f-h*m*x;break;case"ZYX":this._x=h*u*f-c*m*x,this._y=c*m*f+h*u*x,this._z=c*u*x-h*m*f,this._w=c*u*f+h*m*x;break;case"YZX":this._x=h*u*f+c*m*x,this._y=c*m*f+h*u*x,this._z=c*u*x-h*m*f,this._w=c*u*f-h*m*x;break;case"XZY":this._x=h*u*f-c*m*x,this._y=c*m*f-h*u*x,this._z=c*u*x+h*m*f,this._w=c*u*f+h*m*x;break;default:Re("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],u=t[6],f=t[10],h=n+o+f;if(h>0){let m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(u-l)*m,this._y=(r-c)*m,this._z=(a-s)*m}else if(n>o&&n>f){let m=2*Math.sqrt(1+n-o-f);this._w=(u-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+c)/m}else if(o>f){let m=2*Math.sqrt(1+o-n-f);this._w=(r-c)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+u)/m}else{let m=2*Math.sqrt(1+f-n-o);this._w=(a-s)/m,this._x=(r+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Je(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+a*o+s*c-r*l,this._y=s*u+a*l+r*o-n*c,this._z=r*u+a*c+n*l-s*o,this._w=a*u-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class i{static{i.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(el.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(el.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),u=2*(o*t-r*s),f=2*(r*n-a*t);return this.x=t+l*c+a*f-o*u,this.y=n+l*u+o*c-r*f,this.z=s+l*f+r*u-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return _a.copy(this).projectOnVector(e),this.sub(_a)}reflect(e){return this.sub(_a.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},_a=new G,el=new cn,De=class i{static{i.prototype.isMatrix3=!0}constructor(e,t,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let u=this.elements;return u[0]=e,u[1]=s,u[2]=o,u[3]=t,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],f=n[7],h=n[2],m=n[5],x=n[8],_=s[0],g=s[3],d=s[6],w=s[1],R=s[4],M=s[7],b=s[2],A=s[5],C=s[8];return r[0]=a*_+o*w+l*b,r[3]=a*g+o*R+l*A,r[6]=a*d+o*M+l*C,r[1]=c*_+u*w+f*b,r[4]=c*g+u*R+f*A,r[7]=c*d+u*M+f*C,r[2]=h*_+m*w+x*b,r[5]=h*g+m*R+x*A,r[8]=h*d+m*M+x*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*a*u-t*o*c-n*r*u+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],f=u*a-o*c,h=o*l-u*r,m=c*r-a*l,x=t*f+n*h+s*m;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/x;return e[0]=f*_,e[1]=(s*c-u*n)*_,e[2]=(o*n-s*a)*_,e[3]=h*_,e[4]=(u*t-s*l)*_,e[5]=(s*r-o*t)*_,e[6]=m*_,e[7]=(n*l-c*t)*_,e[8]=(a*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Jn("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Sa.makeScale(e,t)),this}rotate(e){return Jn("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Sa.makeRotation(-e)),this}translate(e,t){return Jn("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Sa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Sa=new De,tl=new De().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),nl=new De().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function gh(){let i={enabled:!0,workingColorSpace:Hi,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===nt&&(s.r=yn(s.r),s.g=yn(s.g),s.b=yn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===nt&&(s.r=vi(s.r),s.g=vi(s.g),s.b=vi(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Mn?Wi:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Jn("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Jn("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Hi]:{primaries:e,whitePoint:n,transfer:Wi,toXYZ:tl,fromXYZ:nl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Bt},outputColorSpaceConfig:{drawingBufferColorSpace:Bt}},[Bt]:{primaries:e,whitePoint:n,transfer:nt,toXYZ:tl,fromXYZ:nl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Bt}}}),i}var Ze=gh();function yn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function vi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ii,sr=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ii===void 0&&(ii=Mi("canvas")),ii.width=e.width,ii.height=e.height;let s=ii.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=ii}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Mi("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=yn(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(yn(t[n]/255)*255):t[n]=yn(t[n]);return{data:t,width:e.width,height:e.height}}else return Re("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},xh=0,bi=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:xh++}),this.uuid=Ii(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(ba(s[a].image)):r.push(ba(s[a]))}else r=ba(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function ba(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?sr.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Re("Texture: Unable to serialize Texture."),{})}var vh=0,Aa=new G,It=class i extends ln{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=an,s=an,r=xt,a=Vn,o=Xt,l=Gt,c=i.DEFAULT_ANISOTROPY,u=Mn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:vh++}),this.uuid=Ii(),this.name="",this.source=new bi(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Be(0,0),this.repeat=new Be(1,1),this.center=new Be(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new De,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Aa).x}get height(){return this.source.getSize(Aa).y}get depth(){return this.source.getSize(Aa).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Re(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Re(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==oo)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case tr:e.x=e.x-Math.floor(e.x);break;case an:e.x=e.x<0?0:1;break;case nr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case tr:e.y=e.y-Math.floor(e.y);break;case an:e.y=e.y<0?0:1;break;case nr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};It.DEFAULT_IMAGE=null;It.DEFAULT_MAPPING=oo;It.DEFAULT_ANISOTROPY=1;var ht=class i{static{i.prototype.isVector4=!0}constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],u=l[4],f=l[8],h=l[1],m=l[5],x=l[9],_=l[2],g=l[6],d=l[10];if(Math.abs(u-h)<.01&&Math.abs(f-_)<.01&&Math.abs(x-g)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+_)<.1&&Math.abs(x+g)<.1&&Math.abs(c+m+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let R=(c+1)/2,M=(m+1)/2,b=(d+1)/2,A=(u+h)/4,C=(f+_)/4,y=(x+g)/4;return R>M&&R>b?R<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(R),s=A/n,r=C/n):M>b?M<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(M),n=A/s,r=y/s):b<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),n=C/r,s=y/r),this.set(n,s,r,t),this}let w=Math.sqrt((g-x)*(g-x)+(f-_)*(f-_)+(h-u)*(h-u));return Math.abs(w)<.001&&(w=1),this.x=(g-x)/w,this.y=(f-_)/w,this.z=(h-u)/w,this.w=Math.acos((c+m+d-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Je(this.x,e.x,t.x),this.y=Je(this.y,e.y,t.y),this.z=Je(this.z,e.z,t.z),this.w=Je(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Je(this.x,e,t),this.y=Je(this.y,e,t),this.z=Je(this.z,e,t),this.w=Je(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},rr=class extends ln{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:xt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ht(0,0,e,t),this.scissorTest=!1,this.viewport=new ht(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:n.depth},r=new It(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:xt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new bi(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Dt=class extends rr{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},qi=class extends It{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=_t,this.minFilter=_t,this.wrapR=an,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ar=class extends It{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=_t,this.minFilter=_t,this.wrapR=an,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var ft=class i{static{i.prototype.isMatrix4=!0}constructor(e,t,n,s,r,a,o,l,c,u,f,h,m,x,_,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,u,f,h,m,x,_,g)}set(e,t,n,s,r,a,o,l,c,u,f,h,m,x,_,g){let d=this.elements;return d[0]=e,d[4]=t,d[8]=n,d[12]=s,d[1]=r,d[5]=a,d[9]=o,d[13]=l,d[2]=c,d[6]=u,d[10]=f,d[14]=h,d[3]=m,d[7]=x,d[11]=_,d[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/si.setFromMatrixColumn(e,0).length(),r=1/si.setFromMatrixColumn(e,1).length(),a=1/si.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),f=Math.sin(r);if(e.order==="XYZ"){let h=a*u,m=a*f,x=o*u,_=o*f;t[0]=l*u,t[4]=-l*f,t[8]=c,t[1]=m+x*c,t[5]=h-_*c,t[9]=-o*l,t[2]=_-h*c,t[6]=x+m*c,t[10]=a*l}else if(e.order==="YXZ"){let h=l*u,m=l*f,x=c*u,_=c*f;t[0]=h+_*o,t[4]=x*o-m,t[8]=a*c,t[1]=a*f,t[5]=a*u,t[9]=-o,t[2]=m*o-x,t[6]=_+h*o,t[10]=a*l}else if(e.order==="ZXY"){let h=l*u,m=l*f,x=c*u,_=c*f;t[0]=h-_*o,t[4]=-a*f,t[8]=x+m*o,t[1]=m+x*o,t[5]=a*u,t[9]=_-h*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let h=a*u,m=a*f,x=o*u,_=o*f;t[0]=l*u,t[4]=x*c-m,t[8]=h*c+_,t[1]=l*f,t[5]=_*c+h,t[9]=m*c-x,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let h=a*l,m=a*c,x=o*l,_=o*c;t[0]=l*u,t[4]=_-h*f,t[8]=x*f+m,t[1]=f,t[5]=a*u,t[9]=-o*u,t[2]=-c*u,t[6]=m*f+x,t[10]=h-_*f}else if(e.order==="XZY"){let h=a*l,m=a*c,x=o*l,_=o*c;t[0]=l*u,t[4]=-f,t[8]=c*u,t[1]=h*f+_,t[5]=a*u,t[9]=m*f-x,t[2]=x*f-m,t[6]=o*u,t[10]=_*f+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(yh,e,Mh)}lookAt(e,t,n){let s=this.elements;return Ft.subVectors(e,t),Ft.lengthSq()===0&&(Ft.z=1),Ft.normalize(),An.crossVectors(n,Ft),An.lengthSq()===0&&(Math.abs(n.z)===1?Ft.x+=1e-4:Ft.z+=1e-4,Ft.normalize(),An.crossVectors(n,Ft)),An.normalize(),As.crossVectors(Ft,An),s[0]=An.x,s[4]=As.x,s[8]=Ft.x,s[1]=An.y,s[5]=As.y,s[9]=Ft.y,s[2]=An.z,s[6]=As.z,s[10]=Ft.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],f=n[5],h=n[9],m=n[13],x=n[2],_=n[6],g=n[10],d=n[14],w=n[3],R=n[7],M=n[11],b=n[15],A=s[0],C=s[4],y=s[8],T=s[12],L=s[1],U=s[5],z=s[9],k=s[13],D=s[2],V=s[6],J=s[10],Y=s[14],ne=s[3],W=s[7],$=s[11],ee=s[15];return r[0]=a*A+o*L+l*D+c*ne,r[4]=a*C+o*U+l*V+c*W,r[8]=a*y+o*z+l*J+c*$,r[12]=a*T+o*k+l*Y+c*ee,r[1]=u*A+f*L+h*D+m*ne,r[5]=u*C+f*U+h*V+m*W,r[9]=u*y+f*z+h*J+m*$,r[13]=u*T+f*k+h*Y+m*ee,r[2]=x*A+_*L+g*D+d*ne,r[6]=x*C+_*U+g*V+d*W,r[10]=x*y+_*z+g*J+d*$,r[14]=x*T+_*k+g*Y+d*ee,r[3]=w*A+R*L+M*D+b*ne,r[7]=w*C+R*U+M*V+b*W,r[11]=w*y+R*z+M*J+b*$,r[15]=w*T+R*k+M*Y+b*ee,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],u=e[2],f=e[6],h=e[10],m=e[14],x=e[3],_=e[7],g=e[11],d=e[15],w=l*m-c*h,R=o*m-c*f,M=o*h-l*f,b=a*m-c*u,A=a*h-l*u,C=a*f-o*u;return t*(_*w-g*R+d*M)-n*(x*w-g*b+d*A)+s*(x*R-_*b+d*C)-r*(x*M-_*A+g*C)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],u=e[10];return t*(a*u-o*c)-n*(r*u-o*l)+s*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],f=e[9],h=e[10],m=e[11],x=e[12],_=e[13],g=e[14],d=e[15],w=t*o-n*a,R=t*l-s*a,M=t*c-r*a,b=n*l-s*o,A=n*c-r*o,C=s*c-r*l,y=u*_-f*x,T=u*g-h*x,L=u*d-m*x,U=f*g-h*_,z=f*d-m*_,k=h*d-m*g,D=w*k-R*z+M*U+b*L-A*T+C*y;if(D===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let V=1/D;return e[0]=(o*k-l*z+c*U)*V,e[1]=(s*z-n*k-r*U)*V,e[2]=(_*C-g*A+d*b)*V,e[3]=(h*A-f*C-m*b)*V,e[4]=(l*L-a*k-c*T)*V,e[5]=(t*k-s*L+r*T)*V,e[6]=(g*M-x*C-d*R)*V,e[7]=(u*C-h*M+m*R)*V,e[8]=(a*z-o*L+c*y)*V,e[9]=(n*L-t*z-r*y)*V,e[10]=(x*A-_*M+d*w)*V,e[11]=(f*M-u*A-m*w)*V,e[12]=(o*T-a*U-l*y)*V,e[13]=(t*U-n*T+s*y)*V,e[14]=(_*R-x*b-g*w)*V,e[15]=(u*b-f*R+h*w)*V,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,u=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+n,u*l-s*a,0,c*l-s*o,u*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,u=a+a,f=o+o,h=r*c,m=r*u,x=r*f,_=a*u,g=a*f,d=o*f,w=l*c,R=l*u,M=l*f,b=n.x,A=n.y,C=n.z;return s[0]=(1-(_+d))*b,s[1]=(m+M)*b,s[2]=(x-R)*b,s[3]=0,s[4]=(m-M)*A,s[5]=(1-(h+d))*A,s[6]=(g+w)*A,s[7]=0,s[8]=(x+R)*C,s[9]=(g-w)*C,s[10]=(1-(h+_))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=si.set(s[0],s[1],s[2]).length(),o=si.set(s[4],s[5],s[6]).length(),l=si.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Yt.copy(this);let c=1/a,u=1/o,f=1/l;return Yt.elements[0]*=c,Yt.elements[1]*=c,Yt.elements[2]*=c,Yt.elements[4]*=u,Yt.elements[5]*=u,Yt.elements[6]*=u,Yt.elements[8]*=f,Yt.elements[9]*=f,Yt.elements[10]*=f,t.setFromRotationMatrix(Yt),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,s,r,a,o=jt,l=!1){let c=this.elements,u=2*r/(t-e),f=2*r/(n-s),h=(t+e)/(t-e),m=(n+s)/(n-s),x,_;if(l)x=r/(a-r),_=a*r/(a-r);else if(o===jt)x=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===Xi)x=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=f,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=x,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=jt,l=!1){let c=this.elements,u=2/(t-e),f=2/(n-s),h=-(t+e)/(t-e),m=-(n+s)/(n-s),x,_;if(l)x=1/(a-r),_=a/(a-r);else if(o===jt)x=-2/(a-r),_=-(a+r)/(a-r);else if(o===Xi)x=-1/(a-r),_=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=f,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=x,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},si=new G,Yt=new ft,yh=new G(0,0,0),Mh=new G(1,1,1),An=new G,As=new G,Ft=new G,il=new ft,sl=new cn,Pn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],u=s[9],f=s[2],h=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(Je(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Je(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Je(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Je(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Je(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Je(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,m),this._y=0);break;default:Re("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return il.makeRotationFromQuaternion(e),this.setFromRotationMatrix(il,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return sl.setFromEuler(this),this.setFromQuaternion(sl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Pn.DEFAULT_ORDER="XYZ";var Yi=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},_h=0,rl=new G,ri=new cn,pn=new ft,Ts=new G,Fi=new G,Sh=new G,bh=new cn,al=new G(1,0,0),ol=new G(0,1,0),ll=new G(0,0,1),cl={type:"added"},Ah={type:"removed"},ai={type:"childadded",child:null},Ta={type:"childremoved",child:null},zt=class i extends ln{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:_h++}),this.uuid=Ii(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new G,t=new Pn,n=new cn,s=new G(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ft},normalMatrix:{value:new De}}),this.matrix=new ft,this.matrixWorld=new ft,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Yi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ri.setFromAxisAngle(e,t),this.quaternion.multiply(ri),this}rotateOnWorldAxis(e,t){return ri.setFromAxisAngle(e,t),this.quaternion.premultiply(ri),this}rotateX(e){return this.rotateOnAxis(al,e)}rotateY(e){return this.rotateOnAxis(ol,e)}rotateZ(e){return this.rotateOnAxis(ll,e)}translateOnAxis(e,t){return rl.copy(e).applyQuaternion(this.quaternion),this.position.add(rl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(al,e)}translateY(e){return this.translateOnAxis(ol,e)}translateZ(e){return this.translateOnAxis(ll,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(pn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ts.copy(e):Ts.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Fi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?pn.lookAt(Fi,Ts,this.up):pn.lookAt(Ts,Fi,this.up),this.quaternion.setFromRotationMatrix(pn),s&&(pn.extractRotation(s.matrixWorld),ri.setFromRotationMatrix(pn),this.quaternion.premultiply(ri.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Ie("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(cl),ai.child=e,this.dispatchEvent(ai),ai.child=null):Ie("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ah),Ta.child=e,this.dispatchEvent(Ta),Ta.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),pn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),pn.multiply(e.parent.matrixWorld)),e.applyMatrix4(pn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(cl),ai.child=e,this.dispatchEvent(ai),ai.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fi,e,Sh),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fi,bh,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let f=l[c];r(e.shapes,f)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),u=a(e.images),f=a(e.shapes),h=a(e.skeletons),m=a(e.animations),x=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),h.length>0&&(n.skeletons=h),m.length>0&&(n.animations=m),x.length>0&&(n.nodes=x)}return n.object=s,n;function a(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};zt.DEFAULT_UP=new G(0,1,0);zt.DEFAULT_MATRIX_AUTO_UPDATE=!0;zt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Zn=class extends zt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Th={type:"move"},Ai=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Zn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Zn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Zn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let _ of e.hand.values()){let g=t.getJointPose(_,n),d=this._getHandJoint(c,_);g!==null&&(d.matrix.fromArray(g.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=g.radius),d.visible=g!==null}let u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],h=u.position.distanceTo(f.position),m=.02,x=.005;c.inputState.pinching&&h>m+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=m-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Th)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Zn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},rc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Tn={h:0,s:0,l:0},ws={h:0,s:0,l:0};function wa(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var ze=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Bt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ze.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=Ze.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ze.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=Ze.workingColorSpace){if(e=yo(e,1),t=Je(t,0,1),n=Je(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=wa(a,r,e+1/3),this.g=wa(a,r,e),this.b=wa(a,r,e-1/3)}return Ze.colorSpaceToWorking(this,s),this}setStyle(e,t=Bt){function n(r){r!==void 0&&parseFloat(r)<1&&Re("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Re("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Re("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Bt){let n=rc[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Re("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=yn(e.r),this.g=yn(e.g),this.b=yn(e.b),this}copyLinearToSRGB(e){return this.r=vi(e.r),this.g=vi(e.g),this.b=vi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Bt){return Ze.workingToColorSpace(Tt.copy(this),e),Math.round(Je(Tt.r*255,0,255))*65536+Math.round(Je(Tt.g*255,0,255))*256+Math.round(Je(Tt.b*255,0,255))}getHexString(e=Bt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ze.workingColorSpace){Ze.workingToColorSpace(Tt.copy(this),t);let n=Tt.r,s=Tt.g,r=Tt.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,u=(o+a)/2;if(o===a)l=0,c=0;else{let f=a-o;switch(c=u<=.5?f/(a+o):f/(2-a-o),a){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Ze.workingColorSpace){return Ze.workingToColorSpace(Tt.copy(this),t),e.r=Tt.r,e.g=Tt.g,e.b=Tt.b,e}getStyle(e=Bt){Ze.workingToColorSpace(Tt.copy(this),e);let t=Tt.r,n=Tt.g,s=Tt.b;return e!==Bt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Tn),this.setHSL(Tn.h+e,Tn.s+t,Tn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Tn),e.getHSL(ws);let n=Gi(Tn.h,ws.h,t),s=Gi(Tn.s,ws.s,t),r=Gi(Tn.l,ws.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Tt=new ze;ze.NAMES=rc;var Zi=class extends zt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Pn,this.environmentIntensity=1,this.environmentRotation=new Pn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Zt=new G,mn=new G,Ea=new G,gn=new G,oi=new G,li=new G,hl=new G,Ca=new G,Ra=new G,Pa=new G,Ia=new ht,La=new ht,Da=new ht,Rn=class i{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Zt.subVectors(e,t),s.cross(Zt);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Zt.subVectors(s,t),mn.subVectors(n,t),Ea.subVectors(e,t);let a=Zt.dot(Zt),o=Zt.dot(mn),l=Zt.dot(Ea),c=mn.dot(mn),u=mn.dot(Ea),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;let h=1/f,m=(c*l-o*u)*h,x=(a*u-o*l)*h;return r.set(1-m-x,x,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,gn)===null?!1:gn.x>=0&&gn.y>=0&&gn.x+gn.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,gn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,gn.x),l.addScaledVector(a,gn.y),l.addScaledVector(o,gn.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return Ia.setScalar(0),La.setScalar(0),Da.setScalar(0),Ia.fromBufferAttribute(e,t),La.fromBufferAttribute(e,n),Da.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Ia,r.x),a.addScaledVector(La,r.y),a.addScaledVector(Da,r.z),a}static isFrontFacing(e,t,n,s){return Zt.subVectors(n,t),mn.subVectors(e,t),Zt.cross(mn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Zt.subVectors(this.c,this.b),mn.subVectors(this.a,this.b),Zt.cross(mn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;oi.subVectors(s,n),li.subVectors(r,n),Ca.subVectors(e,n);let l=oi.dot(Ca),c=li.dot(Ca);if(l<=0&&c<=0)return t.copy(n);Ra.subVectors(e,s);let u=oi.dot(Ra),f=li.dot(Ra);if(u>=0&&f<=u)return t.copy(s);let h=l*f-u*c;if(h<=0&&l>=0&&u<=0)return a=l/(l-u),t.copy(n).addScaledVector(oi,a);Pa.subVectors(e,r);let m=oi.dot(Pa),x=li.dot(Pa);if(x>=0&&m<=x)return t.copy(r);let _=m*c-l*x;if(_<=0&&c>=0&&x<=0)return o=c/(c-x),t.copy(n).addScaledVector(li,o);let g=u*x-m*f;if(g<=0&&f-u>=0&&m-x>=0)return hl.subVectors(r,s),o=(f-u)/(f-u+(m-x)),t.copy(s).addScaledVector(hl,o);let d=1/(g+_+h);return a=_*d,o=h*d,t.copy(n).addScaledVector(oi,a).addScaledVector(li,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},In=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Jt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Jt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Jt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Jt):Jt.fromBufferAttribute(r,a),Jt.applyMatrix4(e.matrixWorld),this.expandByPoint(Jt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Es.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Es.copy(n.boundingBox)),Es.applyMatrix4(e.matrixWorld),this.union(Es)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Jt),Jt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Oi),Cs.subVectors(this.max,Oi),ci.subVectors(e.a,Oi),hi.subVectors(e.b,Oi),ui.subVectors(e.c,Oi),wn.subVectors(hi,ci),En.subVectors(ui,hi),Wn.subVectors(ci,ui);let t=[0,-wn.z,wn.y,0,-En.z,En.y,0,-Wn.z,Wn.y,wn.z,0,-wn.x,En.z,0,-En.x,Wn.z,0,-Wn.x,-wn.y,wn.x,0,-En.y,En.x,0,-Wn.y,Wn.x,0];return!Na(t,ci,hi,ui,Cs)||(t=[1,0,0,0,1,0,0,0,1],!Na(t,ci,hi,ui,Cs))?!1:(Rs.crossVectors(wn,En),t=[Rs.x,Rs.y,Rs.z],Na(t,ci,hi,ui,Cs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Jt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Jt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(xn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),xn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),xn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),xn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),xn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),xn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),xn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),xn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(xn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},xn=[new G,new G,new G,new G,new G,new G,new G,new G],Jt=new G,Es=new In,ci=new G,hi=new G,ui=new G,wn=new G,En=new G,Wn=new G,Oi=new G,Cs=new G,Rs=new G,Xn=new G;function Na(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Xn.fromArray(i,r);let o=s.x*Math.abs(Xn.x)+s.y*Math.abs(Xn.y)+s.z*Math.abs(Xn.z),l=e.dot(Xn),c=t.dot(Xn),u=n.dot(Xn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var gt=new G,Ps=new Be,wh=0,St=class extends ln{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:wh++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=ec,this.updateRanges=[],this.gpuType=en,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ps.fromBufferAttribute(this,t),Ps.applyMatrix3(e),this.setXY(t,Ps.x,Ps.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix3(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix4(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyNormalMatrix(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.transformDirection(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=xi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Pt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=xi(t,this.array)),t}setX(e,t){return this.normalized&&(t=Pt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=xi(t,this.array)),t}setY(e,t){return this.normalized&&(t=Pt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=xi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Pt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=xi(t,this.array)),t}setW(e,t){return this.normalized&&(t=Pt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Pt(t,this.array),n=Pt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Pt(t,this.array),n=Pt(n,this.array),s=Pt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Pt(t,this.array),n=Pt(n,this.array),s=Pt(s,this.array),r=Pt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Ji=class extends St{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Ki=class extends St{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Wt=class extends St{constructor(e,t,n){super(new Float32Array(e),t,n)}},Eh=new In,Bi=new G,Ua=new G,Kn=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Eh.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Bi.subVectors(e,this.center);let t=Bi.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Bi,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ua.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Bi.copy(e.center).add(Ua)),this.expandByPoint(Bi.copy(e.center).sub(Ua))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Ch=0,Ht=new ft,Fa=new zt,di=new G,Ot=new In,zi=new In,Mt=new G,Nt=class i extends ln{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ch++}),this.uuid=Ii(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Qc(e)?Ki:Ji)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new De().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ht.makeRotationFromQuaternion(e),this.applyMatrix4(Ht),this}rotateX(e){return Ht.makeRotationX(e),this.applyMatrix4(Ht),this}rotateY(e){return Ht.makeRotationY(e),this.applyMatrix4(Ht),this}rotateZ(e){return Ht.makeRotationZ(e),this.applyMatrix4(Ht),this}translate(e,t,n){return Ht.makeTranslation(e,t,n),this.applyMatrix4(Ht),this}scale(e,t,n){return Ht.makeScale(e,t,n),this.applyMatrix4(Ht),this}lookAt(e){return Fa.lookAt(e),Fa.updateMatrix(),this.applyMatrix4(Fa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(di).negate(),this.translate(di.x,di.y,di.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Wt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Re("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new In);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ie("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];Ot.setFromBufferAttribute(r),this.morphTargetsRelative?(Mt.addVectors(this.boundingBox.min,Ot.min),this.boundingBox.expandByPoint(Mt),Mt.addVectors(this.boundingBox.max,Ot.max),this.boundingBox.expandByPoint(Mt)):(this.boundingBox.expandByPoint(Ot.min),this.boundingBox.expandByPoint(Ot.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ie('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Kn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ie("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new G,1/0);return}if(e){let n=this.boundingSphere.center;if(Ot.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];zi.setFromBufferAttribute(o),this.morphTargetsRelative?(Mt.addVectors(Ot.min,zi.min),Ot.expandByPoint(Mt),Mt.addVectors(Ot.max,zi.max),Ot.expandByPoint(Mt)):(Ot.expandByPoint(zi.min),Ot.expandByPoint(zi.max))}Ot.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Mt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Mt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Mt.fromBufferAttribute(o,c),l&&(di.fromBufferAttribute(e,c),Mt.add(di)),s=Math.max(s,n.distanceToSquared(Mt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Ie('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ie("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new St(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let y=0;y<n.count;y++)o[y]=new G,l[y]=new G;let c=new G,u=new G,f=new G,h=new Be,m=new Be,x=new Be,_=new G,g=new G;function d(y,T,L){c.fromBufferAttribute(n,y),u.fromBufferAttribute(n,T),f.fromBufferAttribute(n,L),h.fromBufferAttribute(r,y),m.fromBufferAttribute(r,T),x.fromBufferAttribute(r,L),u.sub(c),f.sub(c),m.sub(h),x.sub(h);let U=1/(m.x*x.y-x.x*m.y);isFinite(U)&&(_.copy(u).multiplyScalar(x.y).addScaledVector(f,-m.y).multiplyScalar(U),g.copy(f).multiplyScalar(m.x).addScaledVector(u,-x.x).multiplyScalar(U),o[y].add(_),o[T].add(_),o[L].add(_),l[y].add(g),l[T].add(g),l[L].add(g))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let y=0,T=w.length;y<T;++y){let L=w[y],U=L.start,z=L.count;for(let k=U,D=U+z;k<D;k+=3)d(e.getX(k+0),e.getX(k+1),e.getX(k+2))}let R=new G,M=new G,b=new G,A=new G;function C(y){b.fromBufferAttribute(s,y),A.copy(b);let T=o[y];R.copy(T),R.sub(b.multiplyScalar(b.dot(T))).normalize(),M.crossVectors(A,T);let U=M.dot(l[y])<0?-1:1;a.setXYZW(y,R.x,R.y,R.z,U)}for(let y=0,T=w.length;y<T;++y){let L=w[y],U=L.start,z=L.count;for(let k=U,D=U+z;k<D;k+=3)C(e.getX(k+0)),C(e.getX(k+1)),C(e.getX(k+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new St(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let h=0,m=n.count;h<m;h++)n.setXYZ(h,0,0,0);let s=new G,r=new G,a=new G,o=new G,l=new G,c=new G,u=new G,f=new G;if(e)for(let h=0,m=e.count;h<m;h+=3){let x=e.getX(h+0),_=e.getX(h+1),g=e.getX(h+2);s.fromBufferAttribute(t,x),r.fromBufferAttribute(t,_),a.fromBufferAttribute(t,g),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),o.fromBufferAttribute(n,x),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,g),o.add(u),l.add(u),c.add(u),n.setXYZ(x,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let h=0,m=t.count;h<m;h+=3)s.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Mt.fromBufferAttribute(e,t),Mt.normalize(),e.setXYZ(t,Mt.x,Mt.y,Mt.z)}toNonIndexed(){function e(o,l){let c=o.array,u=o.itemSize,f=o.normalized,h=new c.constructor(l.length*u),m=0,x=0;for(let _=0,g=l.length;_<g;_++){o.isInterleavedBufferAttribute?m=l[_]*o.data.stride+o.offset:m=l[_]*u;for(let d=0;d<u;d++)h[x++]=c[m++]}return new St(h,u,f)}if(this.index===null)return Re("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let u=0,f=c.length;u<f;u++){let h=c[u],m=e(h,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let f=0,h=c.length;f<h;f++){let m=c[f];u.push(m.toJSON(e.data))}u.length>0&&(s[l]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(t))}let r=e.morphAttributes;for(let c in r){let u=[],f=r[c];for(let h=0,m=f.length;h<m;h++)u.push(f[h].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,u=a.length;c<u;c++){let f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Oa=new G,Rh=new G,Ph=new De,Kt=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Oa.subVectors(n,t).cross(Rh.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(Oa),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Ph.getNormalMatrix(e),s=this.coplanarPoint(Oa).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Ih=0,Ln=class extends ln{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ih++}),this.uuid=Ii(),this.name="",this.type="Material",this.blending=Ci,this.side=Bn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ja,this.blendDst=Qa,this.blendEquation=jn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=yi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Yl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=qs,this.stencilZFail=qs,this.stencilZPass=qs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Re(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Re(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new ze().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Kt().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Be().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Be().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var vn=new G,Ba=new G,Is=new G,Ls=new G,ji=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,vn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=vn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(vn.copy(this.origin).addScaledVector(this.direction,t),vn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Ba.copy(e).add(t).multiplyScalar(.5),Is.copy(t).sub(e).normalize(),Ls.copy(this.origin).sub(Ba);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Is),o=Ls.dot(this.direction),l=-Ls.dot(Is),c=Ls.lengthSq(),u=Math.abs(1-a*a),f,h,m,x;if(u>0)if(f=a*l-o,h=a*o-l,x=r*u,f>=0)if(h>=-x)if(h<=x){let _=1/u;f*=_,h*=_,m=f*(f+a*h+2*o)+h*(a*f+h+2*l)+c}else h=r,f=Math.max(0,-(a*h+o)),m=-f*f+h*(h+2*l)+c;else h=-r,f=Math.max(0,-(a*h+o)),m=-f*f+h*(h+2*l)+c;else h<=-x?(f=Math.max(0,-(-a*r+o)),h=f>0?-r:Math.min(Math.max(-r,-l),r),m=-f*f+h*(h+2*l)+c):h<=x?(f=0,h=Math.min(Math.max(-r,-l),r),m=h*(h+2*l)+c):(f=Math.max(0,-(a*r+o)),h=f>0?r:Math.min(Math.max(-r,-l),r),m=-f*f+h*(h+2*l)+c);else h=a>0?-r:r,f=Math.max(0,-(a*h+o)),m=-f*f+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(Ba).addScaledVector(Is,h),m}intersectSphere(e,t){if(e.radius<0)return null;vn.subVectors(e.center,this.origin);let n=vn.dot(this.direction),s=vn.dot(vn)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return c>=0?(n=(e.min.x-h.x)*c,s=(e.max.x-h.x)*c):(n=(e.max.x-h.x)*c,s=(e.min.x-h.x)*c),u>=0?(r=(e.min.y-h.y)*u,a=(e.max.y-h.y)*u):(r=(e.max.y-h.y)*u,a=(e.min.y-h.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(e.min.z-h.z)*f,l=(e.max.z-h.z)*f):(o=(e.max.z-h.z)*f,l=(e.min.z-h.z)*f),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,vn)!==null}intersectTriangle(e,t,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,u=o.z,f=e.x-a.x,h=e.y-a.y,m=e.z-a.z,x=t.x-a.x,_=t.y-a.y,g=t.z-a.z,d=n.x-a.x,w=n.y-a.y,R=n.z-a.z,M=Math.abs(l),b=Math.abs(c),A=Math.abs(u),C,y,T,L,U,z,k,D,V,J,Y,ne;if(M>=b&&M>=A?(T=l,z=f,V=x,ne=d,l>=0?(C=c,y=u,L=h,U=m,k=_,D=g,J=w,Y=R):(C=u,y=c,L=m,U=h,k=g,D=_,J=R,Y=w)):b>=A?(T=c,z=h,V=_,ne=w,c>=0?(C=u,y=l,L=m,U=f,k=g,D=x,J=R,Y=d):(C=l,y=u,L=f,U=m,k=x,D=g,J=d,Y=R)):(T=u,z=m,V=g,ne=R,u>=0?(C=l,y=c,L=f,U=h,k=x,D=_,J=d,Y=w):(C=c,y=l,L=h,U=f,k=_,D=x,J=w,Y=d)),T===0)return null;let W=C/T,$=y/T,ee=1/T,Ae=L-W*z,Se=U-$*z,it=k-W*V,He=D-$*V,We=J-W*ne,q=Y-$*ne,Q=We*He-q*it,re=Ae*q-Se*We,Pe=it*Se-He*Ae;if(s){if(Q<0||re<0||Pe<0)return null}else if((Q<0||re<0||Pe<0)&&(Q>0||re>0||Pe>0))return null;let me=Q+re+Pe;if(me===0)return null;let Fe=ee*(Q*z+re*V+Pe*ne);return(me>0?Fe<0:Fe>0)?null:this.at(Fe/me,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Qi=class extends Ln{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Pn,this.combine=$a,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ul=new ft,qn=new ji,Ds=new Kn,dl=new G,Ns=new G,Us=new G,Fs=new G,za=new G,Os=new G,fl=new G,Bs=new G,Ut=class extends zt{constructor(e=new Nt,t=new Qi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Os.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=o[l],f=r[l];u!==0&&(za.fromBufferAttribute(f,e),a?Os.addScaledVector(za,u):Os.addScaledVector(za.sub(t),u))}t.add(Os)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ds.copy(n.boundingSphere),Ds.applyMatrix4(r),qn.copy(e.ray).recast(e.near),!(Ds.containsPoint(qn.origin)===!1&&(qn.intersectSphere(Ds,dl)===null||qn.origin.distanceToSquared(dl)>(e.far-e.near)**2))&&(ul.copy(r).invert(),qn.copy(e.ray).applyMatrix4(ul),!(n.boundingBox!==null&&qn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,qn)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,h=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,_=h.length;x<_;x++){let g=h[x],d=a[g.materialIndex],w=Math.max(g.start,m.start),R=Math.min(o.count,Math.min(g.start+g.count,m.start+m.count));for(let M=w,b=R;M<b;M+=3){let A=o.getX(M),C=o.getX(M+1),y=o.getX(M+2);s=zs(this,d,e,n,c,u,f,A,C,y),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let x=Math.max(0,m.start),_=Math.min(o.count,m.start+m.count);for(let g=x,d=_;g<d;g+=3){let w=o.getX(g),R=o.getX(g+1),M=o.getX(g+2);s=zs(this,a,e,n,c,u,f,w,R,M),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,_=h.length;x<_;x++){let g=h[x],d=a[g.materialIndex],w=Math.max(g.start,m.start),R=Math.min(l.count,Math.min(g.start+g.count,m.start+m.count));for(let M=w,b=R;M<b;M+=3){let A=M,C=M+1,y=M+2;s=zs(this,d,e,n,c,u,f,A,C,y),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let x=Math.max(0,m.start),_=Math.min(l.count,m.start+m.count);for(let g=x,d=_;g<d;g+=3){let w=g,R=g+1,M=g+2;s=zs(this,a,e,n,c,u,f,w,R,M),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function Lh(i,e,t,n,s,r,a,o){let l;if(e.side===Lt?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===Bn,o),l===null)return null;Bs.copy(o),Bs.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Bs);return c<t.near||c>t.far?null:{distance:c,point:Bs.clone(),object:i}}function zs(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,Ns),i.getVertexPosition(l,Us),i.getVertexPosition(c,Fs);let u=Lh(i,e,t,n,Ns,Us,Fs,fl);if(u){let f=new G;Rn.getBarycoord(fl,Ns,Us,Fs,f),s&&(u.uv=Rn.getInterpolatedAttribute(s,o,l,c,f,new Be)),r&&(u.uv1=Rn.getInterpolatedAttribute(r,o,l,c,f,new Be)),a&&(u.normal=Rn.getInterpolatedAttribute(a,o,l,c,f,new G),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new G,materialIndex:0};Rn.getNormal(Ns,Us,Fs,h.normal),u.face=h,u.barycoord=f}return u}var or=class extends It{constructor(e=null,t=1,n=1,s,r,a,o,l,c=_t,u=_t,f,h){super(null,a,o,l,c,u,s,r,f,h),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ti=class extends St{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}};var Yn=new Kn,Dh=new Be(.5,.5),Vs=new G,$i=class{constructor(e=new Kt,t=new Kt,n=new Kt,s=new Kt,r=new Kt,a=new Kt){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=jt,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],u=r[4],f=r[5],h=r[6],m=r[7],x=r[8],_=r[9],g=r[10],d=r[11],w=r[12],R=r[13],M=r[14],b=r[15];if(s[0].setComponents(c-a,m-u,d-x,b-w).normalize(),s[1].setComponents(c+a,m+u,d+x,b+w).normalize(),s[2].setComponents(c+o,m+f,d+_,b+R).normalize(),s[3].setComponents(c-o,m-f,d-_,b-R).normalize(),n)s[4].setComponents(l,h,g,M).normalize(),s[5].setComponents(c-l,m-h,d-g,b-M).normalize();else if(s[4].setComponents(c-l,m-h,d-g,b-M).normalize(),t===jt)s[5].setComponents(c+l,m+h,d+g,b+M).normalize();else if(t===Xi)s[5].setComponents(l,h,g,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Yn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Yn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Yn)}intersectsSprite(e){Yn.center.set(0,0,0);let t=Dh.distanceTo(e.center);return Yn.radius=.7071067811865476+t,Yn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Yn)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Vs.x=s.normal.x>0?e.max.x:e.min.x,Vs.y=s.normal.y>0?e.max.y:e.min.y,Vs.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Vs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var lr=class extends Ln{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ze(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},pl=new ft,Xa=new ji,Gs=new Kn,ks=new G,es=class extends zt{constructor(e=new Nt,t=new lr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Gs.copy(n.boundingSphere),Gs.applyMatrix4(s),Gs.radius+=r,e.ray.intersectsSphere(Gs)===!1)return;pl.copy(s).invert(),Xa.copy(e.ray).applyMatrix4(pl);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,f=n.attributes.position;if(c!==null){let h=Math.max(0,a.start),m=Math.min(c.count,a.start+a.count);for(let x=h,_=m;x<_;x++){let g=c.getX(x);ks.fromBufferAttribute(f,g),ml(ks,g,l,s,e,t,this)}}else{let h=Math.max(0,a.start),m=Math.min(f.count,a.start+a.count);for(let x=h,_=m;x<_;x++)ks.fromBufferAttribute(f,x),ml(ks,x,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function ml(i,e,t,n,s,r,a){let o=Xa.distanceSqToPoint(i);if(o<t){let l=new G;Xa.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var ts=class extends It{constructor(e=[],t=zn,n,s,r,a,o,l,c,u){super(e,t,n,s,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var Dn=class extends It{constructor(e,t,n=$t,s,r,a,o=_t,l=_t,c,u=on,f=1){if(u!==on&&u!==Gn)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:e,height:t,depth:f};super(h,s,r,a,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new bi(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},cr=class extends Dn{constructor(e,t=$t,n=zn,s,r,a=_t,o=_t,l,c=on){let u={width:e,height:e,depth:1},f=[u,u,u,u,u,u];super(e,e,t,n,s,r,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ns=class extends It{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Nn=class i extends Nt{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],u=[],f=[],h=0,m=0;x("z","y","x",-1,-1,n,t,e,a,r,0),x("z","y","x",1,-1,n,t,-e,a,r,1),x("x","z","y",1,1,e,n,t,s,a,2),x("x","z","y",1,-1,e,n,-t,s,a,3),x("x","y","z",1,-1,e,t,n,s,r,4),x("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Wt(c,3)),this.setAttribute("normal",new Wt(u,3)),this.setAttribute("uv",new Wt(f,2));function x(_,g,d,w,R,M,b,A,C,y,T){let L=M/C,U=b/y,z=M/2,k=b/2,D=A/2,V=C+1,J=y+1,Y=0,ne=0,W=new G;for(let $=0;$<J;$++){let ee=$*U-k;for(let Ae=0;Ae<V;Ae++){let Se=Ae*L-z;W[_]=Se*w,W[g]=ee*R,W[d]=D,c.push(W.x,W.y,W.z),W[_]=0,W[g]=0,W[d]=A>0?1:-1,u.push(W.x,W.y,W.z),f.push(Ae/C),f.push(1-$/y),Y+=1}}for(let $=0;$<y;$++)for(let ee=0;ee<C;ee++){let Ae=h+ee+V*$,Se=h+ee+V*($+1),it=h+(ee+1)+V*($+1),He=h+(ee+1)+V*$;l.push(Ae,Se,He),l.push(Se,it,He),ne+=6}o.addGroup(m,ne,T),m+=ne,h+=Y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var is=class i extends Nt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,u=l+1,f=e/o,h=t/l,m=[],x=[],_=[],g=[];for(let d=0;d<u;d++){let w=d*h-a;for(let R=0;R<c;R++){let M=R*f-r;x.push(M,-w,0),_.push(0,0,1),g.push(R/o),g.push(1-d/l)}}for(let d=0;d<l;d++)for(let w=0;w<o;w++){let R=w+c*d,M=w+c*(d+1),b=w+1+c*(d+1),A=w+1+c*d;m.push(R,M,A),m.push(M,b,A)}this.setIndex(m),this.setAttribute("position",new Wt(x,3)),this.setAttribute("normal",new Wt(_,3)),this.setAttribute("uv",new Wt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};function $n(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(gl(s))s.isRenderTargetTexture?(Re("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(gl(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Ct(i){let e={};for(let t=0;t<i.length;t++){let n=$n(i[t]);for(let s in n)e[s]=n[s]}return e}function gl(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Nh(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function _o(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ze.workingColorSpace}var ac={clone:$n,merge:Ct},Uh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Fh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Et=class extends Ln{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Uh,this.fragmentShader=Fh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=$n(e.uniforms),this.uniformsGroups=Nh(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new ze().setHex(s.value);break;case"v2":this.uniforms[n].value=new Be().fromArray(s.value);break;case"v3":this.uniforms[n].value=new G().fromArray(s.value);break;case"v4":this.uniforms[n].value=new ht().fromArray(s.value);break;case"m3":this.uniforms[n].value=new De().fromArray(s.value);break;case"m4":this.uniforms[n].value=new ft().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},hr=class extends Et{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ur=class extends Ln{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Xl,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},dr=class extends Ln{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function fi(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Va(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var Un=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},fr=class extends Un{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ka,endingEnd:ka}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Ha:r=e,o=2*t-n;break;case Wa:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ha:a=e,l=2*n-t;break;case Wa:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,u=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this._offsetPrev,f=this._offsetNext,h=this._weightPrev,m=this._weightNext,x=(n-t)/(s-t),_=x*x,g=_*x,d=-h*g+2*h*_-h*x,w=(1+h)*g+(-1.5-2*h)*_+(-.5+h)*x+1,R=(-1-m)*g+(1.5+m)*_+.5*x,M=m*g-m*_;for(let b=0;b!==o;++b)r[b]=d*a[u+b]+w*a[c+b]+R*a[l+b]+M*a[f+b];return r}},pr=class extends Un{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=(n-t)/(s-t),f=1-u;for(let h=0;h!==o;++h)r[h]=a[c+h]*f+a[l+h]*u;return r}},mr=class extends Un{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},gr=class extends Un{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this.inTangents,f=this.outTangents;if(!u||!f){let x=(n-t)/(s-t),_=1-x;for(let g=0;g!==o;++g)r[g]=a[c+g]*_+a[l+g]*x;return r}let h=o*2,m=e-1;for(let x=0;x!==o;++x){let _=a[c+x],g=a[l+x],d=m*h+x*2,w=f[d],R=f[d+1],M=e*h+x*2,b=u[M],A=u[M+1],C=Bh(n,t,w,b,s);r[x]=oc(C,_,R,A,g)}return r}};function oc(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function Oh(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function Bh(i,e,t,n,s){let r=(i-e)/(s-e);for(let a=0;a<8;a++){let o=oc(r,e,t,n,s)-i;if(Math.abs(o)<1e-10)break;let l=Oh(r,e,t,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var Vt=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=fi(t,this.TimeBufferType),this.values=fi(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:fi(e.times,Array),values:fi(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),Va(e.settings)&&(n.settings={inTangents:fi(e.settings.inTangents,Array),outTangents:fi(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new mr(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new pr(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new fr(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new gr(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case ki:t=this.InterpolantFactoryMethodDiscrete;break;case ir:t=this.InterpolantFactoryMethodLinear;break;case Xs:t=this.InterpolantFactoryMethodSmooth;break;case Ga:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Re("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ki;case this.InterpolantFactoryMethodLinear:return ir;case this.InterpolantFactoryMethodSmooth:return Xs;case this.InterpolantFactoryMethodBezier:return Ga}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;Va(this.settings)&&(xl(this.settings.inTangents,e),xl(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Ie("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Ie("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Ie("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Ie("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&$c(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Ie("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Xs,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],u=e[o+1];if(c!==u&&(o!==1||c!==e[0]))if(s)l=!0;else{let f=o*n,h=f-n,m=f+n;for(let x=0;x!==n;++x){let _=t[f+x];if(_!==t[h+x]||_!==t[m+x]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let f=o*n,h=a*n;for(let m=0;m!==n;++m)t[h+m]=t[f+m]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,Va(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function xl(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}Vt.prototype.ValueTypeName="";Vt.prototype.TimeBufferType=Float32Array;Vt.prototype.ValueBufferType=Float32Array;Vt.prototype.DefaultInterpolation=ir;var Fn=class extends Vt{constructor(e,t,n){super(e,t,n)}};Fn.prototype.ValueTypeName="bool";Fn.prototype.ValueBufferType=Array;Fn.prototype.DefaultInterpolation=ki;Fn.prototype.InterpolantFactoryMethodLinear=void 0;Fn.prototype.InterpolantFactoryMethodSmooth=void 0;var xr=class extends Vt{constructor(e,t,n,s){super(e,t,n,s)}};xr.prototype.ValueTypeName="color";var vr=class extends Vt{constructor(e,t,n,s){super(e,t,n,s)}};vr.prototype.ValueTypeName="number";var yr=class extends Un{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let u=c+o;c!==u;c+=4)cn.slerpFlat(r,0,a,c-o,a,c,l);return r}},ss=class extends Vt{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new yr(this.times,this.values,this.getValueSize(),e)}};ss.prototype.ValueTypeName="quaternion";ss.prototype.InterpolantFactoryMethodSmooth=void 0;var On=class extends Vt{constructor(e,t,n){super(e,t,n)}};On.prototype.ValueTypeName="string";On.prototype.ValueBufferType=Array;On.prototype.DefaultInterpolation=ki;On.prototype.InterpolantFactoryMethodLinear=void 0;On.prototype.InterpolantFactoryMethodSmooth=void 0;var Mr=class extends Vt{constructor(e,t,n,s){super(e,t,n,s)}};Mr.prototype.ValueTypeName="vector";var Ys={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(vl(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!vl(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function vl(i){try{let e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}var _r=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,f){return c.push(u,f),this},this.removeHandler=function(u){let f=c.indexOf(u);return f!==-1&&c.splice(f,2),this},this.getHandler=function(u){for(let f=0,h=c.length;f<h;f+=2){let m=c[f],x=c[f+1];if(m.global&&(m.lastIndex=0),m.test(u))return x}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},lc=new _r,wi=class{constructor(e){this.manager=e!==void 0?e:lc,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};wi.DEFAULT_MATERIAL_NAME="__DEFAULT";var pi=new WeakMap,Sr=class extends wi{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=Ys.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let f=pi.get(a);f===void 0&&(f=[],pi.set(a,f)),f.push({onLoad:t,onError:s})}return a}let o=Mi("img");function l(){u(),t&&t(this);let f=pi.get(this)||[];for(let h=0;h<f.length;h++){let m=f[h];m.onLoad&&m.onLoad(this)}pi.delete(this),r.manager.itemEnd(e)}function c(f){u(),s&&s(f),Ys.remove(`image:${e}`);let h=pi.get(this)||[];for(let m=0;m<h.length;m++){let x=h[m];x.onError&&x.onError(f)}pi.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function u(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Ys.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}};var rs=class extends wi{constructor(e){super(e)}load(e,t,n,s){let r=new It,a=new Sr(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}};var Hs=new G,Ws=new cn,rn=new G,as=class extends zt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ft,this.projectionMatrix=new ft,this.projectionMatrixInverse=new ft,this.coordinateSystem=jt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Hs,Ws,rn),rn.x===1&&rn.y===1&&rn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Hs,Ws,rn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Hs,Ws,rn),rn.x===1&&rn.y===1&&rn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Hs,Ws,rn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Cn=new G,yl=new Be,Ml=new Be,wt=class extends as{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Si*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Vi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Si*2*Math.atan(Math.tan(Vi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Cn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Cn.x,Cn.y).multiplyScalar(-e/Cn.z),Cn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Cn.x,Cn.y).multiplyScalar(-e/Cn.z)}getViewSize(e,t){return this.getViewBounds(e,yl,Ml),t.subVectors(Ml,yl)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Vi*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var os=class extends as{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var ls=class extends Nt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var mi=-90,gi=1,br=class extends zt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new wt(mi,gi,e,t);s.layers=this.layers,this.add(s);let r=new wt(mi,gi,e,t);r.layers=this.layers,this.add(r);let a=new wt(mi,gi,e,t);a.layers=this.layers,this.add(a);let o=new wt(mi,gi,e,t);o.layers=this.layers,this.add(o);let l=new wt(mi,gi,e,t);l.layers=this.layers,this.add(l);let c=new wt(mi,gi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===jt)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Xi)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,u]=this.children,f=e.getRenderTarget(),h=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(f,h,m),e.xr.enabled=x,n.texture.needsPMREMUpdate=!0}},Ar=class extends wt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var So="\\[\\]\\.:\\/",zh=new RegExp("["+So+"]","g"),bo="[^"+So+"]",Vh="[^"+So.replace("\\.","")+"]",Gh=/((?:WC+[\/:])*)/.source.replace("WC",bo),kh=/(WCOD+)?/.source.replace("WCOD",Vh),Hh=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",bo),Wh=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",bo),Xh=new RegExp("^"+Gh+kh+Hh+Wh+"$"),qh=["material","materials","bones","map"],qa=class{constructor(e,t,n){let s=n||ct.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},ct=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(zh,"")}static parseTrackName(e){let t=Xh.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);qh.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Re("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Ie("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Ie("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Ie("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Ie("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Ie("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Ie("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Ie("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;Ie("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Ie("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Ie("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ct.Composite=qa;ct.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ct.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ct.prototype.GetterByBindingType=[ct.prototype._getValue_direct,ct.prototype._getValue_array,ct.prototype._getValue_arrayElement,ct.prototype._getValue_toArray];ct.prototype.SetterByBindingTypeAndVersioning=[[ct.prototype._setValue_direct,ct.prototype._setValue_direct_setNeedsUpdate,ct.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_array,ct.prototype._setValue_array_setNeedsUpdate,ct.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_arrayElement,ct.prototype._setValue_arrayElement_setNeedsUpdate,ct.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_fromArray,ct.prototype._setValue_fromArray_setNeedsUpdate,ct.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ym=new Float32Array(1);var Ya=class i{static{i.prototype.isMatrix2=!0}constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};function Ao(i,e,t,n){let s=Yh(n);switch(t){case fo:return i*e;case mo:return i*e/s.components*s.byteLength;case Ir:return i*e/s.components*s.byteLength;case kn:return i*e*2/s.components*s.byteLength;case Lr:return i*e*2/s.components*s.byteLength;case po:return i*e*3/s.components*s.byteLength;case Xt:return i*e*4/s.components*s.byteLength;case Dr:return i*e*4/s.components*s.byteLength;case fs:case ps:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ms:case gs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ur:case Or:return Math.max(i,16)*Math.max(e,8)/4;case Nr:case Fr:return Math.max(i,8)*Math.max(e,8)/2;case Br:case zr:case Gr:case kr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Vr:case xs:case Hr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Wr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Xr:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case qr:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Yr:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Zr:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Jr:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Kr:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case jr:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Qr:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case $r:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case ea:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case ta:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case na:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case ia:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case sa:case ra:case aa:return Math.ceil(i/4)*Math.ceil(e/4)*16;case oa:case la:return Math.ceil(i/4)*Math.ceil(e/4)*8;case vs:case ca:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Yh(i){switch(i){case Gt:case lo:return{byteLength:1,components:1};case Ri:case co:case tn:return{byteLength:2,components:1};case Rr:case Pr:return{byteLength:2,components:4};case $t:case Cr:case en:return{byteLength:4,components:1};case ho:case uo:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Re("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function Pc(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Jh(i){let e=new WeakMap;function t(o,l){let c=o.array,u=o.usage,f=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),o.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)m=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){let u=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,u);else{f.sort((m,x)=>m.start-x.start);let h=0;for(let m=1;m<f.length;m++){let x=f[h],_=f[m];_.start<=x.start+x.count+1?x.count=Math.max(x.count,_.start+_.count-x.start):(++h,f[h]=_)}f.length=h+1;for(let m=0,x=f.length;m<x;m++){let _=f[m];i.bufferSubData(c,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Kh=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,jh=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Qh=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,$h=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,eu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,tu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,nu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,iu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,su=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,ru=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,au=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ou=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,lu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,cu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,hu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,uu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,du=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,fu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,pu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,mu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,gu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,xu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,vu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,yu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Mu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,_u=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Su=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,bu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Au=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Tu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,wu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Eu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Cu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Ru=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Pu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Iu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Lu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Du=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Nu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Uu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Fu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ou=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Bu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,zu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Vu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Gu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,ku=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Hu=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Wu=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Xu=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,qu=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Yu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Zu=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ju=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ku=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ju=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Qu=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,$u=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ed=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,td=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,nd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,id=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,sd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,rd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ad=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,od=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ld=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,cd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,hd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ud=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,dd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,fd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,pd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,md=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,gd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,xd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,vd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,yd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Md=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,_d=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Sd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,bd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ad=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Td=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,wd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ed=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Cd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Rd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Pd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Id=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Ld=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Dd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Nd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Ud=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Fd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Od=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Bd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,zd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Vd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Gd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,kd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Hd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Wd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Xd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,qd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Yd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Jd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Kd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,jd=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Qd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$d=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ef=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,tf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,sf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,rf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,af=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,of=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,lf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,hf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,uf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,df=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ff=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,pf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,gf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,vf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,yf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Mf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_f=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Sf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Af=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,wf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ef=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Cf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Rf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Pf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ge={alphahash_fragment:Kh,alphahash_pars_fragment:jh,alphamap_fragment:Qh,alphamap_pars_fragment:$h,alphatest_fragment:eu,alphatest_pars_fragment:tu,aomap_fragment:nu,aomap_pars_fragment:iu,batching_pars_vertex:su,batching_vertex:ru,begin_vertex:au,beginnormal_vertex:ou,bsdfs:lu,iridescence_fragment:cu,bumpmap_pars_fragment:hu,clipping_planes_fragment:uu,clipping_planes_pars_fragment:du,clipping_planes_pars_vertex:fu,clipping_planes_vertex:pu,color_fragment:mu,color_pars_fragment:gu,color_pars_vertex:xu,color_vertex:vu,common:yu,cube_uv_reflection_fragment:Mu,defaultnormal_vertex:_u,displacementmap_pars_vertex:Su,displacementmap_vertex:bu,emissivemap_fragment:Au,emissivemap_pars_fragment:Tu,colorspace_fragment:wu,colorspace_pars_fragment:Eu,envmap_fragment:Cu,envmap_common_pars_fragment:Ru,envmap_pars_fragment:Pu,envmap_pars_vertex:Iu,envmap_physical_pars_fragment:ku,envmap_vertex:Lu,fog_vertex:Du,fog_pars_vertex:Nu,fog_fragment:Uu,fog_pars_fragment:Fu,gradientmap_pars_fragment:Ou,lightmap_pars_fragment:Bu,lights_lambert_fragment:zu,lights_lambert_pars_fragment:Vu,lights_pars_begin:Gu,lights_toon_fragment:Hu,lights_toon_pars_fragment:Wu,lights_phong_fragment:Xu,lights_phong_pars_fragment:qu,lights_physical_fragment:Yu,lights_physical_pars_fragment:Zu,lights_fragment_begin:Ju,lights_fragment_maps:Ku,lights_fragment_end:ju,lightprobes_pars_fragment:Qu,logdepthbuf_fragment:$u,logdepthbuf_pars_fragment:ed,logdepthbuf_pars_vertex:td,logdepthbuf_vertex:nd,map_fragment:id,map_pars_fragment:sd,map_particle_fragment:rd,map_particle_pars_fragment:ad,metalnessmap_fragment:od,metalnessmap_pars_fragment:ld,morphinstance_vertex:cd,morphcolor_vertex:hd,morphnormal_vertex:ud,morphtarget_pars_vertex:dd,morphtarget_vertex:fd,normal_fragment_begin:pd,normal_fragment_maps:md,normal_pars_fragment:gd,normal_pars_vertex:xd,normal_vertex:vd,normalmap_pars_fragment:yd,clearcoat_normal_fragment_begin:Md,clearcoat_normal_fragment_maps:_d,clearcoat_pars_fragment:Sd,iridescence_pars_fragment:bd,opaque_fragment:Ad,packing:Td,premultiplied_alpha_fragment:wd,project_vertex:Ed,dithering_fragment:Cd,dithering_pars_fragment:Rd,roughnessmap_fragment:Pd,roughnessmap_pars_fragment:Id,shadowmap_pars_fragment:Ld,shadowmap_pars_vertex:Dd,shadowmap_vertex:Nd,shadowmask_pars_fragment:Ud,skinbase_vertex:Fd,skinning_pars_vertex:Od,skinning_vertex:Bd,skinnormal_vertex:zd,specularmap_fragment:Vd,specularmap_pars_fragment:Gd,tonemapping_fragment:kd,tonemapping_pars_fragment:Hd,transmission_fragment:Wd,transmission_pars_fragment:Xd,uv_pars_fragment:qd,uv_pars_vertex:Yd,uv_vertex:Zd,worldpos_vertex:Jd,background_vert:Kd,background_frag:jd,backgroundCube_vert:Qd,backgroundCube_frag:$d,cube_vert:ef,cube_frag:tf,depth_vert:nf,depth_frag:sf,distance_vert:rf,distance_frag:af,equirect_vert:of,equirect_frag:lf,linedashed_vert:cf,linedashed_frag:hf,meshbasic_vert:uf,meshbasic_frag:df,meshlambert_vert:ff,meshlambert_frag:pf,meshmatcap_vert:mf,meshmatcap_frag:gf,meshnormal_vert:xf,meshnormal_frag:vf,meshphong_vert:yf,meshphong_frag:Mf,meshphysical_vert:_f,meshphysical_frag:Sf,meshtoon_vert:bf,meshtoon_frag:Af,points_vert:Tf,points_frag:wf,shadow_vert:Ef,shadow_frag:Cf,sprite_vert:Rf,sprite_frag:Pf},de={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new De},alphaMap:{value:null},alphaMapTransform:{value:new De},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new De}},envmap:{envMap:{value:null},envMapRotation:{value:new De},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new De}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new De}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new De},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new De},normalScale:{value:new Be(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new De},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new De}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new De}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new De}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new G},probesMax:{value:new G},probesResolution:{value:new G}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new De},alphaTest:{value:0},uvTransform:{value:new De}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new Be(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new De},alphaMap:{value:null},alphaMapTransform:{value:new De},alphaTest:{value:0}}},fn={basic:{uniforms:Ct([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.fog]),vertexShader:Ge.meshbasic_vert,fragmentShader:Ge.meshbasic_frag},lambert:{uniforms:Ct([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.fog,de.lights,{emissive:{value:new ze(0)},envMapIntensity:{value:1}}]),vertexShader:Ge.meshlambert_vert,fragmentShader:Ge.meshlambert_frag},phong:{uniforms:Ct([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.fog,de.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ge.meshphong_vert,fragmentShader:Ge.meshphong_frag},standard:{uniforms:Ct([de.common,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.roughnessmap,de.metalnessmap,de.fog,de.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag},toon:{uniforms:Ct([de.common,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.gradientmap,de.fog,de.lights,{emissive:{value:new ze(0)}}]),vertexShader:Ge.meshtoon_vert,fragmentShader:Ge.meshtoon_frag},matcap:{uniforms:Ct([de.common,de.bumpmap,de.normalmap,de.displacementmap,de.fog,{matcap:{value:null}}]),vertexShader:Ge.meshmatcap_vert,fragmentShader:Ge.meshmatcap_frag},points:{uniforms:Ct([de.points,de.fog]),vertexShader:Ge.points_vert,fragmentShader:Ge.points_frag},dashed:{uniforms:Ct([de.common,de.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ge.linedashed_vert,fragmentShader:Ge.linedashed_frag},depth:{uniforms:Ct([de.common,de.displacementmap]),vertexShader:Ge.depth_vert,fragmentShader:Ge.depth_frag},normal:{uniforms:Ct([de.common,de.bumpmap,de.normalmap,de.displacementmap,{opacity:{value:1}}]),vertexShader:Ge.meshnormal_vert,fragmentShader:Ge.meshnormal_frag},sprite:{uniforms:Ct([de.sprite,de.fog]),vertexShader:Ge.sprite_vert,fragmentShader:Ge.sprite_frag},background:{uniforms:{uvTransform:{value:new De},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ge.background_vert,fragmentShader:Ge.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new De}},vertexShader:Ge.backgroundCube_vert,fragmentShader:Ge.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ge.cube_vert,fragmentShader:Ge.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ge.equirect_vert,fragmentShader:Ge.equirect_frag},distance:{uniforms:Ct([de.common,de.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ge.distance_vert,fragmentShader:Ge.distance_frag},shadow:{uniforms:Ct([de.lights,de.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:Ge.shadow_vert,fragmentShader:Ge.shadow_frag}};fn.physical={uniforms:Ct([fn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new De},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new De},clearcoatNormalScale:{value:new Be(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new De},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new De},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new De},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new De},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new De},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new De},transmissionSamplerSize:{value:new Be},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new De},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new De},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new De},anisotropyVector:{value:new Be},anisotropyMap:{value:null},anisotropyMapTransform:{value:new De}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag};var da={r:0,b:0,g:0},If=new ft,Ic=new De;Ic.set(-1,0,0,0,1,0,0,0,1);function Lf(i,e,t,n,s,r){let a=new ze(0),o=s===!0?0:1,l,c,u=null,f=0,h=null;function m(w){let R=w.isScene===!0?w.background:null;if(R&&R.isTexture){let M=w.backgroundBlurriness>0;R=e.get(R,M)}return R}function x(w){let R=!1,M=m(w);M===null?g(a,o):M&&M.isColor&&(g(M,1),R=!0);let b=i.xr.getEnvironmentBlendMode();b==="additive"?t.buffers.color.setClear(0,0,0,1,r):b==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||R)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function _(w,R){let M=m(R);M&&(M.isCubeTexture||M.mapping===us)?(c===void 0&&(c=new Ut(new Nn(1,1,1),new Et({name:"BackgroundCubeMaterial",uniforms:$n(fn.backgroundCube.uniforms),vertexShader:fn.backgroundCube.vertexShader,fragmentShader:fn.backgroundCube.fragmentShader,side:Lt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,A,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=M,c.material.uniforms.backgroundBlurriness.value=R.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(If.makeRotationFromEuler(R.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Ic),c.material.toneMapped=Ze.getTransfer(M.colorSpace)!==nt,(u!==M||f!==M.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,u=M,f=M.version,h=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null)):M&&M.isTexture&&(l===void 0&&(l=new Ut(new is(2,2),new Et({name:"BackgroundMaterial",uniforms:$n(fn.background.uniforms),vertexShader:fn.background.vertexShader,fragmentShader:fn.background.fragmentShader,side:Bn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=M,l.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,l.material.toneMapped=Ze.getTransfer(M.colorSpace)!==nt,M.matrixAutoUpdate===!0&&M.updateMatrix(),l.material.uniforms.uvTransform.value.copy(M.matrix),(u!==M||f!==M.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,u=M,f=M.version,h=i.toneMapping),l.layers.enableAll(),w.unshift(l,l.geometry,l.material,0,0,null))}function g(w,R){w.getRGB(da,_o(i)),t.buffers.color.setClear(da.r,da.g,da.b,R,r)}function d(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(w,R=1){a.set(w),o=R,g(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(w){o=w,g(a,o)},render:x,addToRenderList:_,dispose:d}}function Df(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null),r=s,a=!1;function o(U,z,k,D,V){let J=!1,Y=f(U,D,k,z);r!==Y&&(r=Y,c(r.object)),J=m(U,D,k,V),J&&x(U,D,k,V),V!==null&&e.update(V,i.ELEMENT_ARRAY_BUFFER),(J||a)&&(a=!1,M(U,z,k,D),V!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(V).buffer))}function l(){return i.createVertexArray()}function c(U){return i.bindVertexArray(U)}function u(U){return i.deleteVertexArray(U)}function f(U,z,k,D){let V=D.wireframe===!0,J=n[z.id];J===void 0&&(J={},n[z.id]=J);let Y=U.isInstancedMesh===!0?U.id:0,ne=J[Y];ne===void 0&&(ne={},J[Y]=ne);let W=ne[k.id];W===void 0&&(W={},ne[k.id]=W);let $=W[V];return $===void 0&&($=h(l()),W[V]=$),$}function h(U){let z=[],k=[],D=[];for(let V=0;V<t;V++)z[V]=0,k[V]=0,D[V]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:k,attributeDivisors:D,object:U,attributes:{},index:null}}function m(U,z,k,D){let V=r.attributes,J=z.attributes,Y=0,ne=k.getAttributes();for(let W in ne)if(ne[W].location>=0){let ee=V[W],Ae=J[W];if(Ae===void 0&&(W==="instanceMatrix"&&U.instanceMatrix&&(Ae=U.instanceMatrix),W==="instanceColor"&&U.instanceColor&&(Ae=U.instanceColor)),ee===void 0||ee.attribute!==Ae||Ae&&ee.data!==Ae.data)return!0;Y++}return r.attributesNum!==Y||r.index!==D}function x(U,z,k,D){let V={},J=z.attributes,Y=0,ne=k.getAttributes();for(let W in ne)if(ne[W].location>=0){let ee=J[W];ee===void 0&&(W==="instanceMatrix"&&U.instanceMatrix&&(ee=U.instanceMatrix),W==="instanceColor"&&U.instanceColor&&(ee=U.instanceColor));let Ae={};Ae.attribute=ee,ee&&ee.data&&(Ae.data=ee.data),V[W]=Ae,Y++}r.attributes=V,r.attributesNum=Y,r.index=D}function _(){let U=r.newAttributes;for(let z=0,k=U.length;z<k;z++)U[z]=0}function g(U){d(U,0)}function d(U,z){let k=r.newAttributes,D=r.enabledAttributes,V=r.attributeDivisors;k[U]=1,D[U]===0&&(i.enableVertexAttribArray(U),D[U]=1),V[U]!==z&&(i.vertexAttribDivisor(U,z),V[U]=z)}function w(){let U=r.newAttributes,z=r.enabledAttributes;for(let k=0,D=z.length;k<D;k++)z[k]!==U[k]&&(i.disableVertexAttribArray(k),z[k]=0)}function R(U,z,k,D,V,J,Y){Y===!0?i.vertexAttribIPointer(U,z,k,V,J):i.vertexAttribPointer(U,z,k,D,V,J)}function M(U,z,k,D){_();let V=D.attributes,J=k.getAttributes(),Y=z.defaultAttributeValues;for(let ne in J){let W=J[ne];if(W.location>=0){let $=V[ne];if($===void 0&&(ne==="instanceMatrix"&&U.instanceMatrix&&($=U.instanceMatrix),ne==="instanceColor"&&U.instanceColor&&($=U.instanceColor)),$!==void 0){let ee=$.normalized,Ae=$.itemSize,Se=e.get($);if(Se===void 0)continue;let it=Se.buffer,He=Se.type,We=Se.bytesPerElement,q=He===i.INT||He===i.UNSIGNED_INT||$.gpuType===Cr;if($.isInterleavedBufferAttribute){let Q=$.data,re=Q.stride,Pe=$.offset;if(Q.isInstancedInterleavedBuffer){for(let me=0;me<W.locationSize;me++)d(W.location+me,Q.meshPerAttribute);U.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let me=0;me<W.locationSize;me++)g(W.location+me);i.bindBuffer(i.ARRAY_BUFFER,it);for(let me=0;me<W.locationSize;me++)R(W.location+me,Ae/W.locationSize,He,ee,re*We,(Pe+Ae/W.locationSize*me)*We,q)}else{if($.isInstancedBufferAttribute){for(let Q=0;Q<W.locationSize;Q++)d(W.location+Q,$.meshPerAttribute);U.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=$.meshPerAttribute*$.count)}else for(let Q=0;Q<W.locationSize;Q++)g(W.location+Q);i.bindBuffer(i.ARRAY_BUFFER,it);for(let Q=0;Q<W.locationSize;Q++)R(W.location+Q,Ae/W.locationSize,He,ee,Ae*We,Ae/W.locationSize*Q*We,q)}}else if(Y!==void 0){let ee=Y[ne];if(ee!==void 0)switch(ee.length){case 2:i.vertexAttrib2fv(W.location,ee);break;case 3:i.vertexAttrib3fv(W.location,ee);break;case 4:i.vertexAttrib4fv(W.location,ee);break;default:i.vertexAttrib1fv(W.location,ee)}}}}w()}function b(){T();for(let U in n){let z=n[U];for(let k in z){let D=z[k];for(let V in D){let J=D[V];for(let Y in J)u(J[Y].object),delete J[Y];delete D[V]}}delete n[U]}}function A(U){if(n[U.id]===void 0)return;let z=n[U.id];for(let k in z){let D=z[k];for(let V in D){let J=D[V];for(let Y in J)u(J[Y].object),delete J[Y];delete D[V]}}delete n[U.id]}function C(U){for(let z in n){let k=n[z];for(let D in k){let V=k[D];if(V[U.id]===void 0)continue;let J=V[U.id];for(let Y in J)u(J[Y].object),delete J[Y];delete V[U.id]}}}function y(U){for(let z in n){let k=n[z],D=U.isInstancedMesh===!0?U.id:0,V=k[D];if(V!==void 0){for(let J in V){let Y=V[J];for(let ne in Y)u(Y[ne].object),delete Y[ne];delete V[J]}delete k[D],Object.keys(k).length===0&&delete n[z]}}}function T(){L(),a=!0,r!==s&&(r=s,c(r.object))}function L(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:T,resetDefaultState:L,dispose:b,releaseStatesOfGeometry:A,releaseStatesOfObject:y,releaseStatesOfProgram:C,initAttributes:_,enableAttribute:g,disableUnusedAttributes:w}}function Nf(i,e,t){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,u){u!==0&&(i.drawArraysInstanced(n,l,c,u),t.update(c,n,u))}function o(l,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,u);let h=0;for(let m=0;m<u;m++)h+=c[m];t.update(h,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Uf(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(C){return!(C!==Xt&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){let y=C===tn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==Gt&&C!==en&&!y&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(Re("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let f=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&h===!1&&Re("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),d=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),R=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:m,maxVertexTextures:x,maxTextureSize:_,maxCubemapSize:g,maxAttributes:d,maxVertexUniforms:w,maxVaryings:R,maxFragmentUniforms:M,maxSamples:b,samples:A}}function Ff(i){let e=this,t=null,n=0,s=!1,r=!1,a=new Kt,o=new De,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){let m=f.length!==0||h||n!==0||s;return s=h,n=f.length,m},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,h){t=u(f,h,0)},this.setState=function(f,h,m){let x=f.clippingPlanes,_=f.clipIntersection,g=f.clipShadows,d=i.get(f);if(!s||x===null||x.length===0||r&&!g)r?u(null):c();else{let w=r?0:n,R=w*4,M=d.clippingState||null;l.value=M,M=u(x,h,R,m);for(let b=0;b!==R;++b)M[b]=t[b];d.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=w}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(f,h,m,x){let _=f!==null?f.length:0,g=null;if(_!==0){if(g=l.value,x!==!0||g===null){let d=m+_*4,w=h.matrixWorldInverse;o.getNormalMatrix(w),(g===null||g.length<d)&&(g=new Float32Array(d));for(let R=0,M=m;R!==_;++R,M+=4)a.copy(f[R]).applyMatrix4(w,o),a.normal.toArray(g,M),g[M+3]=a.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,g}}var Di=4,Of=6,Bf=20,zf=256,ys=new os,cc=new ze,To=null,wo=0,Eo=0,Co=!1,Vf=new G,ei=new G,pa=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=Vf}=r;To=this._renderer.getRenderTarget(),wo=this._renderer.getActiveCubeFace(),Eo=this._renderer.getActiveMipmapLevel(),Co=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,s,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=dc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=uc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(To,wo,Eo),this._renderer.xr.enabled=Co,e.scissorTest=!1,Li(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===zn||e.mapping===Qn?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),To=this._renderer.getRenderTarget(),wo=this._renderer.getActiveCubeFace(),Eo=this._renderer.getActiveMipmapLevel(),Co=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:xt,minFilter:xt,generateMipmaps:!1,type:tn,format:Xt,colorSpace:Hi,depthBuffer:!1},s=hc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=hc(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Gf(r)),this._blurMaterial=Hf(r,e,t),this._ggxMaterial=kf(r,e,t)}return s}_compileMaterial(e){let t=new Ut(new Nt,e);this._renderer.compile(t,ys)}_sceneToCubeUV(e,t,n,s,r){let l=new wt(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,m=f.toneMapping;f.getClearColor(cc),f.toneMapping=Qt,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ut(new Nn,new Qi({name:"PMREM.Background",side:Lt,depthWrite:!1,depthTest:!1})));let _=this._backgroundBox,g=_.material,d=!1,w=e.background;w?w.isColor&&(g.color.copy(w),e.background=null,d=!0):(g.color.copy(cc),d=!0);for(let R=0;R<6;R++){let M=R%3;M===0?(l.up.set(0,c[R],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[R],r.y,r.z)):M===1?(l.up.set(0,0,c[R]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[R],r.z)):(l.up.set(0,c[R],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[R]));let b=this._cubeSize;Li(s,M*b,R>2?b:0,b,b),f.setRenderTarget(s),d&&f.render(_,l),f.render(e,l)}f.toneMapping=m,f.autoClear=h,e.background=w}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===zn||e.mapping===Qn;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=dc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=uc());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Li(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,ys)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),f=Math.sqrt(c*c-u*u),h=c*1.25,m=f*h,{_lodMax:x}=this,_=this._sizeLods[n],g=3*_*(n>x-Di?n-x+Di:0),d=4*(this._cubeSize-_);l.envMap.value=e.texture,l.roughness.value=m,l.mipInt.value=x-t,Li(r,g,d,3*_,2*_),s.setRenderTarget(r),s.render(o,ys),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=x-n,Li(e,g,d,3*_,2*_),s.setRenderTarget(e),s.render(o,ys)}_blur(e,t,n,s){let r=this._pingPongRenderTarget,a=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,a),this._blurPass(r,e,n,n,a)}_blurPass(e,t,n,s,r){let a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-n;let u=this._sizeLods[s],f=3*u*(s>this._lodMax-Di?s-this._lodMax+Di:0),h=4*(this._cubeSize-u);Li(t,f,h,3*u,2*u),a.setRenderTarget(t),a.render(l,ys)}};function Gf(i){let e=[],t=[],n=i,s=i-Di+1+Of;for(let r=0;r<s;r++){let a=Math.pow(2,n);e.push(a);let o=1/(a-2),l=-o,c=1+o,u=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,h=6,m=3,x=new Float32Array(m*h*f),_=new Float32Array(m*h*f);for(let d=0;d<f;d++){let w=d%3*2/3-1,R=d>2?0:-1,M=[w,R,0,w+2/3,R,0,w+2/3,R+1,0,w,R,0,w+2/3,R+1,0,w,R+1,0];x.set(M,m*h*d);for(let b=0;b<h;b++){let A=u[b*2]*2-1,C=u[b*2+1]*2-1;d===0?ei.set(1,C,A):d===1?ei.set(-A,1,-C):d===2?ei.set(-A,C,1):d===3?ei.set(-1,C,-A):d===4?ei.set(-A,-1,C):ei.set(A,C,-1),ei.toArray(_,(d*h+b)*m)}}let g=new Nt;g.setAttribute("position",new St(x,m)),g.setAttribute("outputDirection",new St(_,m)),t.push(new Ut(g,null)),n>Di&&n--}return{lodMeshes:t,sizeLods:e}}function hc(i,e,t){let n=new Dt(i,e,t);return n.texture.mapping=us,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Li(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function kf(i,e,t){return new Et({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:zf,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:xa(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function Hf(i,e,t){return new Et({name:"SphericalGaussianBlur",defines:{SAMPLES:Bf,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:xa(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function uc(){return new Et({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:xa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function dc(){return new Et({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:xa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:un,depthTest:!1,depthWrite:!1})}function xa(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var ma=class extends Dt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new ts(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Nn(5,5,5),r=new Et({name:"CubemapFromEquirect",uniforms:$n(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Lt,blending:un});r.uniforms.tEquirect.value=t;let a=new Ut(s,r),o=t.minFilter;return t.minFilter===Vn&&(t.minFilter=xt),new br(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}};function Wf(i){let e=new WeakMap,t=new WeakMap,n=null;function s(h,m=!1){return h==null?null:m?a(h):r(h)}function r(h){if(h&&h.isTexture){let m=h.mapping;if(m===Tr||m===wr)if(e.has(h)){let x=e.get(h).texture;return o(x,h.mapping)}else{let x=h.image;if(x&&x.height>0){let _=new ma(x.height);return _.fromEquirectangularTexture(i,h),e.set(h,_),h.addEventListener("dispose",c),o(_.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){let m=h.mapping,x=m===Tr||m===wr,_=m===zn||m===Qn;if(x||_){let g=t.get(h),d=g!==void 0?g.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==d)return n===null&&(n=new pa(i)),g=x?n.fromEquirectangular(h,g):n.fromCubemap(h,g),g.texture.pmremVersion=h.pmremVersion,t.set(h,g),g.texture;if(g!==void 0)return g.texture;{let w=h.image;return x&&w&&w.height>0||_&&w&&l(w)?(n===null&&(n=new pa(i)),g=x?n.fromEquirectangular(h):n.fromCubemap(h),g.texture.pmremVersion=h.pmremVersion,t.set(h,g),h.addEventListener("dispose",u),g.texture):null}}}return h}function o(h,m){return m===Tr?h.mapping=zn:m===wr&&(h.mapping=Qn),h}function l(h){let m=0,x=6;for(let _=0;_<x;_++)h[_]!==void 0&&m++;return m===x}function c(h){let m=h.target;m.removeEventListener("dispose",c);let x=e.get(m);x!==void 0&&(e.delete(m),x.dispose())}function u(h){let m=h.target;m.removeEventListener("dispose",u);let x=t.get(m);x!==void 0&&(t.delete(m),x.dispose())}function f(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function Xf(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Jn("WebGLRenderer: "+n+" extension not supported."),s}}}function qf(i,e,t,n){let s={},r=new WeakMap;function a(f){let h=f.target;h.index!==null&&e.remove(h.index);for(let x in h.attributes)e.remove(h.attributes[x]);h.removeEventListener("dispose",a),delete s[h.id];let m=r.get(h);m&&(e.remove(m),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function o(f,h){return s[h.id]===!0||(h.addEventListener("dispose",a),s[h.id]=!0,t.memory.geometries++),h}function l(f){let h=f.attributes;for(let m in h)e.update(h[m],i.ARRAY_BUFFER)}function c(f){let h=[],m=f.index,x=f.attributes.position,_=0;if(x===void 0)return;if(m!==null){let w=m.array;_=m.version;for(let R=0,M=w.length;R<M;R+=3){let b=w[R+0],A=w[R+1],C=w[R+2];h.push(b,A,A,C,C,b)}}else{let w=x.array;_=x.version;for(let R=0,M=w.length/3-1;R<M;R+=3){let b=R+0,A=R+1,C=R+2;h.push(b,A,A,C,C,b)}}let g=new(x.count>=65535?Ki:Ji)(h,1);g.version=_;let d=r.get(f);d&&e.remove(d),r.set(f,g)}function u(f){let h=r.get(f);if(h){let m=f.index;m!==null&&h.version<m.version&&c(f)}else c(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:u}}function Yf(i,e,t){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,h){i.drawElements(n,h,r,f*a),t.update(h,n,1)}function c(f,h,m){m!==0&&(i.drawElementsInstanced(n,h,r,f*a,m),t.update(h,n,m))}function u(f,h,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,r,f,0,m);let _=0;for(let g=0;g<m;g++)_+=h[g];t.update(_,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function Zf(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Ie("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Jf(i,e,t){let n=new WeakMap,s=new ht;function r(a,o,l){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0,h=n.get(o);if(h===void 0||h.count!==f){let T=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",T)};h!==void 0&&h.texture.dispose();let m=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],w=o.morphAttributes.color||[],R=0;m===!0&&(R=1),x===!0&&(R=2),_===!0&&(R=3);let M=o.attributes.position.count*R,b=1;M>e.maxTextureSize&&(b=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let A=new Float32Array(M*b*4*f),C=new qi(A,M,b,f);C.type=en,C.needsUpdate=!0;let y=R*4;for(let L=0;L<f;L++){let U=g[L],z=d[L],k=w[L],D=M*b*4*L;for(let V=0;V<U.count;V++){let J=V*y;m===!0&&(s.fromBufferAttribute(U,V),A[D+J+0]=s.x,A[D+J+1]=s.y,A[D+J+2]=s.z,A[D+J+3]=0),x===!0&&(s.fromBufferAttribute(z,V),A[D+J+4]=s.x,A[D+J+5]=s.y,A[D+J+6]=s.z,A[D+J+7]=0),_===!0&&(s.fromBufferAttribute(k,V),A[D+J+8]=s.x,A[D+J+9]=s.y,A[D+J+10]=s.z,A[D+J+11]=k.itemSize===4?s.w:1)}}h={count:f,texture:C,size:new Be(M,b)},n.set(o,h),o.addEventListener("dispose",T)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let _=0;_<c.length;_++)m+=c[_];let x=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function Kf(i,e,t,n,s){let r=new WeakMap;function a(c){let u=s.render.frame,f=c.geometry,h=e.get(c,f);if(r.get(h)!==u&&(e.update(h),r.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){let m=c.skeleton;r.get(m)!==u&&(m.update(),r.set(m,u))}return h}function o(){r=new WeakMap}function l(c){let u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}var jf={[eo]:"LINEAR_TONE_MAPPING",[to]:"REINHARD_TONE_MAPPING",[no]:"CINEON_TONE_MAPPING",[io]:"ACES_FILMIC_TONE_MAPPING",[ro]:"AGX_TONE_MAPPING",[ao]:"NEUTRAL_TONE_MAPPING",[so]:"CUSTOM_TONE_MAPPING"};function Qf(i,e,t,n,s,r){let a=new Dt(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new Nt;c.setAttribute("position",new Wt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Wt([0,2,0,0,2,0],2));let u=new hr({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new Ut(c,u),h=new os(-1,1,1,-1,0,1),m=null,x=null,_=!1,g,d=null,w=[],R=!1;this.setSize=function(M,b){a.setSize(M,b),o!==null&&o.setSize(M,b),l!==null&&l.setSize(M,b);for(let A=0;A<w.length;A++){let C=w[A];C.setSize&&C.setSize(M,b)}},this.setEffects=function(M){w=M,R=w.length>0&&w[0].isRenderPass===!0;let b=a.width,A=a.height;w.length>0&&o===null&&(o=new Dt(b,A,{type:tn,depthBuffer:!1,stencilBuffer:!1}),l=new Dt(b,A,{type:tn,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<w.length;C++){let y=w[C];y.setSize&&y.setSize(b,A)}},this.begin=function(M,b){if(_||M.toneMapping===Qt&&w.length===0)return!1;if(d=b,b!==null){let A=b.width,C=b.height;(a.width!==A||a.height!==C)&&this.setSize(A,C)}return R===!1&&M.setRenderTarget(a),g=M.toneMapping,M.toneMapping=Qt,!0},this.hasRenderPass=function(){return R},this.end=function(M,b){M.toneMapping=g,_=!0;let A=a,C=o;for(let y=0;y<w.length;y++){let T=w[y];T.enabled!==!1&&(T.render(M,C,A,b),T.needsSwap!==!1&&(A=C,C=C===o?l:o))}if(m!==M.outputColorSpace||x!==M.toneMapping){m=M.outputColorSpace,x=M.toneMapping,u.defines={},Ze.getTransfer(m)===nt&&(u.defines.SRGB_TRANSFER="");let y=jf[x];y&&(u.defines[y]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=A.texture,M.setRenderTarget(d),M.render(f,h),d=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}var Lc=new It,Io=new Dn(1,1),Dc=new qi,Nc=new ar,Uc=new ts,fc=[],pc=[],mc=new Float32Array(16),gc=new Float32Array(9),xc=new Float32Array(4);function Ui(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=fc[s];if(r===void 0&&(r=new Float32Array(s),fc[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function vt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function yt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function va(i,e){let t=pc[e];t===void 0&&(t=new Int32Array(e),pc[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function $f(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function ep(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(vt(t,e))return;i.uniform2fv(this.addr,e),yt(t,e)}}function tp(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(vt(t,e))return;i.uniform3fv(this.addr,e),yt(t,e)}}function np(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(vt(t,e))return;i.uniform4fv(this.addr,e),yt(t,e)}}function ip(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(vt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),yt(t,e)}else{if(vt(t,n))return;xc.set(n),i.uniformMatrix2fv(this.addr,!1,xc),yt(t,n)}}function sp(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(vt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),yt(t,e)}else{if(vt(t,n))return;gc.set(n),i.uniformMatrix3fv(this.addr,!1,gc),yt(t,n)}}function rp(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(vt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),yt(t,e)}else{if(vt(t,n))return;mc.set(n),i.uniformMatrix4fv(this.addr,!1,mc),yt(t,n)}}function ap(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function op(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(vt(t,e))return;i.uniform2iv(this.addr,e),yt(t,e)}}function lp(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(vt(t,e))return;i.uniform3iv(this.addr,e),yt(t,e)}}function cp(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(vt(t,e))return;i.uniform4iv(this.addr,e),yt(t,e)}}function hp(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function up(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(vt(t,e))return;i.uniform2uiv(this.addr,e),yt(t,e)}}function dp(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(vt(t,e))return;i.uniform3uiv(this.addr,e),yt(t,e)}}function fp(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(vt(t,e))return;i.uniform4uiv(this.addr,e),yt(t,e)}}function pp(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Io.compareFunction=t.isReversedDepthBuffer()?ua:ha,r=Io):r=Lc,t.setTexture2D(e||r,s)}function mp(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Nc,s)}function gp(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Uc,s)}function xp(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Dc,s)}function vp(i){switch(i){case 5126:return $f;case 35664:return ep;case 35665:return tp;case 35666:return np;case 35674:return ip;case 35675:return sp;case 35676:return rp;case 5124:case 35670:return ap;case 35667:case 35671:return op;case 35668:case 35672:return lp;case 35669:case 35673:return cp;case 5125:return hp;case 36294:return up;case 36295:return dp;case 36296:return fp;case 35678:case 36198:case 36298:case 36306:case 35682:return pp;case 35679:case 36299:case 36307:return mp;case 35680:case 36300:case 36308:case 36293:return gp;case 36289:case 36303:case 36311:case 36292:return xp}}function yp(i,e){i.uniform1fv(this.addr,e)}function Mp(i,e){let t=Ui(e,this.size,2);i.uniform2fv(this.addr,t)}function _p(i,e){let t=Ui(e,this.size,3);i.uniform3fv(this.addr,t)}function Sp(i,e){let t=Ui(e,this.size,4);i.uniform4fv(this.addr,t)}function bp(i,e){let t=Ui(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Ap(i,e){let t=Ui(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Tp(i,e){let t=Ui(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function wp(i,e){i.uniform1iv(this.addr,e)}function Ep(i,e){i.uniform2iv(this.addr,e)}function Cp(i,e){i.uniform3iv(this.addr,e)}function Rp(i,e){i.uniform4iv(this.addr,e)}function Pp(i,e){i.uniform1uiv(this.addr,e)}function Ip(i,e){i.uniform2uiv(this.addr,e)}function Lp(i,e){i.uniform3uiv(this.addr,e)}function Dp(i,e){i.uniform4uiv(this.addr,e)}function Np(i,e,t){let n=this.cache,s=e.length,r=va(t,s);vt(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=Io:a=Lc;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function Up(i,e,t){let n=this.cache,s=e.length,r=va(t,s);vt(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Nc,r[a])}function Fp(i,e,t){let n=this.cache,s=e.length,r=va(t,s);vt(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Uc,r[a])}function Op(i,e,t){let n=this.cache,s=e.length,r=va(t,s);vt(n,r)||(i.uniform1iv(this.addr,r),yt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Dc,r[a])}function Bp(i){switch(i){case 5126:return yp;case 35664:return Mp;case 35665:return _p;case 35666:return Sp;case 35674:return bp;case 35675:return Ap;case 35676:return Tp;case 5124:case 35670:return wp;case 35667:case 35671:return Ep;case 35668:case 35672:return Cp;case 35669:case 35673:return Rp;case 5125:return Pp;case 36294:return Ip;case 36295:return Lp;case 36296:return Dp;case 35678:case 36198:case 36298:case 36306:case 35682:return Np;case 35679:case 36299:case 36307:return Up;case 35680:case 36300:case 36308:case 36293:return Fp;case 36289:case 36303:case 36311:case 36292:return Op}}var Lo=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=vp(t.type)}},Do=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Bp(t.type)}},No=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Ro=/(\w+)(\])?(\[|\.)?/g;function vc(i,e){i.seq.push(e),i.map[e.id]=e}function zp(i,e,t){let n=i.name,s=n.length;for(Ro.lastIndex=0;;){let r=Ro.exec(n),a=Ro.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){vc(t,c===void 0?new Lo(o,i,e):new Do(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new No(o),vc(t,f)),t=f}}}var Ni=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);zp(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function yc(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Vp=37297,Gp=0;function kp(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var Mc=new De;function Hp(i){Ze._getMatrix(Mc,Ze.workingColorSpace,i);let e=`mat3( ${Mc.elements.map(t=>t.toFixed(4))} )`;switch(Ze.getTransfer(i)){case Wi:return[e,"LinearTransferOETF"];case nt:return[e,"sRGBTransferOETF"];default:return Re("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function _c(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+kp(i.getShaderSource(e),o)}else return r}function Wp(i,e){let t=Hp(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var Xp={[eo]:"Linear",[to]:"Reinhard",[no]:"Cineon",[io]:"ACESFilmic",[ro]:"AgX",[ao]:"Neutral",[so]:"Custom"};function qp(i,e){let t=Xp[e];return t===void 0?(Re("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var fa=new G;function Yp(){Ze.getLuminanceCoefficients(fa);let i=fa.x.toFixed(4),e=fa.y.toFixed(4),t=fa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Zp(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(_s).join(`
`)}function Jp(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Kp(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function _s(i){return i!==""}function Sc(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function bc(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var jp=/^[ \t]*#include +<([\w\d./]+)>/gm;function Uo(i){return i.replace(jp,$p)}var Qp=new Map;function $p(i,e){let t=Ge[e];if(t===void 0){let n=Qp.get(e);if(n!==void 0)t=Ge[n],Re('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Uo(t)}var em=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ac(i){return i.replace(em,tm)}function tm(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Tc(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var nm={[cs]:"SHADOWMAP_TYPE_PCF",[Ei]:"SHADOWMAP_TYPE_VSM"};function im(i){return nm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var sm={[zn]:"ENVMAP_TYPE_CUBE",[Qn]:"ENVMAP_TYPE_CUBE",[us]:"ENVMAP_TYPE_CUBE_UV"};function rm(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":sm[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var am={[Qn]:"ENVMAP_MODE_REFRACTION"};function om(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":am[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var lm={[$a]:"ENVMAP_BLENDING_MULTIPLY",[kl]:"ENVMAP_BLENDING_MIX",[Hl]:"ENVMAP_BLENDING_ADD"};function cm(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":lm[i.combine]||"ENVMAP_BLENDING_NONE"}function hm(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function um(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=im(t),c=rm(t),u=om(t),f=cm(t),h=hm(t),m=Zp(t),x=Jp(r),_=s.createProgram(),g,d,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(_s).join(`
`),g.length>0&&(g+=`
`),d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(_s).join(`
`),d.length>0&&(d+=`
`)):(g=[Tc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(_s).join(`
`),d=[Tc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Qt?"#define TONE_MAPPING":"",t.toneMapping!==Qt?Ge.tonemapping_pars_fragment:"",t.toneMapping!==Qt?qp("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ge.colorspace_pars_fragment,Wp("linearToOutputTexel",t.outputColorSpace),Yp(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(_s).join(`
`)),a=Uo(a),a=Sc(a,t),a=bc(a,t),o=Uo(o),o=Sc(o,t),o=bc(o,t),a=Ac(a),o=Ac(o),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,g=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,d=["#define varying in",t.glslVersion===xo?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===xo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let R=w+g+a,M=w+d+o,b=yc(s,s.VERTEX_SHADER,R),A=yc(s,s.FRAGMENT_SHADER,M);s.attachShader(_,b),s.attachShader(_,A),t.index0AttributeName!==void 0?s.bindAttribLocation(_,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function C(U){if(i.debug.checkShaderErrors){let z=s.getProgramInfoLog(_)||"",k=s.getShaderInfoLog(b)||"",D=s.getShaderInfoLog(A)||"",V=z.trim(),J=k.trim(),Y=D.trim(),ne=!0,W=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(ne=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,b,A);else{let $=_c(s,b,"vertex"),ee=_c(s,A,"fragment");Ie("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+V+`
`+$+`
`+ee)}else V!==""?Re("WebGLProgram: Program Info Log:",V):(J===""||Y==="")&&(W=!1);W&&(U.diagnostics={runnable:ne,programLog:V,vertexShader:{log:J,prefix:g},fragmentShader:{log:Y,prefix:d}})}s.deleteShader(b),s.deleteShader(A),y=new Ni(s,_),T=Kp(s,_)}let y;this.getUniforms=function(){return y===void 0&&C(this),y};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=s.getProgramParameter(_,Vp)),L},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Gp++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=b,this.fragmentShader=A,this}var dm=0,Fo=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Oo(e),t.set(e,n)),n}},Oo=class{constructor(e){this.id=dm++,this.code=e,this.usedTimes=0}};function fm(i){return i===kn||i===xs||i===vs}function pm(i,e,t,n,s,r){let a=new Yi,o=new Fo,l=new Set,c=[],u=new Map,f=n.logarithmicDepthBuffer,h=n.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(y){return l.add(y),y===0?"uv":`uv${y}`}function _(y,T,L,U,z,k){let D=U.fog,V=z.geometry,J=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?U.environment:null,Y=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,ne=e.get(y.envMap||J,Y),W=ne&&ne.mapping===us?ne.image.height:null,$=m[y.type];y.precision!==null&&(h=n.getMaxPrecision(y.precision),h!==y.precision&&Re("WebGLProgram.getParameters:",y.precision,"not supported, using",h,"instead."));let ee=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,Ae=ee!==void 0?ee.length:0,Se=0;V.morphAttributes.position!==void 0&&(Se=1),V.morphAttributes.normal!==void 0&&(Se=2),V.morphAttributes.color!==void 0&&(Se=3);let it,He,We,q;if($){let at=fn[$];it=at.vertexShader,He=at.fragmentShader}else{it=y.vertexShader,He=y.fragmentShader;let at=o.getVertexShaderStage(y),et=o.getFragmentShaderStage(y);o.update(y,at,et),We=at.id,q=et.id}let Q=i.getRenderTarget(),re=i.state.buffers.depth.getReversed(),Pe=z.isInstancedMesh===!0,me=z.isBatchedMesh===!0,Fe=!!y.map,dt=!!y.matcap,Ne=!!ne,Ke=!!y.aoMap,Xe=!!y.lightMap,ke=!!y.bumpMap&&y.wireframe===!1,se=!!y.normalMap,Ue=!!y.displacementMap,Le=!!y.emissiveMap,qe=!!y.metalnessMap,$e=!!y.roughnessMap,E=y.anisotropy>0,ut=y.clearcoat>0,je=y.dispersion>0,S=y.retroreflectivity>0,p=y.iridescence>0,N=y.sheen>0,B=y.transmission>0,X=E&&!!y.anisotropyMap,ie=ut&&!!y.clearcoatMap,ae=ut&&!!y.clearcoatNormalMap,Z=ut&&!!y.clearcoatRoughnessMap,j=p&&!!y.iridescenceMap,oe=p&&!!y.iridescenceThicknessMap,Te=N&&!!y.sheenColorMap,ue=N&&!!y.sheenRoughnessMap,le=!!y.specularMap,we=!!y.specularColorMap,Ce=!!y.specularIntensityMap,Oe=B&&!!y.transmissionMap,I=B&&!!y.thicknessMap,ce=!!y.gradientMap,K=!!y.alphaMap,he=y.alphaTest>0,ge=!!y.alphaHash,te=!!y.extensions,Ee=Qt;y.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Ee=i.toneMapping);let _e={shaderID:$,shaderType:y.type,shaderName:y.name,vertexShader:it,fragmentShader:He,defines:y.defines,customVertexShaderID:We,customFragmentShaderID:q,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:h,batching:me,batchingColor:me&&z._colorsTexture!==null,instancing:Pe,instancingColor:Pe&&z.instanceColor!==null,instancingMorph:Pe&&z.morphTexture!==null,outputColorSpace:Q===null?i.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Ze.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:Fe,matcap:dt,envMap:Ne,envMapMode:Ne&&ne.mapping,envMapCubeUVHeight:W,aoMap:Ke,lightMap:Xe,bumpMap:ke,normalMap:se,displacementMap:Ue,emissiveMap:Le,normalMapObjectSpace:se&&y.normalMapType===ql,normalMapTangentSpace:se&&y.normalMapType===go,packedNormalMap:se&&y.normalMapType===go&&fm(y.normalMap.format),metalnessMap:qe,roughnessMap:$e,anisotropy:E,anisotropyMap:X,clearcoat:ut,clearcoatMap:ie,clearcoatNormalMap:ae,clearcoatRoughnessMap:Z,dispersion:je,retroreflection:S,iridescence:p,iridescenceMap:j,iridescenceThicknessMap:oe,sheen:N,sheenColorMap:Te,sheenRoughnessMap:ue,specularMap:le,specularColorMap:we,specularIntensityMap:Ce,transmission:B,transmissionMap:Oe,thicknessMap:I,gradientMap:ce,opaque:y.transparent===!1&&y.blending===Ci&&y.alphaToCoverage===!1,alphaMap:K,alphaTest:he,alphaHash:ge,combine:y.combine,mapUv:Fe&&x(y.map.channel),aoMapUv:Ke&&x(y.aoMap.channel),lightMapUv:Xe&&x(y.lightMap.channel),bumpMapUv:ke&&x(y.bumpMap.channel),normalMapUv:se&&x(y.normalMap.channel),displacementMapUv:Ue&&x(y.displacementMap.channel),emissiveMapUv:Le&&x(y.emissiveMap.channel),metalnessMapUv:qe&&x(y.metalnessMap.channel),roughnessMapUv:$e&&x(y.roughnessMap.channel),anisotropyMapUv:X&&x(y.anisotropyMap.channel),clearcoatMapUv:ie&&x(y.clearcoatMap.channel),clearcoatNormalMapUv:ae&&x(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Z&&x(y.clearcoatRoughnessMap.channel),iridescenceMapUv:j&&x(y.iridescenceMap.channel),iridescenceThicknessMapUv:oe&&x(y.iridescenceThicknessMap.channel),sheenColorMapUv:Te&&x(y.sheenColorMap.channel),sheenRoughnessMapUv:ue&&x(y.sheenRoughnessMap.channel),specularMapUv:le&&x(y.specularMap.channel),specularColorMapUv:we&&x(y.specularColorMap.channel),specularIntensityMapUv:Ce&&x(y.specularIntensityMap.channel),transmissionMapUv:Oe&&x(y.transmissionMap.channel),thicknessMapUv:I&&x(y.thicknessMap.channel),alphaMapUv:K&&x(y.alphaMap.channel),vertexTangents:!!V.attributes.tangent&&(se||E),vertexNormals:!!V.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!V.attributes.uv&&(Fe||K),fog:!!D,useFog:y.fog===!0,fogExp2:!!D&&D.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||V.attributes.normal===void 0&&se===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:re,skinning:z.isSkinnedMesh===!0,hasPositionAttribute:V.attributes.position!==void 0,morphTargets:V.morphAttributes.position!==void 0,morphNormals:V.morphAttributes.normal!==void 0,morphColors:V.morphAttributes.color!==void 0,morphTargetsCount:Ae,morphTextureStride:Se,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:k.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ee,decodeVideoTexture:Fe&&y.map.isVideoTexture===!0&&Ze.getTransfer(y.map.colorSpace)===nt,decodeVideoTextureEmissive:Le&&y.emissiveMap.isVideoTexture===!0&&Ze.getTransfer(y.emissiveMap.colorSpace)===nt,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===hn,flipSided:y.side===Lt,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:te&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(te&&y.extensions.multiDraw===!0||me)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return _e.vertexUv1s=l.has(1),_e.vertexUv2s=l.has(2),_e.vertexUv3s=l.has(3),l.clear(),_e}function g(y){let T=[];if(y.shaderID?T.push(y.shaderID):(T.push(y.customVertexShaderID),T.push(y.customFragmentShaderID)),y.defines!==void 0)for(let L in y.defines)T.push(L),T.push(y.defines[L]);return y.isRawShaderMaterial===!1&&(d(T,y),w(T,y),T.push(i.outputColorSpace)),T.push(y.customProgramCacheKey),T.join()}function d(y,T){y.push(T.precision),y.push(T.outputColorSpace),y.push(T.envMapMode),y.push(T.envMapCubeUVHeight),y.push(T.mapUv),y.push(T.alphaMapUv),y.push(T.lightMapUv),y.push(T.aoMapUv),y.push(T.bumpMapUv),y.push(T.normalMapUv),y.push(T.displacementMapUv),y.push(T.emissiveMapUv),y.push(T.metalnessMapUv),y.push(T.roughnessMapUv),y.push(T.anisotropyMapUv),y.push(T.clearcoatMapUv),y.push(T.clearcoatNormalMapUv),y.push(T.clearcoatRoughnessMapUv),y.push(T.iridescenceMapUv),y.push(T.iridescenceThicknessMapUv),y.push(T.sheenColorMapUv),y.push(T.sheenRoughnessMapUv),y.push(T.specularMapUv),y.push(T.specularColorMapUv),y.push(T.specularIntensityMapUv),y.push(T.transmissionMapUv),y.push(T.thicknessMapUv),y.push(T.combine),y.push(T.fogExp2),y.push(T.sizeAttenuation),y.push(T.morphTargetsCount),y.push(T.morphAttributeCount),y.push(T.numSunLights),y.push(T.numDirLights),y.push(T.numPointLights),y.push(T.numSpotLights),y.push(T.numSpotLightMaps),y.push(T.numHemiLights),y.push(T.numRectAreaLights),y.push(T.numSunLightShadows),y.push(T.numDirLightShadows),y.push(T.numPointLightShadows),y.push(T.numSpotLightShadows),y.push(T.numSpotLightShadowsWithMaps),y.push(T.numLightProbes),y.push(T.shadowMapType),y.push(T.toneMapping),y.push(T.numClippingPlanes),y.push(T.numClipIntersection),y.push(T.depthPacking)}function w(y,T){a.disableAll(),T.instancing&&a.enable(0),T.instancingColor&&a.enable(1),T.instancingMorph&&a.enable(2),T.matcap&&a.enable(3),T.envMap&&a.enable(4),T.normalMapObjectSpace&&a.enable(5),T.normalMapTangentSpace&&a.enable(6),T.clearcoat&&a.enable(7),T.iridescence&&a.enable(8),T.alphaTest&&a.enable(9),T.vertexColors&&a.enable(10),T.vertexAlphas&&a.enable(11),T.vertexUv1s&&a.enable(12),T.vertexUv2s&&a.enable(13),T.vertexUv3s&&a.enable(14),T.vertexTangents&&a.enable(15),T.anisotropy&&a.enable(16),T.alphaHash&&a.enable(17),T.batching&&a.enable(18),T.dispersion&&a.enable(19),T.retroreflection&&a.enable(24),T.batchingColor&&a.enable(20),T.gradientMap&&a.enable(21),T.packedNormalMap&&a.enable(22),T.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reversedDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),T.numLightProbeGrids>0&&a.enable(22),T.hasPositionAttribute&&a.enable(23),y.push(a.mask)}function R(y){let T=m[y.type],L;if(T){let U=fn[T];L=ac.clone(U.uniforms)}else L=y.uniforms;return L}function M(y,T){let L=u.get(T);return L!==void 0?++L.usedTimes:(L=new um(i,T,y,s),c.push(L),u.set(T,L)),L}function b(y){if(--y.usedTimes===0){let T=c.indexOf(y);c[T]=c[c.length-1],c.pop(),u.delete(y.cacheKey),y.destroy()}}function A(y){o.remove(y)}function C(){o.dispose()}return{getParameters:_,getProgramCacheKey:g,getUniforms:R,acquireProgram:M,releaseProgram:b,releaseShaderCache:A,programs:c,dispose:C}}function mm(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function gm(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function wc(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Ec(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(h){let m=0;return h.isInstancedMesh&&(m+=2),h.isSkinnedMesh&&(m+=1),m}function o(h,m,x,_,g,d){let w=i[e];return w===void 0?(w={id:h.id,object:h,geometry:m,material:x,materialVariant:a(h),groupOrder:_,renderOrder:h.renderOrder,z:g,group:d},i[e]=w):(w.id=h.id,w.object=h,w.geometry=m,w.material=x,w.materialVariant=a(h),w.groupOrder=_,w.renderOrder=h.renderOrder,w.z=g,w.group=d),e++,w}function l(h,m,x,_,g,d,w){w.reversedDepth===!0&&(g=-g);let R=o(h,m,x,_,g,d);x.transmission>0?n.push(R):x.transparent===!0?s.push(R):t.push(R)}function c(h,m,x,_,g,d){let w=o(h,m,x,_,g,d);x.transmission>0?n.unshift(w):x.transparent===!0?s.unshift(w):t.unshift(w)}function u(h,m){t.length>1&&t.sort(h||gm),n.length>1&&n.sort(m||wc),s.length>1&&s.sort(m||wc)}function f(){for(let h=e,m=i.length;h<m;h++){let x=i[h];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:f,sort:u}}function xm(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new Ec,i.set(n,[a])):s>=r.length?(a=new Ec,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function vm(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new G,color:new ze};break;case"SpotLight":t={position:new G,direction:new G,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new G,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new G,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new G,halfWidth:new G,halfHeight:new G};break}return i[e.id]=t,t}}}function ym(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Be,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var Mm=0;function _m(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function Sm(i){let e=new vm,t=ym(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new G);let s=new G,r=new ft,a=new ft;function o(c){let u=0,f=0,h=0;for(let z=0;z<9;z++)n.probe[z].set(0,0,0);let m=0,x=0,_=0,g=0,d=0,w=0,R=0,M=0,b=0,A=0,C=0,y=0,T=0,L=0;c.sort(_m);for(let z=0,k=c.length;z<k;z++){let D=c[z],V=D.color,J=D.intensity,Y=D.distance,ne=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===kn?ne=D.shadow.map.texture:ne=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)u+=V.r*J,f+=V.g*J,h+=V.b*J;else if(D.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(D.sh.coefficients[W],J);L++}else if(D.isSunLight){let W=e.get(D);if(W.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let $=D.shadow,ee=t.get(D);ee.shadowIntensity=$.intensity,ee.shadowBias=$.bias,ee.shadowNormalBias=$.normalBias,ee.shadowRadius=$.radius,ee.shadowMapSize.copy($.mapSize).multiply($.getFrameExtents()),n.sunShadow[x]=ee,n.sunShadowMap[x]=ne;let Ae=$.getViewportCount();for(let Se=0;Se<Ae;Se++)n.sunShadowMatrix[_+Se]=$.getMatrix(Se),n.sunShadowCascade[_+Se]=$._cascadeData[Se];_+=Ae,x++}n.sun[m]=W,m++}else if(D.isDirectionalLight){let W=e.get(D);if(W.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let $=D.shadow,ee=t.get(D);ee.shadowIntensity=$.intensity,ee.shadowBias=$.bias,ee.shadowNormalBias=$.normalBias,ee.shadowRadius=$.radius,ee.shadowMapSize=$.mapSize,n.directionalShadow[g]=ee,n.directionalShadowMap[g]=ne,n.directionalShadowMatrix[g]=D.shadow.matrix,b++}n.directional[g]=W,g++}else if(D.isSpotLight){let W=e.get(D);W.position.setFromMatrixPosition(D.matrixWorld),W.color.copy(V).multiplyScalar(J),W.distance=Y,W.coneCos=Math.cos(D.angle),W.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),W.decay=D.decay,n.spot[w]=W;let $=D.shadow;if(D.map&&(n.spotLightMap[y]=D.map,y++,$.updateMatrices(D),D.castShadow&&T++),n.spotLightMatrix[w]=$.matrix,D.castShadow){let ee=t.get(D);ee.shadowIntensity=$.intensity,ee.shadowBias=$.bias,ee.shadowNormalBias=$.normalBias,ee.shadowRadius=$.radius,ee.shadowMapSize=$.mapSize,n.spotShadow[w]=ee,n.spotShadowMap[w]=ne,C++}w++}else if(D.isRectAreaLight){let W=e.get(D);W.color.copy(V).multiplyScalar(J),W.halfWidth.set(D.width*.5,0,0),W.halfHeight.set(0,D.height*.5,0),n.rectArea[R]=W,R++}else if(D.isPointLight){let W=e.get(D);if(W.color.copy(D.color).multiplyScalar(D.intensity),W.distance=D.distance,W.decay=D.decay,D.castShadow){let $=D.shadow,ee=t.get(D);ee.shadowIntensity=$.intensity,ee.shadowBias=$.bias,ee.shadowNormalBias=$.normalBias,ee.shadowRadius=$.radius,ee.shadowMapSize=$.mapSize,ee.shadowCameraNear=$.camera.near,ee.shadowCameraFar=$.camera.far,n.pointShadow[d]=ee,n.pointShadowMap[d]=ne,n.pointShadowMatrix[d]=D.shadow.matrix,A++}n.point[d]=W,d++}else if(D.isHemisphereLight){let W=e.get(D);W.skyColor.copy(D.color).multiplyScalar(J),W.groundColor.copy(D.groundColor).multiplyScalar(J),n.hemi[M]=W,M++}}R>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=de.LTC_FLOAT_1,n.rectAreaLTC2=de.LTC_FLOAT_2):(n.rectAreaLTC1=de.LTC_HALF_1,n.rectAreaLTC2=de.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=h;let U=n.hash;(U.sunLength!==m||U.directionalLength!==g||U.pointLength!==d||U.spotLength!==w||U.rectAreaLength!==R||U.hemiLength!==M||U.numSunShadows!==x||U.numDirectionalShadows!==b||U.numPointShadows!==A||U.numSpotShadows!==C||U.numSpotMaps!==y||U.numLightProbes!==L)&&(n.sun.length=m,n.directional.length=g,n.spot.length=w,n.rectArea.length=R,n.point.length=d,n.hemi.length=M,n.sunShadow.length=x,n.sunShadowMap.length=x,n.sunShadowMatrix.length=_,n.sunShadowCascade.length=_,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.directionalShadowMatrix.length=b,n.pointShadow.length=A,n.pointShadowMap.length=A,n.pointShadowMatrix.length=A,n.spotShadow.length=C,n.spotShadowMap.length=C,n.spotLightMatrix.length=C+y-T,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=L,U.sunLength=m,U.directionalLength=g,U.pointLength=d,U.spotLength=w,U.rectAreaLength=R,U.hemiLength=M,U.numSunShadows=x,U.numDirectionalShadows=b,U.numPointShadows=A,U.numSpotShadows=C,U.numSpotMaps=y,U.numLightProbes=L,n.version=Mm++)}function l(c,u){let f=0,h=0,m=0,x=0,_=0,g=0,d=u.matrixWorldInverse;for(let w=0,R=c.length;w<R;w++){let M=c[w];if(M.isSunLight){let b=n.sun[f];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(d),f++}else if(M.isDirectionalLight){let b=n.directional[h];b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(d),h++}else if(M.isSpotLight){let b=n.spot[x];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(d),b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(d),x++}else if(M.isRectAreaLight){let b=n.rectArea[_];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(d),a.identity(),r.copy(M.matrixWorld),r.premultiply(d),a.extractRotation(r),b.halfWidth.set(M.width*.5,0,0),b.halfHeight.set(0,M.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),_++}else if(M.isPointLight){let b=n.point[m];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(d),m++}else if(M.isHemisphereLight){let b=n.hemi[g];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(d),g++}}}return{setup:o,setupView:l,state:n}}function Cc(i){let e=new Sm(i),t=[],n=[],s=[];function r(h){f.camera=h,t.length=0,n.length=0,s.length=0}function a(h){t.push(h)}function o(h){n.push(h)}function l(h){s.push(h)}function c(){e.setup(t)}function u(h){e.setupView(t,h)}let f={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:c,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function bm(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Cc(i),e.set(s,[o])):r>=a.length?(o=new Cc(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var Am=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Tm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,wm=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],Em=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],Rc=new ft,Ms=new G,Po=new G;function Cm(i,e,t){let n=new $i,s=new Be,r=new Be,a=new ht,o=new ur,l=new dr,c={},u=t.maxTextureSize,f={[Bn]:Lt,[Lt]:Bn,[hn]:hn},h=new Et({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Be},radius:{value:4}},vertexShader:Am,fragmentShader:Tm}),m=h.clone();m.defines.HORIZONTAL_PASS=1;let x=new Nt;x.setAttribute("position",new St(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Ut(x,h),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=cs;let d=this.type;this.render=function(A,C,y){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||A.length===0)return;this.type===bl&&(Re("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=cs);let T=i.getRenderTarget(),L=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),z=i.state;z.setBlending(un),z.buffers.depth.getReversed()===!0?z.buffers.color.setClear(0,0,0,0):z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);let k=d!==this.type;k&&C.traverse(function(D){D.material&&(Array.isArray(D.material)?D.material.forEach(V=>V.needsUpdate=!0):D.material.needsUpdate=!0)});for(let D=0,V=A.length;D<V;D++){let J=A[D],Y=J.shadow;if(Y===void 0){Re("WebGLShadowMap:",J,"has no shadow.");continue}if(Y.autoUpdate===!1&&Y.needsUpdate===!1)continue;s.copy(Y.mapSize);let ne=Y.getFrameExtents();s.multiply(ne),r.copy(Y.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/ne.x),s.x=r.x*ne.x,Y.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/ne.y),s.y=r.y*ne.y,Y.mapSize.y=r.y));let W=i.state.buffers.depth.getReversed();if(Y.camera._reversedDepth=W,Y.map===null||k===!0){if(Y.map!==null&&(Y.map.depthTexture!==null&&(Y.map.depthTexture.dispose(),Y.map.depthTexture=null),Y.map.dispose()),this.type===Ei){if(J.isPointLight){Re("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}Y.map=new Dt(s.x,s.y,{format:kn,type:tn,minFilter:xt,magFilter:xt,generateMipmaps:!1}),Y.map.texture.name=J.name+".shadowMap",Y.map.depthTexture=new Dn(s.x,s.y,en),Y.map.depthTexture.name=J.name+".shadowMapDepth",Y.map.depthTexture.format=on,Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=_t,Y.map.depthTexture.magFilter=_t}else J.isPointLight?(Y.map=new ma(s.x),Y.map.depthTexture=new cr(s.x,$t)):(Y.map=new Dt(s.x,s.y),Y.map.depthTexture=new Dn(s.x,s.y,$t)),Y.map.depthTexture.name=J.name+".shadowMap",Y.map.depthTexture.format=on,this.type===cs?(Y.map.depthTexture.compareFunction=W?ua:ha,Y.map.depthTexture.minFilter=xt,Y.map.depthTexture.magFilter=xt):(Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=_t,Y.map.depthTexture.magFilter=_t);Y.camera.updateProjectionMatrix()}Y.map.isWebGLCubeRenderTarget!==!0&&(Y.map.width!==s.x||Y.map.height!==s.y)&&Y.map.setSize(s.x,s.y);let $=Y.map.isWebGLCubeRenderTarget?6:Y.getViewportCount();J.isPointLight!==!0&&Y.updateMatrices(J,y);for(let ee=0;ee<$;ee++){let Ae=Y.getCamera(ee);if(J.isPointLight){let Se=Y.camera,it=Y.matrix,He=J.distance||Se.far;He!==Se.far&&(Se.far=He,Se.updateProjectionMatrix()),Ms.setFromMatrixPosition(J.matrixWorld),Se.position.copy(Ms),Po.copy(Se.position),Po.add(wm[ee]),Se.up.copy(Em[ee]),Se.lookAt(Po),Se.updateMatrixWorld(),it.makeTranslation(-Ms.x,-Ms.y,-Ms.z),Rc.multiplyMatrices(Se.projectionMatrix,Se.matrixWorldInverse),Y._frustum.setFromProjectionMatrix(Rc,Se.coordinateSystem,Se.reversedDepth)}if(Y.map.isWebGLCubeRenderTarget)i.setRenderTarget(Y.map,ee),i.clear();else{ee===0&&(i.setRenderTarget(Y.map),i.clear());let Se=Y.getViewport(ee);a.set(r.x*Se.x,r.y*Se.y,r.x*Se.z,r.y*Se.w),z.viewport(a)}n=Y.getFrustum(ee),M(C,y,Ae,J,this.type)}Y.isPointLightShadow!==!0&&this.type===Ei&&w(Y,y),Y.needsUpdate=!1}d=this.type,g.needsUpdate=!1,i.setRenderTarget(T,L,U)};function w(A,C){let y=e.update(_);h.defines.VSM_SAMPLES!==A.blurSamples&&(h.defines.VSM_SAMPLES=A.blurSamples,m.defines.VSM_SAMPLES=A.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),A.mapPass===null?A.mapPass=new Dt(s.x,s.y,{format:kn,type:tn}):(A.mapPass.width!==A.map.width||A.mapPass.height!==A.map.height)&&A.mapPass.setSize(A.map.width,A.map.height),h.uniforms.shadow_pass.value=A.map.depthTexture,h.uniforms.resolution.value.set(A.map.width,A.map.height),h.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(C,null,y,h,_,null),m.uniforms.shadow_pass.value=A.mapPass.texture,m.uniforms.resolution.value.set(A.map.width,A.map.height),m.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(C,null,y,m,_,null)}function R(A,C,y,T){let L=null,U=y.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(U!==void 0)L=U;else if(L=y.isPointLight===!0?l:o,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let z=L.uuid,k=C.uuid,D=c[z];D===void 0&&(D={},c[z]=D);let V=D[k];V===void 0&&(V=L.clone(),D[k]=V,C.addEventListener("dispose",b)),L=V}if(L.visible=C.visible,L.wireframe=C.wireframe,T===Ei?L.side=C.shadowSide!==null?C.shadowSide:C.side:L.side=C.shadowSide!==null?C.shadowSide:f[C.side],L.alphaMap=C.alphaMap,L.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,L.map=C.map,L.clipShadows=C.clipShadows,L.clippingPlanes=C.clippingPlanes,L.clipIntersection=C.clipIntersection,L.displacementMap=C.displacementMap,L.displacementScale=C.displacementScale,L.displacementBias=C.displacementBias,L.wireframeLinewidth=C.wireframeLinewidth,L.linewidth=C.linewidth,y.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let z=i.properties.get(L);z.light=y}return L}function M(A,C,y,T,L){if(A.visible===!1)return;if(A.layers.test(C.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&L===Ei)&&(!A.frustumCulled||A.intersectsFrustum(n))){A.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,A.matrixWorld);let k=e.update(A),D=A.material;if(Array.isArray(D)){let V=k.groups;for(let J=0,Y=V.length;J<Y;J++){let ne=V[J],W=D[ne.materialIndex];if(W&&W.visible){let $=R(A,W,T,L);A.onBeforeShadow(i,A,C,y,k,$,ne),i.renderBufferDirect(y,null,k,$,A,ne),A.onAfterShadow(i,A,C,y,k,$,ne)}}}else if(D.visible){let V=R(A,D,T,L);A.onBeforeShadow(i,A,C,y,k,V,null),i.renderBufferDirect(y,null,k,V,A,null),A.onAfterShadow(i,A,C,y,k,V,null)}}let z=A.children;for(let k=0,D=z.length;k<D;k++)M(z[k],C,y,T,L)}function b(A){A.target.removeEventListener("dispose",b);for(let y in c){let T=c[y],L=A.target.uuid;L in T&&(T[L].dispose(),delete T[L])}}}function Rm(i,e){function t(){let I=!1,ce=new ht,K=null,he=new ht(0,0,0,0);return{setMask:function(ge){K!==ge&&!I&&(i.colorMask(ge,ge,ge,ge),K=ge)},setLocked:function(ge){I=ge},setClear:function(ge,te,Ee,_e,at){at===!0&&(ge*=_e,te*=_e,Ee*=_e),ce.set(ge,te,Ee,_e),he.equals(ce)===!1&&(i.clearColor(ge,te,Ee,_e),he.copy(ce))},reset:function(){I=!1,K=null,he.set(-1,0,0,0)}}}function n(){let I=!1,ce=!1,K=null,he=null,ge=null;return{setReversed:function(te){if(ce!==te){let Ee=e.get("EXT_clip_control");te?Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.ZERO_TO_ONE_EXT):Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.NEGATIVE_ONE_TO_ONE_EXT),ce=te;let _e=ge;ge=null,this.setClear(_e)}},getReversed:function(){return ce},setTest:function(te){te?Q(i.DEPTH_TEST):re(i.DEPTH_TEST)},setMask:function(te){K!==te&&!I&&(i.depthMask(te),K=te)},setFunc:function(te){if(ce&&(te=sc[te]),he!==te){switch(te){case Zs:i.depthFunc(i.NEVER);break;case Js:i.depthFunc(i.ALWAYS);break;case Ks:i.depthFunc(i.LESS);break;case yi:i.depthFunc(i.LEQUAL);break;case js:i.depthFunc(i.EQUAL);break;case Qs:i.depthFunc(i.GEQUAL);break;case $s:i.depthFunc(i.GREATER);break;case er:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}he=te}},setLocked:function(te){I=te},setClear:function(te){ge!==te&&(ge=te,ce&&(te=1-te),i.clearDepth(te))},reset:function(){I=!1,K=null,he=null,ge=null,ce=!1}}}function s(){let I=!1,ce=null,K=null,he=null,ge=null,te=null,Ee=null,_e=null,at=null;return{setTest:function(et){I||(et?Q(i.STENCIL_TEST):re(i.STENCIL_TEST))},setMask:function(et){ce!==et&&!I&&(i.stencilMask(et),ce=et)},setFunc:function(et,qt,nn){(K!==et||he!==qt||ge!==nn)&&(i.stencilFunc(et,qt,nn),K=et,he=qt,ge=nn)},setOp:function(et,qt,nn){(te!==et||Ee!==qt||_e!==nn)&&(i.stencilOp(et,qt,nn),te=et,Ee=qt,_e=nn)},setLocked:function(et){I=et},setClear:function(et){at!==et&&(i.clearStencil(et),at=et)},reset:function(){I=!1,ce=null,K=null,he=null,ge=null,te=null,Ee=null,_e=null,at=null}}}let r=new t,a=new n,o=new s,l=new WeakMap,c=new WeakMap,u={},f={},h={},m=new WeakMap,x=[],_=null,g=!1,d=null,w=null,R=null,M=null,b=null,A=null,C=null,y=new ze(0,0,0),T=0,L=!1,U=null,z=null,k=null,D=null,V=null,J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,ne=0,W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(ne=parseFloat(/^WebGL (\d)/.exec(W)[1]),Y=ne>=1):W.indexOf("OpenGL ES")!==-1&&(ne=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),Y=ne>=2);let $=null,ee={},Ae=i.getParameter(i.SCISSOR_BOX),Se=i.getParameter(i.VIEWPORT),it=new ht().fromArray(Ae),He=new ht().fromArray(Se);function We(I,ce,K,he){let ge=new Uint8Array(4),te=i.createTexture();i.bindTexture(I,te),i.texParameteri(I,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(I,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ee=0;Ee<K;Ee++)I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY?i.texImage3D(ce,0,i.RGBA,1,1,he,0,i.RGBA,i.UNSIGNED_BYTE,ge):i.texImage2D(ce+Ee,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ge);return te}let q={};q[i.TEXTURE_2D]=We(i.TEXTURE_2D,i.TEXTURE_2D,1),q[i.TEXTURE_CUBE_MAP]=We(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[i.TEXTURE_2D_ARRAY]=We(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),q[i.TEXTURE_3D]=We(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Q(i.DEPTH_TEST),a.setFunc(yi),ke(!1),se(Za),Q(i.CULL_FACE),Ke(un);function Q(I){u[I]!==!0&&(i.enable(I),u[I]=!0)}function re(I){u[I]!==!1&&(i.disable(I),u[I]=!1)}function Pe(I,ce){return h[I]!==ce?(i.bindFramebuffer(I,ce),h[I]=ce,I===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=ce),I===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=ce),!0):!1}function me(I,ce){let K=x,he=!1;if(I){K=m.get(ce),K===void 0&&(K=[],m.set(ce,K));let ge=I.textures;if(K.length!==ge.length||K[0]!==i.COLOR_ATTACHMENT0){for(let te=0,Ee=ge.length;te<Ee;te++)K[te]=i.COLOR_ATTACHMENT0+te;K.length=ge.length,he=!0}}else K[0]!==i.BACK&&(K[0]=i.BACK,he=!0);he&&i.drawBuffers(K)}function Fe(I){return _!==I?(i.useProgram(I),_=I,!0):!1}let dt={[jn]:i.FUNC_ADD,[Tl]:i.FUNC_SUBTRACT,[wl]:i.FUNC_REVERSE_SUBTRACT};dt[El]=i.MIN,dt[Cl]=i.MAX;let Ne={[Rl]:i.ZERO,[Pl]:i.ONE,[Il]:i.SRC_COLOR,[ja]:i.SRC_ALPHA,[Ol]:i.SRC_ALPHA_SATURATE,[Ul]:i.DST_COLOR,[Dl]:i.DST_ALPHA,[Ll]:i.ONE_MINUS_SRC_COLOR,[Qa]:i.ONE_MINUS_SRC_ALPHA,[Fl]:i.ONE_MINUS_DST_COLOR,[Nl]:i.ONE_MINUS_DST_ALPHA,[Bl]:i.CONSTANT_COLOR,[zl]:i.ONE_MINUS_CONSTANT_COLOR,[Vl]:i.CONSTANT_ALPHA,[Gl]:i.ONE_MINUS_CONSTANT_ALPHA};function Ke(I,ce,K,he,ge,te,Ee,_e,at,et){if(I===un){g===!0&&(re(i.BLEND),g=!1);return}if(g===!1&&(Q(i.BLEND),g=!0),I!==Al){if(I!==d||et!==L){if((w!==jn||b!==jn)&&(i.blendEquation(i.FUNC_ADD),w=jn,b=jn),et)switch(I){case Ci:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case hs:i.blendFunc(i.ONE,i.ONE);break;case Ja:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ka:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Ie("WebGLState: Invalid blending: ",I);break}else switch(I){case Ci:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case hs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Ja:Ie("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ka:Ie("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ie("WebGLState: Invalid blending: ",I);break}R=null,M=null,A=null,C=null,y.set(0,0,0),T=0,d=I,L=et}return}ge=ge||ce,te=te||K,Ee=Ee||he,(ce!==w||ge!==b)&&(i.blendEquationSeparate(dt[ce],dt[ge]),w=ce,b=ge),(K!==R||he!==M||te!==A||Ee!==C)&&(i.blendFuncSeparate(Ne[K],Ne[he],Ne[te],Ne[Ee]),R=K,M=he,A=te,C=Ee),(_e.equals(y)===!1||at!==T)&&(i.blendColor(_e.r,_e.g,_e.b,at),y.copy(_e),T=at),d=I,L=!1}function Xe(I,ce){I.side===hn?re(i.CULL_FACE):Q(i.CULL_FACE);let K=I.side===Lt;ce&&(K=!K),ke(K),I.blending===Ci&&I.transparent===!1?Ke(un):Ke(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),a.setFunc(I.depthFunc),a.setTest(I.depthTest),a.setMask(I.depthWrite),r.setMask(I.colorWrite);let he=I.stencilWrite;o.setTest(he),he&&(o.setMask(I.stencilWriteMask),o.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),o.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),Le(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?Q(i.SAMPLE_ALPHA_TO_COVERAGE):re(i.SAMPLE_ALPHA_TO_COVERAGE)}function ke(I){U!==I&&(I?i.frontFace(i.CW):i.frontFace(i.CCW),U=I)}function se(I){I!==_l?(Q(i.CULL_FACE),I!==z&&(I===Za?i.cullFace(i.BACK):I===Sl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):re(i.CULL_FACE),z=I}function Ue(I){I!==k&&(Y&&i.lineWidth(I),k=I)}function Le(I,ce,K){I?(Q(i.POLYGON_OFFSET_FILL),(D!==ce||V!==K)&&(D=ce,V=K,a.getReversed()&&(ce=-ce),i.polygonOffset(ce,K))):re(i.POLYGON_OFFSET_FILL)}function qe(I){I?Q(i.SCISSOR_TEST):re(i.SCISSOR_TEST)}function $e(I){I===void 0&&(I=i.TEXTURE0+J-1),$!==I&&(i.activeTexture(I),$=I)}function E(I,ce,K){K===void 0&&($===null?K=i.TEXTURE0+J-1:K=$);let he=ee[K];he===void 0&&(he={type:void 0,texture:void 0},ee[K]=he),(he.type!==I||he.texture!==ce)&&($!==K&&(i.activeTexture(K),$=K),i.bindTexture(I,ce||q[I]),he.type=I,he.texture=ce)}function ut(){let I=ee[$];I!==void 0&&I.type!==void 0&&(i.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function je(){try{i.compressedTexImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function S(){try{i.compressedTexImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function p(){try{i.texSubImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function N(){try{i.texSubImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function B(){try{i.compressedTexSubImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function X(){try{i.compressedTexSubImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function ie(){try{i.texStorage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function ae(){try{i.texStorage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function Z(){try{i.texImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function j(){try{i.texImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function oe(I){return f[I]!==void 0?f[I]:i.getParameter(I)}function Te(I,ce){f[I]!==ce&&(i.pixelStorei(I,ce),f[I]=ce)}function ue(I){it.equals(I)===!1&&(i.scissor(I.x,I.y,I.z,I.w),it.copy(I))}function le(I){He.equals(I)===!1&&(i.viewport(I.x,I.y,I.z,I.w),He.copy(I))}function we(I,ce){let K=c.get(ce);K===void 0&&(K=new WeakMap,c.set(ce,K));let he=K.get(I);he===void 0&&(he=i.getUniformBlockIndex(ce,I.name),K.set(I,he))}function Ce(I,ce){let he=c.get(ce).get(I);l.get(ce)!==he&&(i.uniformBlockBinding(ce,he,I.__bindingPointIndex),l.set(ce,he))}function Oe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},f={},$=null,ee={},h={},m=new WeakMap,x=[],_=null,g=!1,d=null,w=null,R=null,M=null,b=null,A=null,C=null,y=new ze(0,0,0),T=0,L=!1,U=null,z=null,k=null,D=null,V=null,it.set(0,0,i.canvas.width,i.canvas.height),He.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:Q,disable:re,bindFramebuffer:Pe,drawBuffers:me,useProgram:Fe,setBlending:Ke,setMaterial:Xe,setFlipSided:ke,setCullFace:se,setLineWidth:Ue,setPolygonOffset:Le,setScissorTest:qe,activeTexture:$e,bindTexture:E,unbindTexture:ut,compressedTexImage2D:je,compressedTexImage3D:S,texImage2D:Z,texImage3D:j,pixelStorei:Te,getParameter:oe,updateUBOMapping:we,uniformBlockBinding:Ce,texStorage2D:ie,texStorage3D:ae,texSubImage2D:p,texSubImage3D:N,compressedTexSubImage2D:B,compressedTexSubImage3D:X,scissor:ue,viewport:le,reset:Oe}}function Pm(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Be,u=new WeakMap,f=new Set,h,m=new WeakMap,x=!1;try{x=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(S,p){return x?new OffscreenCanvas(S,p):Mi("canvas")}function g(S,p,N){let B=1,X=je(S);if((X.width>N||X.height>N)&&(B=N/Math.max(X.width,X.height)),B<1)if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){let ie=Math.floor(B*X.width),ae=Math.floor(B*X.height);h===void 0&&(h=_(ie,ae));let Z=p?_(ie,ae):h;return Z.width=ie,Z.height=ae,Z.getContext("2d").drawImage(S,0,0,ie,ae),Re("WebGLRenderer: Texture has been resized from ("+X.width+"x"+X.height+") to ("+ie+"x"+ae+")."),Z}else return"data"in S&&Re("WebGLRenderer: Image in DataTexture is too big ("+X.width+"x"+X.height+")."),S;return S}function d(S){return S.generateMipmaps}function w(S){i.generateMipmap(S)}function R(S){return S.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?i.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(S,p,N,B,X,ie=!1){if(S!==null){if(i[S]!==void 0)return i[S];Re("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'")}let ae;B&&(ae=e.get("EXT_texture_norm16"),ae||Re("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Z=p;if(p===i.RED&&(N===i.FLOAT&&(Z=i.R32F),N===i.HALF_FLOAT&&(Z=i.R16F),N===i.UNSIGNED_BYTE&&(Z=i.R8),N===i.UNSIGNED_SHORT&&ae&&(Z=ae.R16_EXT),N===i.SHORT&&ae&&(Z=ae.R16_SNORM_EXT)),p===i.RED_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.R8UI),N===i.UNSIGNED_SHORT&&(Z=i.R16UI),N===i.UNSIGNED_INT&&(Z=i.R32UI),N===i.BYTE&&(Z=i.R8I),N===i.SHORT&&(Z=i.R16I),N===i.INT&&(Z=i.R32I)),p===i.RG&&(N===i.FLOAT&&(Z=i.RG32F),N===i.HALF_FLOAT&&(Z=i.RG16F),N===i.UNSIGNED_BYTE&&(Z=i.RG8),N===i.UNSIGNED_SHORT&&ae&&(Z=ae.RG16_EXT),N===i.SHORT&&ae&&(Z=ae.RG16_SNORM_EXT)),p===i.RG_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.RG8UI),N===i.UNSIGNED_SHORT&&(Z=i.RG16UI),N===i.UNSIGNED_INT&&(Z=i.RG32UI),N===i.BYTE&&(Z=i.RG8I),N===i.SHORT&&(Z=i.RG16I),N===i.INT&&(Z=i.RG32I)),p===i.RGB_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.RGB8UI),N===i.UNSIGNED_SHORT&&(Z=i.RGB16UI),N===i.UNSIGNED_INT&&(Z=i.RGB32UI),N===i.BYTE&&(Z=i.RGB8I),N===i.SHORT&&(Z=i.RGB16I),N===i.INT&&(Z=i.RGB32I)),p===i.RGBA_INTEGER&&(N===i.UNSIGNED_BYTE&&(Z=i.RGBA8UI),N===i.UNSIGNED_SHORT&&(Z=i.RGBA16UI),N===i.UNSIGNED_INT&&(Z=i.RGBA32UI),N===i.BYTE&&(Z=i.RGBA8I),N===i.SHORT&&(Z=i.RGBA16I),N===i.INT&&(Z=i.RGBA32I)),p===i.RGB&&(N===i.UNSIGNED_SHORT&&ae&&(Z=ae.RGB16_EXT),N===i.SHORT&&ae&&(Z=ae.RGB16_SNORM_EXT),N===i.UNSIGNED_INT_5_9_9_9_REV&&(Z=i.RGB9_E5),N===i.UNSIGNED_INT_10F_11F_11F_REV&&(Z=i.R11F_G11F_B10F)),p===i.RGBA){let j=ie?Wi:Ze.getTransfer(X);N===i.FLOAT&&(Z=i.RGBA32F),N===i.HALF_FLOAT&&(Z=i.RGBA16F),N===i.UNSIGNED_BYTE&&(Z=j===nt?i.SRGB8_ALPHA8:i.RGBA8),N===i.UNSIGNED_SHORT&&ae&&(Z=ae.RGBA16_EXT),N===i.SHORT&&ae&&(Z=ae.RGBA16_SNORM_EXT),N===i.UNSIGNED_SHORT_4_4_4_4&&(Z=i.RGBA4),N===i.UNSIGNED_SHORT_5_5_5_1&&(Z=i.RGB5_A1)}return(Z===i.R16F||Z===i.R32F||Z===i.RG16F||Z===i.RG32F||Z===i.RGBA16F||Z===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Z}function b(S,p){let N;return S?p===null||p===$t||p===Pi?N=i.DEPTH24_STENCIL8:p===en?N=i.DEPTH32F_STENCIL8:p===Ri&&(N=i.DEPTH24_STENCIL8,Re("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):p===null||p===$t||p===Pi?N=i.DEPTH_COMPONENT24:p===en?N=i.DEPTH_COMPONENT32F:p===Ri&&(N=i.DEPTH_COMPONENT16),N}function A(S,p){return d(S)===!0||S.isFramebufferTexture&&S.minFilter!==_t&&S.minFilter!==xt?Math.log2(Math.max(p.width,p.height))+1:S.mipmaps!==void 0&&S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?p.mipmaps.length:1}function C(S){let p=S.target;p.removeEventListener("dispose",C),T(p),p.isVideoTexture&&u.delete(p),p.isHTMLTexture&&f.delete(p)}function y(S){let p=S.target;p.removeEventListener("dispose",y),U(p)}function T(S){let p=n.get(S);if(p.__webglInit===void 0)return;let N=S.source,B=m.get(N);if(B){let X=B[p.__cacheKey];X.usedTimes--,X.usedTimes===0&&L(S),Object.keys(B).length===0&&m.delete(N)}n.remove(S)}function L(S){let p=n.get(S);i.deleteTexture(p.__webglTexture);let N=S.source,B=m.get(N);delete B[p.__cacheKey],a.memory.textures--}function U(S){let p=n.get(S);if(S.depthTexture&&(S.depthTexture.dispose(),n.remove(S.depthTexture)),S.isWebGLCubeRenderTarget)for(let B=0;B<6;B++){if(Array.isArray(p.__webglFramebuffer[B]))for(let X=0;X<p.__webglFramebuffer[B].length;X++)i.deleteFramebuffer(p.__webglFramebuffer[B][X]);else i.deleteFramebuffer(p.__webglFramebuffer[B]);p.__webglDepthbuffer&&i.deleteRenderbuffer(p.__webglDepthbuffer[B])}else{if(Array.isArray(p.__webglFramebuffer))for(let B=0;B<p.__webglFramebuffer.length;B++)i.deleteFramebuffer(p.__webglFramebuffer[B]);else i.deleteFramebuffer(p.__webglFramebuffer);if(p.__webglDepthbuffer&&i.deleteRenderbuffer(p.__webglDepthbuffer),p.__webglMultisampledFramebuffer&&i.deleteFramebuffer(p.__webglMultisampledFramebuffer),p.__webglColorRenderbuffer)for(let B=0;B<p.__webglColorRenderbuffer.length;B++)p.__webglColorRenderbuffer[B]&&i.deleteRenderbuffer(p.__webglColorRenderbuffer[B]);p.__webglDepthRenderbuffer&&i.deleteRenderbuffer(p.__webglDepthRenderbuffer)}let N=S.textures;for(let B=0,X=N.length;B<X;B++){let ie=n.get(N[B]);ie.__webglTexture&&(i.deleteTexture(ie.__webglTexture),a.memory.textures--),n.remove(N[B])}n.remove(S)}let z=0;function k(){z=0}function D(){return z}function V(S){z=S}function J(){let S=z;return S>=s.maxTextures&&Re("WebGLTextures: Trying to use "+(S+1)+" texture units while this GPU supports only "+s.maxTextures),z+=1,S}function Y(S){let p=[];return p.push(S.wrapS),p.push(S.wrapT),p.push(S.wrapR||0),p.push(S.magFilter),p.push(S.minFilter),p.push(S.anisotropy),p.push(S.internalFormat),p.push(S.format),p.push(S.type),p.push(S.generateMipmaps),p.push(S.premultiplyAlpha),p.push(S.flipY),p.push(S.unpackAlignment),p.push(S.colorSpace),p.join()}function ne(S,p){let N=n.get(S);if(S.isVideoTexture&&E(S),S.isRenderTargetTexture===!1&&S.isExternalTexture!==!0&&S.version>0&&N.__version!==S.version){let B=S.image;if(B===null)Re("WebGLRenderer: Texture marked for update but no image data found.");else if(B.complete===!1)Re("WebGLRenderer: Texture marked for update but image is incomplete");else{re(N,S,p);return}}else S.isExternalTexture&&(N.__webglTexture=S.sourceTexture?S.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,N.__webglTexture,i.TEXTURE0+p)}function W(S,p){let N=n.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&N.__version!==S.version){re(N,S,p);return}else S.isExternalTexture&&(N.__webglTexture=S.sourceTexture?S.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,N.__webglTexture,i.TEXTURE0+p)}function $(S,p){let N=n.get(S);if(S.isRenderTargetTexture===!1&&S.version>0&&N.__version!==S.version){re(N,S,p);return}t.bindTexture(i.TEXTURE_3D,N.__webglTexture,i.TEXTURE0+p)}function ee(S,p){let N=n.get(S);if(S.isCubeDepthTexture!==!0&&S.version>0&&N.__version!==S.version){Pe(N,S,p);return}t.bindTexture(i.TEXTURE_CUBE_MAP,N.__webglTexture,i.TEXTURE0+p)}let Ae={[tr]:i.REPEAT,[an]:i.CLAMP_TO_EDGE,[nr]:i.MIRRORED_REPEAT},Se={[_t]:i.NEAREST,[Wl]:i.NEAREST_MIPMAP_NEAREST,[ds]:i.NEAREST_MIPMAP_LINEAR,[xt]:i.LINEAR,[Er]:i.LINEAR_MIPMAP_NEAREST,[Vn]:i.LINEAR_MIPMAP_LINEAR},it={[Zl]:i.NEVER,[$l]:i.ALWAYS,[Jl]:i.LESS,[ha]:i.LEQUAL,[Kl]:i.EQUAL,[ua]:i.GEQUAL,[jl]:i.GREATER,[Ql]:i.NOTEQUAL};function He(S,p){if(p.type===en&&e.has("OES_texture_float_linear")===!1&&(p.magFilter===xt||p.magFilter===Er||p.magFilter===ds||p.magFilter===Vn||p.minFilter===xt||p.minFilter===Er||p.minFilter===ds||p.minFilter===Vn)&&Re("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(S,i.TEXTURE_WRAP_S,Ae[p.wrapS]),i.texParameteri(S,i.TEXTURE_WRAP_T,Ae[p.wrapT]),(S===i.TEXTURE_3D||S===i.TEXTURE_2D_ARRAY)&&i.texParameteri(S,i.TEXTURE_WRAP_R,Ae[p.wrapR]),i.texParameteri(S,i.TEXTURE_MAG_FILTER,Se[p.magFilter]),i.texParameteri(S,i.TEXTURE_MIN_FILTER,Se[p.minFilter]),p.compareFunction&&(i.texParameteri(S,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(S,i.TEXTURE_COMPARE_FUNC,it[p.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(p.magFilter===_t||p.minFilter!==ds&&p.minFilter!==Vn||p.type===en&&e.has("OES_texture_float_linear")===!1)return;if(p.anisotropy>1||n.get(p).__currentAnisotropy){let N=e.get("EXT_texture_filter_anisotropic");i.texParameterf(S,N.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(p.anisotropy,s.getMaxAnisotropy())),n.get(p).__currentAnisotropy=p.anisotropy}}}function We(S,p){let N=!1;S.__webglInit===void 0&&(S.__webglInit=!0,p.addEventListener("dispose",C));let B=p.source,X=m.get(B);X===void 0&&(X={},m.set(B,X));let ie=Y(p);if(ie!==S.__cacheKey){X[ie]===void 0&&(X[ie]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,N=!0),X[ie].usedTimes++;let ae=X[S.__cacheKey];ae!==void 0&&(X[S.__cacheKey].usedTimes--,ae.usedTimes===0&&L(p)),S.__cacheKey=ie,S.__webglTexture=X[ie].texture}return N}function q(S,p,N){return Math.floor(Math.floor(S/N)/p)}function Q(S,p,N,B){let ie=S.updateRanges;if(ie.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,p.width,p.height,N,B,p.data);else{ie.sort((Te,ue)=>Te.start-ue.start);let ae=0;for(let Te=1;Te<ie.length;Te++){let ue=ie[ae],le=ie[Te],we=ue.start+ue.count,Ce=q(le.start,p.width,4),Oe=q(ue.start,p.width,4);le.start<=we+1&&Ce===Oe&&q(le.start+le.count-1,p.width,4)===Ce?ue.count=Math.max(ue.count,le.start+le.count-ue.start):(++ae,ie[ae]=le)}ie.length=ae+1;let Z=t.getParameter(i.UNPACK_ROW_LENGTH),j=t.getParameter(i.UNPACK_SKIP_PIXELS),oe=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,p.width);for(let Te=0,ue=ie.length;Te<ue;Te++){let le=ie[Te],we=Math.floor(le.start/4),Ce=Math.ceil(le.count/4),Oe=we%p.width,I=Math.floor(we/p.width),ce=Ce,K=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,Oe),t.pixelStorei(i.UNPACK_SKIP_ROWS,I),t.texSubImage2D(i.TEXTURE_2D,0,Oe,I,ce,K,N,B,p.data)}S.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,Z),t.pixelStorei(i.UNPACK_SKIP_PIXELS,j),t.pixelStorei(i.UNPACK_SKIP_ROWS,oe)}}function re(S,p,N){let B=i.TEXTURE_2D;(p.isDataArrayTexture||p.isCompressedArrayTexture)&&(B=i.TEXTURE_2D_ARRAY),p.isData3DTexture&&(B=i.TEXTURE_3D);let X=We(S,p),ie=p.source;t.bindTexture(B,S.__webglTexture,i.TEXTURE0+N);let ae=n.get(ie);if(ie.version!==ae.__version||X===!0){if(t.activeTexture(i.TEXTURE0+N),(typeof ImageBitmap<"u"&&p.image instanceof ImageBitmap)===!1){let K=Ze.getPrimaries(Ze.workingColorSpace),he=p.colorSpace===Mn?null:Ze.getPrimaries(p.colorSpace),ge=p.colorSpace===Mn||K===he?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,p.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,p.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ge)}t.pixelStorei(i.UNPACK_ALIGNMENT,p.unpackAlignment);let j=g(p.image,!1,s.maxTextureSize);j=ut(p,j);let oe=r.convert(p.format,p.colorSpace),Te=r.convert(p.type),ue=M(p.internalFormat,oe,Te,p.normalized,p.colorSpace,p.isVideoTexture);He(B,p);let le,we=p.mipmaps,Ce=p.isVideoTexture!==!0,Oe=ae.__version===void 0||X===!0,I=ie.dataReady,ce=A(p,j);if(p.isDepthTexture)ue=b(p.format===Gn,p.type),Oe&&(Ce?t.texStorage2D(i.TEXTURE_2D,1,ue,j.width,j.height):t.texImage2D(i.TEXTURE_2D,0,ue,j.width,j.height,0,oe,Te,null));else if(p.isDataTexture)if(we.length>0){Ce&&Oe&&t.texStorage2D(i.TEXTURE_2D,ce,ue,we[0].width,we[0].height);for(let K=0,he=we.length;K<he;K++)le=we[K],Ce?I&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,oe,Te,le.data):t.texImage2D(i.TEXTURE_2D,K,ue,le.width,le.height,0,oe,Te,le.data);p.generateMipmaps=!1}else Ce?(Oe&&t.texStorage2D(i.TEXTURE_2D,ce,ue,j.width,j.height),I&&Q(p,j,oe,Te)):t.texImage2D(i.TEXTURE_2D,0,ue,j.width,j.height,0,oe,Te,j.data);else if(p.isCompressedTexture)if(p.isCompressedArrayTexture){Ce&&Oe&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,ue,we[0].width,we[0].height,j.depth);for(let K=0,he=we.length;K<he;K++)if(le=we[K],p.format!==Xt)if(oe!==null)if(Ce){if(I)if(p.layerUpdates.size>0){let ge=Ao(le.width,le.height,p.format,p.type);for(let te of p.layerUpdates){let Ee=le.data.subarray(te*ge/le.data.BYTES_PER_ELEMENT,(te+1)*ge/le.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,te,le.width,le.height,1,oe,Ee)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,le.width,le.height,j.depth,oe,le.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,K,ue,le.width,le.height,j.depth,0,le.data,0,0);else Re("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ce?I&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,le.width,le.height,j.depth,oe,Te,le.data):t.texImage3D(i.TEXTURE_2D_ARRAY,K,ue,le.width,le.height,j.depth,0,oe,Te,le.data);p.layerUpdates.size>0&&p.clearLayerUpdates()}else{Ce&&Oe&&t.texStorage2D(i.TEXTURE_2D,ce,ue,we[0].width,we[0].height);for(let K=0,he=we.length;K<he;K++)le=we[K],p.format!==Xt?oe!==null?Ce?I&&t.compressedTexSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,oe,le.data):t.compressedTexImage2D(i.TEXTURE_2D,K,ue,le.width,le.height,0,le.data):Re("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ce?I&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,oe,Te,le.data):t.texImage2D(i.TEXTURE_2D,K,ue,le.width,le.height,0,oe,Te,le.data)}else if(p.isDataArrayTexture)if(Ce){if(Oe&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,ue,j.width,j.height,j.depth),I)if(p.layerUpdates.size>0){let K=Ao(j.width,j.height,p.format,p.type);for(let he of p.layerUpdates){let ge=j.data.subarray(he*K/j.data.BYTES_PER_ELEMENT,(he+1)*K/j.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,he,j.width,j.height,1,oe,Te,ge)}p.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,oe,Te,j.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ue,j.width,j.height,j.depth,0,oe,Te,j.data);else if(p.isData3DTexture)Ce?(Oe&&t.texStorage3D(i.TEXTURE_3D,ce,ue,j.width,j.height,j.depth),I&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,oe,Te,j.data)):t.texImage3D(i.TEXTURE_3D,0,ue,j.width,j.height,j.depth,0,oe,Te,j.data);else if(p.isFramebufferTexture){if(Oe)if(Ce)t.texStorage2D(i.TEXTURE_2D,ce,ue,j.width,j.height);else{let K=j.width,he=j.height;for(let ge=0;ge<ce;ge++)t.texImage2D(i.TEXTURE_2D,ge,ue,K,he,0,oe,Te,null),K>>=1,he>>=1}}else if(p.isHTMLTexture){if("texElementImage2D"in i){let K=i.canvas;if(K.hasAttribute("layoutsubtree")||K.setAttribute("layoutsubtree","true"),j.parentNode!==K){K.appendChild(j),f.add(p),K.onpaint=he=>{let ge=he.changedElements;for(let te of f)ge.includes(te.image)&&(te.needsUpdate=!0)},K.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,j);else{let ge=i.RGBA,te=i.RGBA,Ee=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,ge,te,Ee,j)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(we.length>0){if(Ce&&Oe){let K=je(we[0]);t.texStorage2D(i.TEXTURE_2D,ce,ue,K.width,K.height)}for(let K=0,he=we.length;K<he;K++)le=we[K],Ce?I&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,oe,Te,le):t.texImage2D(i.TEXTURE_2D,K,ue,oe,Te,le);p.generateMipmaps=!1}else if(Ce){if(Oe){let K=je(j);t.texStorage2D(i.TEXTURE_2D,ce,ue,K.width,K.height)}I&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,oe,Te,j)}else t.texImage2D(i.TEXTURE_2D,0,ue,oe,Te,j);d(p)&&w(B),ae.__version=ie.version,p.onUpdate&&p.onUpdate(p)}S.__version=p.version}function Pe(S,p,N){if(p.image.length!==6)return;let B=We(S,p),X=p.source;t.bindTexture(i.TEXTURE_CUBE_MAP,S.__webglTexture,i.TEXTURE0+N);let ie=n.get(X);if(X.version!==ie.__version||B===!0){t.activeTexture(i.TEXTURE0+N);let ae=Ze.getPrimaries(Ze.workingColorSpace),Z=p.colorSpace===Mn?null:Ze.getPrimaries(p.colorSpace),j=p.colorSpace===Mn||ae===Z?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,p.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,p.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,p.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,j);let oe=p.isCompressedTexture||p.image[0].isCompressedTexture,Te=p.image[0]&&p.image[0].isDataTexture,ue=[];for(let te=0;te<6;te++)!oe&&!Te?ue[te]=g(p.image[te],!0,s.maxCubemapSize):ue[te]=Te?p.image[te].image:p.image[te],ue[te]=ut(p,ue[te]);let le=ue[0],we=r.convert(p.format,p.colorSpace),Ce=r.convert(p.type),Oe=M(p.internalFormat,we,Ce,p.normalized,p.colorSpace),I=p.isVideoTexture!==!0,ce=ie.__version===void 0||B===!0,K=X.dataReady,he=A(p,le);He(i.TEXTURE_CUBE_MAP,p);let ge;if(oe){I&&ce&&t.texStorage2D(i.TEXTURE_CUBE_MAP,he,Oe,le.width,le.height);for(let te=0;te<6;te++){ge=ue[te].mipmaps;for(let Ee=0;Ee<ge.length;Ee++){let _e=ge[Ee];p.format!==Xt?we!==null?I?K&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,_e.width,_e.height,we,_e.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,Oe,_e.width,_e.height,0,_e.data):Re("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,_e.width,_e.height,we,Ce,_e.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,Oe,_e.width,_e.height,0,we,Ce,_e.data)}}}else{if(ge=p.mipmaps,I&&ce){ge.length>0&&he++;let te=je(ue[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,he,Oe,te.width,te.height)}for(let te=0;te<6;te++)if(Te){I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,ue[te].width,ue[te].height,we,Ce,ue[te].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Oe,ue[te].width,ue[te].height,0,we,Ce,ue[te].data);for(let Ee=0;Ee<ge.length;Ee++){let at=ge[Ee].image[te].image;I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,at.width,at.height,we,Ce,at.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,Oe,at.width,at.height,0,we,Ce,at.data)}}else{I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,we,Ce,ue[te]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Oe,we,Ce,ue[te]);for(let Ee=0;Ee<ge.length;Ee++){let _e=ge[Ee];I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,we,Ce,_e.image[te]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,Oe,we,Ce,_e.image[te])}}}d(p)&&w(i.TEXTURE_CUBE_MAP),ie.__version=X.version,p.onUpdate&&p.onUpdate(p)}S.__version=p.version}function me(S,p,N,B,X,ie){let ae=r.convert(N.format,N.colorSpace),Z=r.convert(N.type),j=M(N.internalFormat,ae,Z,N.normalized,N.colorSpace),oe=n.get(p),Te=n.get(N);if(Te.__renderTarget=p,!oe.__hasExternalTextures){let ue=Math.max(1,p.width>>ie),le=Math.max(1,p.height>>ie);X===i.TEXTURE_3D||X===i.TEXTURE_2D_ARRAY?t.texImage3D(X,ie,j,ue,le,p.depth,0,ae,Z,null):t.texImage2D(X,ie,j,ue,le,0,ae,Z,null)}t.bindFramebuffer(i.FRAMEBUFFER,S),$e(p)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,B,X,Te.__webglTexture,0,qe(p)):(X===i.TEXTURE_2D||X>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&X<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,B,X,Te.__webglTexture,ie),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Fe(S,p,N){if(i.bindRenderbuffer(i.RENDERBUFFER,S),p.depthBuffer){let B=p.depthTexture,X=B&&B.isDepthTexture?B.type:null,ie=b(p.stencilBuffer,X),ae=p.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;$e(p)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,qe(p),ie,p.width,p.height):N?i.renderbufferStorageMultisample(i.RENDERBUFFER,qe(p),ie,p.width,p.height):i.renderbufferStorage(i.RENDERBUFFER,ie,p.width,p.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ae,i.RENDERBUFFER,S)}else{let B=p.textures;for(let X=0;X<B.length;X++){let ie=B[X],ae=r.convert(ie.format,ie.colorSpace),Z=r.convert(ie.type),j=M(ie.internalFormat,ae,Z,ie.normalized,ie.colorSpace);$e(p)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,qe(p),j,p.width,p.height):N?i.renderbufferStorageMultisample(i.RENDERBUFFER,qe(p),j,p.width,p.height):i.renderbufferStorage(i.RENDERBUFFER,j,p.width,p.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function dt(S,p,N){let B=p.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,S),!(p.depthTexture&&p.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let X=n.get(p.depthTexture);if(X.__renderTarget=p,(!X.__webglTexture||p.depthTexture.image.width!==p.width||p.depthTexture.image.height!==p.height)&&(p.depthTexture.image.width=p.width,p.depthTexture.image.height=p.height,p.depthTexture.needsUpdate=!0),B){if(X.__webglInit===void 0&&(X.__webglInit=!0,p.depthTexture.addEventListener("dispose",C)),X.__webglTexture===void 0){X.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),He(i.TEXTURE_CUBE_MAP,p.depthTexture);let oe=r.convert(p.depthTexture.format),Te=r.convert(p.depthTexture.type),ue;p.depthTexture.format===on?ue=i.DEPTH_COMPONENT24:p.depthTexture.format===Gn&&(ue=i.DEPTH24_STENCIL8);for(let le=0;le<6;le++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,ue,p.width,p.height,0,oe,Te,null)}}else ne(p.depthTexture,0);let ie=X.__webglTexture,ae=qe(p),Z=B?i.TEXTURE_CUBE_MAP_POSITIVE_X+N:i.TEXTURE_2D,j=p.depthTexture.format===Gn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(p.depthTexture.format===on)$e(p)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,Z,ie,0,ae):i.framebufferTexture2D(i.FRAMEBUFFER,j,Z,ie,0);else if(p.depthTexture.format===Gn)$e(p)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,Z,ie,0,ae):i.framebufferTexture2D(i.FRAMEBUFFER,j,Z,ie,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ne(S){let p=n.get(S),N=S.isWebGLCubeRenderTarget===!0;if(p.__boundDepthTexture!==S.depthTexture){let B=S.depthTexture;if(p.__depthDisposeCallback&&p.__depthDisposeCallback(),B){let X=()=>{delete p.__boundDepthTexture,delete p.__depthDisposeCallback,B.removeEventListener("dispose",X)};B.addEventListener("dispose",X),p.__depthDisposeCallback=X}p.__boundDepthTexture=B}if(S.depthTexture&&!p.__autoAllocateDepthBuffer)if(N)for(let B=0;B<6;B++)dt(p.__webglFramebuffer[B],S,B);else{let B=S.texture.mipmaps;B&&B.length>0?dt(p.__webglFramebuffer[0],S,0):dt(p.__webglFramebuffer,S,0)}else if(N){p.__webglDepthbuffer=[];for(let B=0;B<6;B++)if(t.bindFramebuffer(i.FRAMEBUFFER,p.__webglFramebuffer[B]),p.__webglDepthbuffer[B]===void 0)p.__webglDepthbuffer[B]=i.createRenderbuffer(),Fe(p.__webglDepthbuffer[B],S,!1);else{let X=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=p.__webglDepthbuffer[B];i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,ie)}}else{let B=S.texture.mipmaps;if(B&&B.length>0?t.bindFramebuffer(i.FRAMEBUFFER,p.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,p.__webglFramebuffer),p.__webglDepthbuffer===void 0)p.__webglDepthbuffer=i.createRenderbuffer(),Fe(p.__webglDepthbuffer,S,!1);else{let X=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ie=p.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ie),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,ie)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ke(S,p,N){let B=n.get(S);p!==void 0&&me(B.__webglFramebuffer,S,S.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),N!==void 0&&Ne(S)}function Xe(S){let p=S.texture,N=n.get(S),B=n.get(p);S.addEventListener("dispose",y);let X=S.textures,ie=S.isWebGLCubeRenderTarget===!0,ae=X.length>1;if(ae||(B.__webglTexture===void 0&&(B.__webglTexture=i.createTexture()),B.__version=p.version,a.memory.textures++),ie){N.__webglFramebuffer=[];for(let Z=0;Z<6;Z++)if(p.mipmaps&&p.mipmaps.length>0){N.__webglFramebuffer[Z]=[];for(let j=0;j<p.mipmaps.length;j++)N.__webglFramebuffer[Z][j]=i.createFramebuffer()}else N.__webglFramebuffer[Z]=i.createFramebuffer()}else{if(p.mipmaps&&p.mipmaps.length>0){N.__webglFramebuffer=[];for(let Z=0;Z<p.mipmaps.length;Z++)N.__webglFramebuffer[Z]=i.createFramebuffer()}else N.__webglFramebuffer=i.createFramebuffer();if(ae)for(let Z=0,j=X.length;Z<j;Z++){let oe=n.get(X[Z]);oe.__webglTexture===void 0&&(oe.__webglTexture=i.createTexture(),a.memory.textures++)}if(S.samples>0&&$e(S)===!1){N.__webglMultisampledFramebuffer=i.createFramebuffer(),N.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,N.__webglMultisampledFramebuffer);for(let Z=0;Z<X.length;Z++){let j=X[Z];N.__webglColorRenderbuffer[Z]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,N.__webglColorRenderbuffer[Z]);let oe=r.convert(j.format,j.colorSpace),Te=r.convert(j.type),ue=M(j.internalFormat,oe,Te,j.normalized,j.colorSpace,S.isXRRenderTarget===!0),le=qe(S);i.renderbufferStorageMultisample(i.RENDERBUFFER,le,ue,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Z,i.RENDERBUFFER,N.__webglColorRenderbuffer[Z])}i.bindRenderbuffer(i.RENDERBUFFER,null),S.depthBuffer&&(N.__webglDepthRenderbuffer=i.createRenderbuffer(),Fe(N.__webglDepthRenderbuffer,S,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ie){t.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture),He(i.TEXTURE_CUBE_MAP,p);for(let Z=0;Z<6;Z++)if(p.mipmaps&&p.mipmaps.length>0)for(let j=0;j<p.mipmaps.length;j++)me(N.__webglFramebuffer[Z][j],S,p,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Z,j);else me(N.__webglFramebuffer[Z],S,p,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Z,0);d(p)&&w(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let Z=0,j=X.length;Z<j;Z++){let oe=X[Z],Te=n.get(oe),ue=i.TEXTURE_2D;(S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(ue=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ue,Te.__webglTexture),He(ue,oe),me(N.__webglFramebuffer,S,oe,i.COLOR_ATTACHMENT0+Z,ue,0),d(oe)&&w(ue)}t.unbindTexture()}else{let Z=i.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(Z=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Z,B.__webglTexture),He(Z,p),p.mipmaps&&p.mipmaps.length>0)for(let j=0;j<p.mipmaps.length;j++)me(N.__webglFramebuffer[j],S,p,i.COLOR_ATTACHMENT0,Z,j);else me(N.__webglFramebuffer,S,p,i.COLOR_ATTACHMENT0,Z,0);d(p)&&w(Z),t.unbindTexture()}S.depthBuffer&&Ne(S)}function ke(S){let p=S.textures;for(let N=0,B=p.length;N<B;N++){let X=p[N];if(d(X)){let ie=R(S),ae=n.get(X).__webglTexture;t.bindTexture(ie,ae),w(ie),t.unbindTexture()}}}let se=[],Ue=[];function Le(S){if(S.samples>0){if($e(S)===!1){let p=S.textures,N=S.width,B=S.height,X=i.COLOR_BUFFER_BIT,ie=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=n.get(S),Z=p.length>1;if(Z)for(let oe=0;oe<p.length;oe++)t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);let j=S.texture.mipmaps;j&&j.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let oe=0;oe<p.length;oe++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(X|=i.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(X|=i.STENCIL_BUFFER_BIT)),Z){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ae.__webglColorRenderbuffer[oe]);let Te=n.get(p[oe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Te,0)}i.blitFramebuffer(0,0,N,B,0,0,N,B,X,i.NEAREST),l===!0&&(se.length=0,Ue.length=0,se.push(i.COLOR_ATTACHMENT0+oe),S.depthBuffer&&S.storeMultisampledDepthBuffer===!1&&(se.push(ie),Ue.push(ie),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ue)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,se))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Z)for(let oe=0;oe<p.length;oe++){t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,ae.__webglColorRenderbuffer[oe]);let Te=n.get(p[oe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,Te,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(S.depthBuffer&&S.storeMultisampledDepthBuffer===!1&&l){let p=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[p])}}}function qe(S){return Math.min(s.maxSamples,S.samples)}function $e(S){let p=n.get(S);return S.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&p.__useRenderToTexture!==!1}function E(S){let p=a.render.frame;u.get(S)!==p&&(u.set(S,p),S.update())}function ut(S,p){let N=S.colorSpace,B=S.format,X=S.type;return S.isCompressedTexture===!0||S.isVideoTexture===!0||N!==Hi&&N!==Mn&&(Ze.getTransfer(N)===nt?(B!==Xt||X!==Gt)&&Re("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ie("WebGLTextures: Unsupported texture color space:",N)),p}function je(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(c.width=S.naturalWidth||S.width,c.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(c.width=S.displayWidth,c.height=S.displayHeight):(c.width=S.width,c.height=S.height),c}this.allocateTextureUnit=J,this.resetTextureUnits=k,this.getTextureUnits=D,this.setTextureUnits=V,this.setTexture2D=ne,this.setTexture2DArray=W,this.setTexture3D=$,this.setTextureCube=ee,this.rebindTextures=Ke,this.setupRenderTarget=Xe,this.updateRenderTargetMipmap=ke,this.updateMultisampleRenderTarget=Le,this.setupDepthRenderbuffer=Ne,this.setupFrameBufferTexture=me,this.useMultisampledRTT=$e,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Im(i,e){function t(n,s=Mn){let r,a=Ze.getTransfer(s);if(n===Gt)return i.UNSIGNED_BYTE;if(n===Rr)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Pr)return i.UNSIGNED_SHORT_5_5_5_1;if(n===ho)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===uo)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===lo)return i.BYTE;if(n===co)return i.SHORT;if(n===Ri)return i.UNSIGNED_SHORT;if(n===Cr)return i.INT;if(n===$t)return i.UNSIGNED_INT;if(n===en)return i.FLOAT;if(n===tn)return i.HALF_FLOAT;if(n===fo)return i.ALPHA;if(n===po)return i.RGB;if(n===Xt)return i.RGBA;if(n===on)return i.DEPTH_COMPONENT;if(n===Gn)return i.DEPTH_STENCIL;if(n===mo)return i.RED;if(n===Ir)return i.RED_INTEGER;if(n===kn)return i.RG;if(n===Lr)return i.RG_INTEGER;if(n===Dr)return i.RGBA_INTEGER;if(n===fs||n===ps||n===ms||n===gs)if(a===nt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===fs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ps)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ms)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===gs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===fs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ps)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ms)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===gs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Nr||n===Ur||n===Fr||n===Or)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Nr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ur)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Fr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Or)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Br||n===zr||n===Vr||n===Gr||n===kr||n===xs||n===Hr)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Br||n===zr)return a===nt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Vr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Gr)return r.COMPRESSED_R11_EAC;if(n===kr)return r.COMPRESSED_SIGNED_R11_EAC;if(n===xs)return r.COMPRESSED_RG11_EAC;if(n===Hr)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Wr||n===Xr||n===qr||n===Yr||n===Zr||n===Jr||n===Kr||n===jr||n===Qr||n===$r||n===ea||n===ta||n===na||n===ia)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Wr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Xr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===qr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Yr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Zr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Jr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Kr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===jr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Qr)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===$r)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ea)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ta)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===na)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ia)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===sa||n===ra||n===aa)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===sa)return a===nt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ra)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===aa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===oa||n===la||n===vs||n===ca)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===oa)return r.COMPRESSED_RED_RGTC1_EXT;if(n===la)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===vs)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ca)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Pi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var Lm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Dm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Bo=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ns(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Et({vertexShader:Lm,fragmentShader:Dm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ut(new is(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},zo=class extends ln{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,f=null,h=null,m=null,x=null,_=typeof XRWebGLBinding<"u",g=new Bo,d={},w=t.getContextAttributes(),R=null,M=null,b=[],A=[],C=new Be,y=null,T=null,L=new wt;L.viewport=new ht;let U=new wt;U.viewport=new ht;let z=[L,U],k=new Ar,D=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let Q=b[q];return Q===void 0&&(Q=new Ai,b[q]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(q){let Q=b[q];return Q===void 0&&(Q=new Ai,b[q]=Q),Q.getGripSpace()},this.getHand=function(q){let Q=b[q];return Q===void 0&&(Q=new Ai,b[q]=Q),Q.getHandSpace()};function J(q){let Q=A.indexOf(q.inputSource);if(Q===-1)return;let re=b[Q];re!==void 0&&(re.update(q.inputSource,q.frame,c||a),re.dispatchEvent({type:q.type,data:q.inputSource}))}function Y(){s.removeEventListener("select",J),s.removeEventListener("selectstart",J),s.removeEventListener("selectend",J),s.removeEventListener("squeeze",J),s.removeEventListener("squeezestart",J),s.removeEventListener("squeezeend",J),s.removeEventListener("end",Y),s.removeEventListener("inputsourceschange",ne);for(let q=0;q<b.length;q++){let Q=A[q];Q!==null&&(A[q]=null,b[q].disconnect(Q))}D=null,V=null,g.reset();for(let q in d)delete d[q];if(e.setRenderTarget(R),m=null,h=null,f=null,s=null,M=null,We.stop(),n.isPresenting=!1,e.setPixelRatio(y),e.setSize(C.width,C.height,!1),T!==null){let q=T.camera;q.fov=T.fov,q.zoom=T.zoom,q.updateProjectionMatrix(),T=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&Re("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,n.isPresenting===!0&&Re("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return f===null&&_&&(f=new XRWebGLBinding(s,t)),f},this.getFrame=function(){return x},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(R=e.getRenderTarget(),s.addEventListener("select",J),s.addEventListener("selectstart",J),s.addEventListener("selectend",J),s.addEventListener("squeeze",J),s.addEventListener("squeezestart",J),s.addEventListener("squeezeend",J),s.addEventListener("end",Y),s.addEventListener("inputsourceschange",ne),w.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(C),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let re=null,Pe=null,me=null;w.depth&&(me=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,re=w.stencil?Gn:on,Pe=w.stencil?Pi:$t);let Fe={colorFormat:t.RGBA8,depthFormat:me,scaleFactor:r};f=this.getBinding(),h=f.createProjectionLayer(Fe),s.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),M=new Dt(h.textureWidth,h.textureHeight,{format:Xt,type:Gt,depthTexture:new Dn(h.textureWidth,h.textureHeight,Pe,void 0,void 0,void 0,void 0,void 0,void 0,re),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let re={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,re),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),M=new Dt(m.framebufferWidth,m.framebufferHeight,{format:Xt,type:Gt,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),We.setContext(s),We.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function ne(q){for(let Q=0;Q<q.removed.length;Q++){let re=q.removed[Q],Pe=A.indexOf(re);Pe>=0&&(A[Pe]=null,b[Pe].disconnect(re))}for(let Q=0;Q<q.added.length;Q++){let re=q.added[Q],Pe=A.indexOf(re);if(Pe===-1){for(let Fe=0;Fe<b.length;Fe++)if(Fe>=A.length){A.push(re),Pe=Fe;break}else if(A[Fe]===null){A[Fe]=re,Pe=Fe;break}if(Pe===-1)break}let me=b[Pe];me&&me.connect(re)}}let W=new G,$=new G;function ee(q,Q,re){W.setFromMatrixPosition(Q.matrixWorld),$.setFromMatrixPosition(re.matrixWorld);let Pe=W.distanceTo($),me=Q.projectionMatrix.elements,Fe=re.projectionMatrix.elements,dt=me[14]/(me[10]-1),Ne=me[14]/(me[10]+1),Ke=(me[9]+1)/me[5],Xe=(me[9]-1)/me[5],ke=(me[8]-1)/me[0],se=(Fe[8]+1)/Fe[0],Ue=dt*ke,Le=dt*se,qe=Pe/(-ke+se),$e=qe*-ke;if(Q.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX($e),q.translateZ(qe),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),me[10]===-1)q.projectionMatrix.copy(Q.projectionMatrix),q.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{let E=dt+qe,ut=Ne+qe,je=Ue-$e,S=Le+(Pe-$e),p=Ke*Ne/ut*E,N=Xe*Ne/ut*E;q.projectionMatrix.makePerspective(je,S,p,N,E,ut),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function Ae(q,Q){Q===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(Q.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let Q=q.near,re=q.far;g.texture!==null&&(g.depthNear>0&&(Q=g.depthNear),g.depthFar>0&&(re=g.depthFar)),k.near=U.near=L.near=Q,k.far=U.far=L.far=re,(D!==k.near||V!==k.far)&&(s.updateRenderState({depthNear:k.near,depthFar:k.far}),D=k.near,V=k.far),k.layers.mask=q.layers.mask|6,L.layers.mask=k.layers.mask&-5,U.layers.mask=k.layers.mask&-3;let Pe=q.parent,me=k.cameras;Ae(k,Pe);for(let Fe=0;Fe<me.length;Fe++)Ae(me[Fe],Pe);me.length===2?ee(k,L,U):k.projectionMatrix.copy(L.projectionMatrix),T===null&&q.isPerspectiveCamera&&(T={camera:q,fov:q.fov,zoom:q.zoom}),Se(q,k,Pe)};function Se(q,Q,re){re===null?q.matrix.copy(Q.matrixWorld):(q.matrix.copy(re.matrixWorld),q.matrix.invert(),q.matrix.multiply(Q.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(Q.projectionMatrix),q.projectionMatrixInverse.copy(Q.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Si*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return k},this.getFoveation=function(){if(!(h===null&&m===null))return l},this.setFoveation=function(q){l=q,h!==null&&(h.fixedFoveation=q),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=q)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(k)},this.getCameraTexture=function(q){return d[q]};let it=null;function He(q,Q){if(u=Q.getViewerPose(c||a),x=Q,u!==null){let re=u.views;m!==null&&(e.setRenderTargetFramebuffer(M,m.framebuffer),e.setRenderTarget(M));let Pe=!1;re.length!==k.cameras.length&&(k.cameras.length=0,Pe=!0);for(let Ne=0;Ne<re.length;Ne++){let Ke=re[Ne],Xe=null;if(m!==null)Xe=m.getViewport(Ke);else{let se=f.getViewSubImage(h,Ke);Xe=se.viewport,Ne===0&&(e.setRenderTargetTextures(M,se.colorTexture,se.depthStencilTexture),e.setRenderTarget(M))}let ke=z[Ne];ke===void 0&&(ke=new wt,ke.layers.enable(Ne),ke.viewport=new ht,z[Ne]=ke),ke.matrix.fromArray(Ke.transform.matrix),ke.matrix.decompose(ke.position,ke.quaternion,ke.scale),ke.projectionMatrix.fromArray(Ke.projectionMatrix),ke.projectionMatrixInverse.copy(ke.projectionMatrix).invert(),ke.viewport.set(Xe.x,Xe.y,Xe.width,Xe.height),Ne===0&&(k.matrix.copy(ke.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale)),Pe===!0&&k.cameras.push(ke)}let me=s.enabledFeatures;if(me&&me.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){f=n.getBinding();let Ne=f.getDepthInformation(re[0]);Ne&&Ne.isValid&&Ne.texture&&g.init(Ne,s.renderState)}if(me&&me.includes("camera-access")&&_){e.state.unbindTexture(),f=n.getBinding();for(let Ne=0;Ne<re.length;Ne++){let Ke=re[Ne].camera;if(Ke){let Xe=d[Ke];Xe||(Xe=new ns,d[Ke]=Xe);let ke=f.getCameraImage(Ke);Xe.sourceTexture=ke}}}}for(let re=0;re<b.length;re++){let Pe=A[re],me=b[re];Pe!==null&&me!==void 0&&me.update(Pe,Q,c||a)}it&&it(q,Q),Q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Q}),x=null}let We=new Pc;We.setAnimationLoop(He),this.setAnimationLoop=function(q){it=q},this.dispose=function(){}}},Nm=new ft,Fc=new De;Fc.set(-1,0,0,0,1,0,0,0,1);function Um(i,e){function t(g,d){g.matrixAutoUpdate===!0&&g.updateMatrix(),d.value.copy(g.matrix)}function n(g,d){d.color.getRGB(g.fogColor.value,_o(i)),d.isFog?(g.fogNear.value=d.near,g.fogFar.value=d.far):d.isFogExp2&&(g.fogDensity.value=d.density)}function s(g,d,w,R,M){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?r(g,d):d.isMeshLambertMaterial?(r(g,d),d.envMap&&(g.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(r(g,d),f(g,d)):d.isMeshPhongMaterial?(r(g,d),u(g,d),d.envMap&&(g.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(r(g,d),h(g,d),d.isMeshPhysicalMaterial&&m(g,d,M)):d.isMeshMatcapMaterial?(r(g,d),x(g,d)):d.isMeshDepthMaterial?r(g,d):d.isMeshDistanceMaterial?(r(g,d),_(g,d)):d.isMeshNormalMaterial?r(g,d):d.isLineBasicMaterial?(a(g,d),d.isLineDashedMaterial&&o(g,d)):d.isPointsMaterial?l(g,d,w,R):d.isSpriteMaterial?c(g,d):d.isShadowMaterial?(g.color.value.copy(d.color),g.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(g,d){g.opacity.value=d.opacity,d.color&&g.diffuse.value.copy(d.color),d.emissive&&g.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(g.map.value=d.map,t(d.map,g.mapTransform)),d.alphaMap&&(g.alphaMap.value=d.alphaMap,t(d.alphaMap,g.alphaMapTransform)),d.bumpMap&&(g.bumpMap.value=d.bumpMap,t(d.bumpMap,g.bumpMapTransform),g.bumpScale.value=d.bumpScale,d.side===Lt&&(g.bumpScale.value*=-1)),d.normalMap&&(g.normalMap.value=d.normalMap,t(d.normalMap,g.normalMapTransform),g.normalScale.value.copy(d.normalScale),d.side===Lt&&g.normalScale.value.negate()),d.displacementMap&&(g.displacementMap.value=d.displacementMap,t(d.displacementMap,g.displacementMapTransform),g.displacementScale.value=d.displacementScale,g.displacementBias.value=d.displacementBias),d.emissiveMap&&(g.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,g.emissiveMapTransform)),d.specularMap&&(g.specularMap.value=d.specularMap,t(d.specularMap,g.specularMapTransform)),d.alphaTest>0&&(g.alphaTest.value=d.alphaTest);let w=e.get(d),R=w.envMap,M=w.envMapRotation;R&&(g.envMap.value=R,g.envMapRotation.value.setFromMatrix4(Nm.makeRotationFromEuler(M)).transpose(),R.isCubeTexture&&R.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Fc),g.reflectivity.value=d.reflectivity,g.ior.value=d.ior,g.refractionRatio.value=d.refractionRatio),d.lightMap&&(g.lightMap.value=d.lightMap,g.lightMapIntensity.value=d.lightMapIntensity,t(d.lightMap,g.lightMapTransform)),d.aoMap&&(g.aoMap.value=d.aoMap,g.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,g.aoMapTransform))}function a(g,d){g.diffuse.value.copy(d.color),g.opacity.value=d.opacity,d.map&&(g.map.value=d.map,t(d.map,g.mapTransform))}function o(g,d){g.dashSize.value=d.dashSize,g.totalSize.value=d.dashSize+d.gapSize,g.scale.value=d.scale}function l(g,d,w,R){g.diffuse.value.copy(d.color),g.opacity.value=d.opacity,g.size.value=d.size*w,g.scale.value=R*.5,d.map&&(g.map.value=d.map,t(d.map,g.uvTransform)),d.alphaMap&&(g.alphaMap.value=d.alphaMap,t(d.alphaMap,g.alphaMapTransform)),d.alphaTest>0&&(g.alphaTest.value=d.alphaTest)}function c(g,d){g.diffuse.value.copy(d.color),g.opacity.value=d.opacity,g.rotation.value=d.rotation,d.map&&(g.map.value=d.map,t(d.map,g.mapTransform)),d.alphaMap&&(g.alphaMap.value=d.alphaMap,t(d.alphaMap,g.alphaMapTransform)),d.alphaTest>0&&(g.alphaTest.value=d.alphaTest)}function u(g,d){g.specular.value.copy(d.specular),g.shininess.value=Math.max(d.shininess,1e-4)}function f(g,d){d.gradientMap&&(g.gradientMap.value=d.gradientMap)}function h(g,d){g.metalness.value=d.metalness,d.metalnessMap&&(g.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,g.metalnessMapTransform)),g.roughness.value=d.roughness,d.roughnessMap&&(g.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,g.roughnessMapTransform)),d.envMap&&(g.envMapIntensity.value=d.envMapIntensity)}function m(g,d,w){g.ior.value=d.ior,d.sheen>0&&(g.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),g.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(g.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,g.sheenColorMapTransform)),d.sheenRoughnessMap&&(g.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,g.sheenRoughnessMapTransform))),d.clearcoat>0&&(g.clearcoat.value=d.clearcoat,g.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(g.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,g.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(g.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Lt&&g.clearcoatNormalScale.value.negate())),d.dispersion>0&&(g.dispersion.value=d.dispersion),d.retroreflectivity>0&&(g.retroreflectivity.value=d.retroreflectivity),d.iridescence>0&&(g.iridescence.value=d.iridescence,g.iridescenceIOR.value=d.iridescenceIOR,g.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(g.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,g.iridescenceMapTransform)),d.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),d.transmission>0&&(g.transmission.value=d.transmission,g.transmissionSamplerMap.value=w.texture,g.transmissionSamplerSize.value.set(w.width,w.height),d.transmissionMap&&(g.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,g.transmissionMapTransform)),g.thickness.value=d.thickness,d.thicknessMap&&(g.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=d.attenuationDistance,g.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(g.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(g.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=d.specularIntensity,g.specularColor.value.copy(d.specularColor),d.specularColorMap&&(g.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,g.specularColorMapTransform)),d.specularIntensityMap&&(g.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,g.specularIntensityMapTransform))}function x(g,d){d.matcap&&(g.matcap.value=d.matcap)}function _(g,d){let w=e.get(d).light;g.referencePosition.value.setFromMatrixPosition(w.matrixWorld),g.nearDistance.value=w.shadow.camera.near,g.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Fm(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,b){let A=b.program;n.uniformBlockBinding(M,A)}function c(M,b){let A=s[M.id];A===void 0&&(g(M),A=u(M),s[M.id]=A,M.addEventListener("dispose",w));let C=b.program;n.updateUBOMapping(M,C);let y=e.render.frame;r[M.id]!==y&&(h(M),r[M.id]=y)}function u(M){let b=f();M.__bindingPointIndex=b;let A=i.createBuffer(),C=M.__size,y=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,A),i.bufferData(i.UNIFORM_BUFFER,C,y),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,b,A),A}function f(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return Ie("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(M){let b=s[M.id],A=M.uniforms,C=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,b);for(let y=0,T=A.length;y<T;y++){let L=A[y];if(Array.isArray(L))for(let U=0,z=L.length;U<z;U++)m(L[U],y,U,C);else m(L,y,0,C)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(M,b,A,C){if(_(M,b,A,C)===!0){let y=M.__offset,T=M.value;if(Array.isArray(T)){let L=0;for(let U=0;U<T.length;U++){let z=T[U],k=d(z);x(z,M.__data,L),typeof z!="number"&&typeof z!="boolean"&&!z.isMatrix3&&!ArrayBuffer.isView(z)&&(L+=k.storage/Float32Array.BYTES_PER_ELEMENT)}}else x(T,M.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,y,M.__data)}}function x(M,b,A){typeof M=="number"||typeof M=="boolean"?b[0]=M:M.isMatrix3?(b[0]=M.elements[0],b[1]=M.elements[1],b[2]=M.elements[2],b[3]=0,b[4]=M.elements[3],b[5]=M.elements[4],b[6]=M.elements[5],b[7]=0,b[8]=M.elements[6],b[9]=M.elements[7],b[10]=M.elements[8],b[11]=0):ArrayBuffer.isView(M)?b.set(new M.constructor(M.buffer,M.byteOffset,b.length)):M.toArray(b,A)}function _(M,b,A,C){let y=M.value,T=b+"_"+A;if(C[T]===void 0)return typeof y=="number"||typeof y=="boolean"?C[T]=y:ArrayBuffer.isView(y)?C[T]=y.slice():C[T]=y.clone(),!0;{let L=C[T];if(typeof y=="number"||typeof y=="boolean"){if(L!==y)return C[T]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(L.equals(y)===!1)return L.copy(y),!0}}return!1}function g(M){let b=M.uniforms,A=0,C=16;for(let T=0,L=b.length;T<L;T++){let U=Array.isArray(b[T])?b[T]:[b[T]];for(let z=0,k=U.length;z<k;z++){let D=U[z],V=Array.isArray(D.value)?D.value:[D.value];for(let J=0,Y=V.length;J<Y;J++){let ne=V[J],W=d(ne),$=A%C,ee=$%W.boundary,Ae=$+ee;A+=ee,Ae!==0&&C-Ae<W.storage&&(A+=C-Ae),D.__data=new Float32Array(W.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=A,A+=W.storage}}}let y=A%C;return y>0&&(A+=C-y),M.__size=A,M.__cache={},this}function d(M){let b={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(b.boundary=4,b.storage=4):M.isVector2?(b.boundary=8,b.storage=8):M.isVector3||M.isColor?(b.boundary=16,b.storage=12):M.isVector4?(b.boundary=16,b.storage=16):M.isMatrix3?(b.boundary=48,b.storage=48):M.isMatrix4?(b.boundary=64,b.storage=64):M.isTexture?Re("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(b.boundary=16,b.storage=M.byteLength):Re("WebGLRenderer: Unsupported uniform value type.",M),b}function w(M){let b=M.target;b.removeEventListener("dispose",w);let A=a.indexOf(b.__bindingPointIndex);a.splice(A,1),i.deleteBuffer(s[b.id]),delete s[b.id],delete r[b.id]}function R(){for(let M in s)i.deleteBuffer(s[M]);a=[],s={},r={}}return{bind:l,update:c,dispose:R}}var Om=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),dn=null;function Bm(){return dn===null&&(dn=new or(Om,16,16,kn,tn),dn.name="DFG_LUT",dn.minFilter=xt,dn.magFilter=xt,dn.wrapS=an,dn.wrapT=an,dn.generateMipmaps=!1,dn.needsUpdate=!0),dn}var ga=class{constructor(e={}){let{canvas:t=tc(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:h=!1,outputBufferType:m=Gt}=e;this.isWebGLRenderer=!0;let x;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");x=n.getContextAttributes().alpha}else x=a;let _=m,g=new Set([Dr,Lr,Ir]),d=new Set([Gt,$t,Ri,Pi,Rr,Pr]),w=new Uint32Array(4),R=new Int32Array(4),M=new G,b=null,A=null,C=[],y=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Qt,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let L=this,U=!1,z=null,k=null,D=null,V=null;this._outputColorSpace=Bt;let J=0,Y=0,ne=null,W=-1,$=null,ee=new ht,Ae=new ht,Se=null,it=new ze(0),He=0,We=t.width,q=t.height,Q=1,re=null,Pe=null,me=new ht(0,0,We,q),Fe=new ht(0,0,We,q),dt=!1,Ne=new $i,Ke=!1,Xe=!1,ke=new ft,se=new G,Ue=new ht,Le={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},qe=!1;function $e(){return ne===null?Q:1}let E=n;function ut(v,P){return t.getContext(v,P)}let je,S,p,N,B,X,ie,ae,Z,j,oe,Te,ue,le,we,Ce,Oe,I,ce,K,he,ge,te;try{let v={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",at,!1),t.addEventListener("webglcontextrestored",et,!1),t.addEventListener("webglcontextcreationerror",qt,!1),E===null){let P="webgl2";if(E=ut(P,v),E===null)throw ut(P)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ee()}catch(v){throw t.removeEventListener("webglcontextlost",at,!1),t.removeEventListener("webglcontextrestored",et,!1),t.removeEventListener("webglcontextcreationerror",qt,!1),Ie("WebGLRenderer: "+v.message),v}function Ee(){je=new Xf(E),je.init(),he=new Im(E,je),S=new Uf(E,je,e,he),p=new Rm(E,je),S.reversedDepthBuffer&&h&&p.buffers.depth.setReversed(!0),k=E.createFramebuffer(),D=E.createFramebuffer(),V=E.createFramebuffer(),N=new Zf(E),B=new mm,X=new Pm(E,je,p,B,S,he,N),ie=new Wf(L),ae=new Jh(E),ge=new Df(E,ae),Z=new qf(E,ae,N,ge),j=new Kf(E,Z,ae,ge,N),I=new Jf(E,S,X),we=new Ff(B),oe=new pm(L,ie,je,S,ge,we),Te=new Um(L,B),ue=new xm,le=new bm(je),Oe=new Lf(L,ie,p,j,x,l),Ce=new Cm(L,j,S),te=new Fm(E,N,S,p),ce=new Nf(E,je,N),K=new Yf(E,je,N),N.programs=oe.programs,L.capabilities=S,L.extensions=je,L.properties=B,L.renderLists=ue,L.shadowMap=Ce,L.state=p,L.info=N}_!==Gt&&(T=new Qf(_,t.width,t.height,o,s,r));let _e=new zo(L,E);this.xr=_e,this.getContext=function(){return E},this.getContextAttributes=function(){return E.getContextAttributes()},this.forceContextLoss=function(){let v=je.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=je.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(v){v!==void 0&&(Q=v,this.setSize(We,q,!1))},this.getSize=function(v){return v.set(We,q)},this.setSize=function(v,P,H=!0){if(_e.isPresenting){Re("WebGLRenderer: Can't change size while VR device is presenting.");return}We=v,q=P,t.width=Math.floor(v*Q),t.height=Math.floor(P*Q),H===!0&&(t.style.width=v+"px",t.style.height=P+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,v,P)},this.getDrawingBufferSize=function(v){return v.set(We*Q,q*Q).floor()},this.setDrawingBufferSize=function(v,P,H){We=v,q=P,Q=H,t.width=Math.floor(v*H),t.height=Math.floor(P*H),this.setViewport(0,0,v,P)},this.setEffects=function(v){if(_===Gt){Ie("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let P=0;P<v.length;P++)if(v[P].isOutputPass===!0){Re("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(ee)},this.getViewport=function(v){return v.copy(me)},this.setViewport=function(v,P,H,F){v.isVector4?me.set(v.x,v.y,v.z,v.w):me.set(v,P,H,F),p.viewport(ee.copy(me).multiplyScalar(Q).round())},this.getScissor=function(v){return v.copy(Fe)},this.setScissor=function(v,P,H,F){v.isVector4?Fe.set(v.x,v.y,v.z,v.w):Fe.set(v,P,H,F),p.scissor(Ae.copy(Fe).multiplyScalar(Q).round())},this.getScissorTest=function(){return dt},this.setScissorTest=function(v){p.setScissorTest(dt=v)},this.setOpaqueSort=function(v){re=v},this.setTransparentSort=function(v){Pe=v},this.getClearColor=function(v){return v.copy(Oe.getClearColor())},this.setClearColor=function(){Oe.setClearColor(...arguments)},this.getClearAlpha=function(){return Oe.getClearAlpha()},this.setClearAlpha=function(){Oe.setClearAlpha(...arguments)},this.clear=function(v=!0,P=!0,H=!0){let F=0;if(v){let O=!1;if(ne!==null){let pe=ne.texture.format;O=g.has(pe)}if(O){let pe=ne.texture.type,ve=d.has(pe),fe=Oe.getClearColor(),ye=Oe.getClearAlpha(),be=fe.r,Ve=fe.g,Ye=fe.b;ve?(w[0]=be,w[1]=Ve,w[2]=Ye,w[3]=ye,E.clearBufferuiv(E.COLOR,0,w)):(R[0]=be,R[1]=Ve,R[2]=Ye,R[3]=ye,E.clearBufferiv(E.COLOR,0,R))}else F|=E.COLOR_BUFFER_BIT}P&&(F|=E.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),H&&(F|=E.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F!==0&&E.clear(F)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),z=v},this.dispose=function(){t.removeEventListener("webglcontextlost",at,!1),t.removeEventListener("webglcontextrestored",et,!1),t.removeEventListener("webglcontextcreationerror",qt,!1),Oe.dispose(),ue.dispose(),le.dispose(),B.dispose(),ie.dispose(),j.dispose(),ge.dispose(),te.dispose(),oe.dispose(),_e.dispose(),_e.removeEventListener("sessionstart",Ho),_e.removeEventListener("sessionend",Wo),Hn.stop()};function at(v){v.preventDefault(),vo("WebGLRenderer: Context Lost."),U=!0}function et(){vo("WebGLRenderer: Context Restored."),U=!1;let v=N.autoReset,P=Ce.enabled,H=Ce.autoUpdate,F=Ce.needsUpdate,O=Ce.type;Ee(),N.autoReset=v,Ce.enabled=P,Ce.autoUpdate=H,Ce.needsUpdate=F,Ce.type=O}function qt(v){Ie("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function nn(v){let P=v.target;P.removeEventListener("dispose",nn),Xc(P)}function Xc(v){qc(v),B.remove(v)}function qc(v){let P=B.get(v).programs;P!==void 0&&(P.forEach(function(H){oe.releaseProgram(H)}),v.isShaderMaterial&&oe.releaseShaderCache(v))}this.renderBufferDirect=function(v,P,H,F,O,pe){P===null&&(P=Le);let ve=O.isMesh&&O.matrixWorld.determinantAffine()<0,fe=Jc(v,P,H,F,O);p.setMaterial(F,ve);let ye=H.index,be=1;if(F.wireframe===!0){if(ye=Z.getWireframeAttribute(H),ye===void 0)return;be=2}let Ve=H.drawRange,Ye=H.attributes.position,Me=Ve.start*be,tt=(Ve.start+Ve.count)*be;pe!==null&&(Me=Math.max(Me,pe.start*be),tt=Math.min(tt,(pe.start+pe.count)*be)),ye!==null?(Me=Math.max(Me,0),tt=Math.min(tt,ye.count)):Ye!=null&&(Me=Math.max(Me,0),tt=Math.min(tt,Ye.count));let mt=tt-Me;if(mt<0||mt===1/0)return;ge.setup(O,F,fe,H,ye);let lt,rt=ce;if(ye!==null&&(lt=ae.get(ye),rt=K,rt.setIndex(lt)),O.isMesh)F.wireframe===!0?(p.setLineWidth(F.wireframeLinewidth*$e()),rt.setMode(E.LINES)):rt.setMode(E.TRIANGLES);else if(O.isLine){let bt=F.linewidth;bt===void 0&&(bt=1),p.setLineWidth(bt*$e()),O.isLineSegments?rt.setMode(E.LINES):O.isLineLoop?rt.setMode(E.LINE_LOOP):rt.setMode(E.LINE_STRIP)}else O.isPoints?rt.setMode(E.POINTS):O.isSprite&&rt.setMode(E.TRIANGLES);if(O.isBatchedMesh)if(je.get("WEBGL_multi_draw"))rt.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let bt=O._multiDrawStarts,xe=O._multiDrawCounts,Rt=O._multiDrawCount,Qe=ye?ae.get(ye).bytesPerElement:1,kt=B.get(F).currentProgram.getUniforms();for(let sn=0;sn<Rt;sn++)kt.setValue(E,"_gl_DrawID",sn),rt.render(bt[sn]/Qe,xe[sn])}else if(O.isInstancedMesh)rt.renderInstances(Me,mt,O.count);else if(H.isInstancedBufferGeometry){let bt=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,xe=Math.min(H.instanceCount,bt);rt.renderInstances(Me,mt,xe)}else rt.render(Me,mt)};function ko(v,P,H,F){z!==null&&v.isNodeMaterial&&z.setObject(F,v),Ke===!0&&we.setState(v,H,!1),v.transparent===!0&&v.side===hn&&v.forceSinglePass===!1?(v.side=Lt,v.needsUpdate=!0,bs(v,P,F),v.side=Bn,v.needsUpdate=!0,bs(v,P,F),v.side=hn):bs(v,P,F)}this.compile=function(v,P,H=null){H===null&&(H=v),z!==null&&z.renderStart(v,P,H),A=le.get(H),A.init(P),y.push(A),H.traverseVisible(function(O){O.isLight&&O.layers.test(P.layers)&&(A.pushLight(O),O.castShadow&&A.pushShadow(O))}),v!==H&&v.traverseVisible(function(O){O.isLight&&O.layers.test(P.layers)&&(A.pushLight(O),O.castShadow&&A.pushShadow(O))}),A.setupLights(),z!==null&&z.updateLights(A.state.lightsArray),Xe=this.localClippingEnabled,Ke=we.init(this.clippingPlanes,Xe),Ke===!0&&we.setGlobalState(this.clippingPlanes,P),z!==null&&Ce.render(A.state.shadowsArray,H,P);let F=new Set;return v.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let pe=O.material;if(pe)if(Array.isArray(pe))for(let ve=0;ve<pe.length;ve++){let fe=pe[ve];ko(fe,H,P,O),F.add(fe)}else ko(pe,H,P,O),F.add(pe)}),A=y.pop(),z!==null&&z.renderEnd(),F},this.compileAsync=function(v,P,H=null){let F=this.compile(v,P,H);return new Promise(O=>{function pe(){if(F.forEach(function(ve){let ye=B.get(ve).currentProgram;(ye===void 0||ye.isReady())&&F.delete(ve)}),F.size===0){O(v);return}setTimeout(pe,10)}je.get("KHR_parallel_shader_compile")!==null?pe():setTimeout(pe,10)})};let ya=null;function Yc(v){ya&&ya(v)}function Ho(){Hn.stop()}function Wo(){Hn.start()}let Hn=new Pc;Hn.setAnimationLoop(Yc),typeof self<"u"&&Hn.setContext(self),this.setAnimationLoop=function(v){ya=v,_e.setAnimationLoop(v),v===null?Hn.stop():Hn.start()},_e.addEventListener("sessionstart",Ho),_e.addEventListener("sessionend",Wo),this.render=function(v,P){if(P!==void 0&&P.isCamera!==!0){Ie("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(U===!0)return;z!==null&&z.renderStart(v,P);let H=_e.enabled===!0&&_e.isPresenting===!0,F=T!==null&&(ne===null||H)&&T.begin(L,ne);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),P.parent===null&&P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),_e.enabled===!0&&_e.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(_e.cameraAutoUpdate===!0&&_e.updateCamera(P),P=_e.getCamera()),v.isScene===!0&&v.onBeforeRender(L,v,P,ne),A=le.get(v,y.length),A.init(P),A.state.textureUnits=X.getTextureUnits(),y.push(A),ke.multiplyMatrices(P.projectionMatrix,P.matrixWorldInverse),Ne.setFromProjectionMatrix(ke,jt,P.reversedDepth),Xe=this.localClippingEnabled,Ke=we.init(this.clippingPlanes,Xe),b=ue.get(v,C.length),b.init(),C.push(b),_e.enabled===!0&&_e.isPresenting===!0){let ve=L.xr.getDepthSensingMesh();ve!==null&&Ma(ve,P,-1/0,L.sortObjects)}Ma(v,P,0,L.sortObjects),b.finish(),z!==null&&z.updateLights(A.state.lightsArray),L.sortObjects===!0&&b.sort(re,Pe),qe=_e.enabled===!1||_e.isPresenting===!1||_e.hasDepthSensing()===!1,qe&&Oe.addToRenderList(b,v),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Ke===!0&&we.beginShadows();let O=A.state.shadowsArray;if(Ce.render(O,v,P),Ke===!0&&we.endShadows(),(F&&T.hasRenderPass())===!1){let ve=b.opaque,fe=b.transmissive;if(A.setupLights(),P.isArrayCamera){let ye=P.cameras;if(fe.length>0)for(let be=0,Ve=ye.length;be<Ve;be++){let Ye=ye[be];qo(ve,fe,v,Ye)}qe&&Oe.render(v);for(let be=0,Ve=ye.length;be<Ve;be++){let Ye=ye[be];Xo(b,v,Ye,Ye.viewport)}}else fe.length>0&&qo(ve,fe,v,P),qe&&Oe.render(v),Xo(b,v,P)}ne!==null&&Y===0&&(X.updateMultisampleRenderTarget(ne),X.updateRenderTargetMipmap(ne)),F&&T.end(L),v.isScene===!0&&v.onAfterRender(L,v,P),ge.resetDefaultState(),W=-1,$=null,y.pop(),y.length>0?(A=y[y.length-1],X.setTextureUnits(A.state.textureUnits),Ke===!0&&we.setGlobalState(L.clippingPlanes,A.state.camera)):A=null,C.pop(),C.length>0?b=C[C.length-1]:b=null,z!==null&&z.renderEnd()};function Ma(v,P,H,F){if(v.visible===!1)return;if(v.layers.test(P.layers)){if(v.isGroup)H=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(P);else if(v.isLightProbeGrid)A.pushLightProbeGrid(v);else if(v.isLight)A.pushLight(v),v.castShadow&&A.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||v.intersectsFrustum(Ne)){F&&Ue.setFromMatrixPosition(v.matrixWorld).applyMatrix4(ke);let ve=j.update(v),fe=v.material;fe.visible&&b.push(v,ve,fe,H,Ue.z,null,P)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||v.intersectsFrustum(Ne))){let ve=j.update(v),fe=v.material;if(F&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Ue.copy(v.boundingSphere.center)):(ve.boundingSphere===null&&ve.computeBoundingSphere(),Ue.copy(ve.boundingSphere.center)),Ue.applyMatrix4(v.matrixWorld).applyMatrix4(ke)),Array.isArray(fe)){let ye=ve.groups;for(let be=0,Ve=ye.length;be<Ve;be++){let Ye=ye[be],Me=fe[Ye.materialIndex];Me&&Me.visible&&b.push(v,ve,Me,H,Ue.z,Ye,P)}}else fe.visible&&b.push(v,ve,fe,H,Ue.z,null,P)}}let pe=v.children;for(let ve=0,fe=pe.length;ve<fe;ve++)Ma(pe[ve],P,H,F)}function Xo(v,P,H,F){let{opaque:O,transmissive:pe,transparent:ve}=v;A.setupLightsView(H),Ke===!0&&we.setGlobalState(L.clippingPlanes,H),F&&p.viewport(ee.copy(F)),O.length>0&&Ss(O,P,H),pe.length>0&&Ss(pe,P,H),ve.length>0&&Ss(ve,P,H),p.buffers.depth.setTest(!0),p.buffers.depth.setMask(!0),p.buffers.color.setMask(!0),p.setPolygonOffset(!1)}function qo(v,P,H,F){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[F.id]===void 0){let Me=je.has("EXT_color_buffer_half_float")||je.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[F.id]=new Dt(1,1,{generateMipmaps:!0,type:Me?tn:Gt,minFilter:Vn,samples:Math.max(4,S.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Ze.workingColorSpace})}let pe=A.state.transmissionRenderTarget[F.id],ve=F.viewport||ee;pe.setSize(ve.z*L.transmissionResolutionScale,ve.w*L.transmissionResolutionScale);let fe=L.getRenderTarget(),ye=L.getActiveCubeFace(),be=L.getActiveMipmapLevel();L.setRenderTarget(pe),L.getClearColor(it),He=L.getClearAlpha(),He<1&&L.setClearColor(16777215,.5),L.clear(),qe&&Oe.render(H);let Ve=L.toneMapping;L.toneMapping=Qt;let Ye=F.viewport;if(F.viewport!==void 0&&(F.viewport=void 0),A.setupLightsView(F),Ke===!0&&we.setGlobalState(L.clippingPlanes,F),Ss(v,H,F),X.updateMultisampleRenderTarget(pe),X.updateRenderTargetMipmap(pe),je.has("WEBGL_multisampled_render_to_texture")===!1){let Me=!1;for(let tt=0,mt=P.length;tt<mt;tt++){let lt=P[tt],{object:rt,geometry:bt,material:xe,group:Rt}=lt;if(xe.side===hn&&rt.layers.test(F.layers)){let Qe=xe.side;xe.side=Lt,xe.needsUpdate=!0,Yo(rt,H,F,bt,xe,Rt),xe.side=Qe,xe.needsUpdate=!0,Me=!0}}Me===!0&&(X.updateMultisampleRenderTarget(pe),X.updateRenderTargetMipmap(pe))}L.setRenderTarget(fe,ye,be),L.setClearColor(it,He),Ye!==void 0&&(F.viewport=Ye),L.toneMapping=Ve}function Ss(v,P,H){let F=P.isScene===!0?P.overrideMaterial:null;for(let O=0,pe=v.length;O<pe;O++){let ve=v[O],{object:fe,geometry:ye,group:be}=ve,Ve=ve.material;Ve.allowOverride===!0&&F!==null&&(Ve=F),fe.layers.test(H.layers)&&Yo(fe,P,H,ye,Ve,be)}}function Yo(v,P,H,F,O,pe){z!==null&&O.isNodeMaterial&&z.setObject(v,O),v.onBeforeRender(L,P,H,F,O,pe),v.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),O.onBeforeRender(L,P,H,F,v,pe),O.transparent===!0&&O.side===hn&&O.forceSinglePass===!1?(O.side=Lt,O.needsUpdate=!0,L.renderBufferDirect(H,P,F,O,v,pe),O.side=Bn,O.needsUpdate=!0,L.renderBufferDirect(H,P,F,O,v,pe),O.side=hn):L.renderBufferDirect(H,P,F,O,v,pe),v.onAfterRender(L,P,H,F,O,pe)}function bs(v,P,H){P.isScene!==!0&&(P=Le);let F=B.get(v),O=A.state.lights,pe=A.state.shadowsArray,ve=O.state.version,fe=oe.getParameters(v,O.state,pe,P,H,A.state.lightProbeGridArray),ye=oe.getProgramCacheKey(fe),be=F.programs;F.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?P.environment:null,F.fog=P.fog;let Ve=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;F.envMap=ie.get(v.envMap||F.environment,Ve),F.envMapRotation=F.environment!==null&&v.envMap===null?P.environmentRotation:v.envMapRotation,be===void 0&&(v.addEventListener("dispose",nn),be=new Map,F.programs=be);let Ye=be.get(ye);if(Ye!==void 0){if(F.currentProgram===Ye&&F.lightsStateVersion===ve)return Jo(v,fe),Ye}else fe.uniforms=oe.getUniforms(v),z!==null&&v.isNodeMaterial&&z.build(v,H,fe),v.onBeforeCompile(fe,L),Ye=oe.acquireProgram(fe,ye),be.set(ye,Ye),F.uniforms=fe.uniforms;let Me=F.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Me.clippingPlanes=we.uniform),Jo(v,fe),F.needsLights=jc(v),F.lightsStateVersion=ve,F.needsLights&&(Me.ambientLightColor.value=O.state.ambient,Me.lightProbe.value=O.state.probe,Me.sunLights.value=O.state.sun,Me.sunLightShadows.value=O.state.sunShadow,Me.directionalLights.value=O.state.directional,Me.directionalLightShadows.value=O.state.directionalShadow,Me.spotLights.value=O.state.spot,Me.spotLightShadows.value=O.state.spotShadow,Me.rectAreaLights.value=O.state.rectArea,Me.ltc_1.value=O.state.rectAreaLTC1,Me.ltc_2.value=O.state.rectAreaLTC2,Me.pointLights.value=O.state.point,Me.pointLightShadows.value=O.state.pointShadow,Me.hemisphereLights.value=O.state.hemi,Me.sunShadowMatrix.value=O.state.sunShadowMatrix,Me.sunShadowCascade.value=O.state.sunShadowCascade,Me.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Me.spotLightMatrix.value=O.state.spotLightMatrix,Me.spotLightMap.value=O.state.spotLightMap,Me.pointShadowMatrix.value=O.state.pointShadowMatrix),F.lightProbeGrid=A.state.lightProbeGridArray.length>0,F.currentProgram=Ye,F.uniformsList=null,Ye}function Zo(v){if(v.uniformsList===null){let P=v.currentProgram.getUniforms();v.uniformsList=Ni.seqWithValue(P.seq,v.uniforms)}return v.uniformsList}function Jo(v,P){let H=B.get(v);H.outputColorSpace=P.outputColorSpace,H.batching=P.batching,H.batchingColor=P.batchingColor,H.instancing=P.instancing,H.instancingColor=P.instancingColor,H.instancingMorph=P.instancingMorph,H.skinning=P.skinning,H.morphTargets=P.morphTargets,H.morphNormals=P.morphNormals,H.morphColors=P.morphColors,H.morphTargetsCount=P.morphTargetsCount,H.numClippingPlanes=P.numClippingPlanes,H.numIntersection=P.numClipIntersection,H.vertexAlphas=P.vertexAlphas,H.vertexTangents=P.vertexTangents,H.toneMapping=P.toneMapping}function Zc(v,P){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;M.setFromMatrixPosition(P.matrixWorld);for(let H=0,F=v.length;H<F;H++){let O=v[H];if(O.texture!==null&&O.boundingBox.containsPoint(M))return O}return null}function Jc(v,P,H,F,O){P.isScene!==!0&&(P=Le),X.resetTextureUnits();let pe=P.fog,ve=F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial?P.environment:null,fe=ne===null?L.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:Ze.workingColorSpace,ye=F.isMeshStandardMaterial||F.isMeshLambertMaterial&&!F.envMap||F.isMeshPhongMaterial&&!F.envMap,be=ie.get(F.envMap||ve,ye),Ve=F.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Ye=!!H.attributes.tangent&&(!!F.normalMap||F.anisotropy>0),Me=!!H.morphAttributes.position,tt=!!H.morphAttributes.normal,mt=!!H.morphAttributes.color,lt=Qt;F.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(lt=L.toneMapping);let rt=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,bt=rt!==void 0?rt.length:0,xe=B.get(F),Rt=A.state.lights;if(Ke===!0&&(Xe===!0||v!==$)){let ot=v===$&&F.id===W;we.setState(F,v,ot)}let Qe=!1;F.version===xe.__version?(xe.needsLights&&xe.lightsStateVersion!==Rt.state.version||xe.outputColorSpace!==fe||O.isBatchedMesh&&xe.batching===!1||!O.isBatchedMesh&&xe.batching===!0||O.isBatchedMesh&&xe.batchingColor===!0&&O._colorsTexture===null||O.isBatchedMesh&&xe.batchingColor===!1&&O._colorsTexture!==null||O.isInstancedMesh&&xe.instancing===!1||!O.isInstancedMesh&&xe.instancing===!0||O.isSkinnedMesh&&xe.skinning===!1||!O.isSkinnedMesh&&xe.skinning===!0||O.isInstancedMesh&&xe.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&xe.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&xe.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&xe.instancingMorph===!1&&O.morphTexture!==null||xe.envMap!==be||F.fog===!0&&xe.fog!==pe||xe.numClippingPlanes!==void 0&&(xe.numClippingPlanes!==we.numPlanes||xe.numIntersection!==we.numIntersection)||xe.vertexAlphas!==Ve||xe.vertexTangents!==Ye||xe.morphTargets!==Me||xe.morphNormals!==tt||xe.morphColors!==mt||xe.toneMapping!==lt||xe.morphTargetsCount!==bt||!!xe.lightProbeGrid!=A.state.lightProbeGridArray.length>0)&&(Qe=!0):(Qe=!0,xe.__version=F.version);let kt=xe.currentProgram;Qe===!0&&(kt=bs(F,P,O),z&&F.isNodeMaterial&&z.onUpdateProgram(F,kt,xe));let sn=!1,_n=!1,ti=!1,st=kt.getUniforms(),pt=xe.uniforms;if(p.useProgram(kt.program)&&(sn=!0,_n=!0,ti=!0),F.id!==W&&(W=F.id,_n=!0),xe.needsLights){let ot=Zc(A.state.lightProbeGridArray,O);xe.lightProbeGrid!==ot&&(xe.lightProbeGrid=ot,_n=!0)}if(sn||$!==v){p.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),st.setValue(E,"projectionMatrix",v.projectionMatrix),st.setValue(E,"viewMatrix",v.matrixWorldInverse);let bn=st.map.cameraPosition;bn!==void 0&&bn.setValue(E,se.setFromMatrixPosition(v.matrixWorld)),S.logarithmicDepthBuffer&&st.setValue(E,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(F.isMeshPhongMaterial||F.isMeshToonMaterial||F.isMeshLambertMaterial||F.isMeshBasicMaterial||F.isMeshStandardMaterial||F.isShaderMaterial)&&st.setValue(E,"isOrthographic",v.isOrthographicCamera===!0),$!==v&&($=v,_n=!0,ti=!0)}if(xe.needsLights&&(Rt.state.sunShadowMap.length>0&&st.setValue(E,"sunShadowMap",Rt.state.sunShadowMap,X),Rt.state.directionalShadowMap.length>0&&st.setValue(E,"directionalShadowMap",Rt.state.directionalShadowMap,X),Rt.state.spotShadowMap.length>0&&st.setValue(E,"spotShadowMap",Rt.state.spotShadowMap,X),Rt.state.pointShadowMap.length>0&&st.setValue(E,"pointShadowMap",Rt.state.pointShadowMap,X)),O.isSkinnedMesh){st.setOptional(E,O,"bindMatrix"),st.setOptional(E,O,"bindMatrixInverse");let ot=O.skeleton;ot&&(ot.boneTexture===null&&ot.computeBoneTexture(),st.setValue(E,"boneTexture",ot.boneTexture,X))}O.isBatchedMesh&&(st.setOptional(E,O,"batchingTexture"),st.setValue(E,"batchingTexture",O._matricesTexture,X),st.setOptional(E,O,"batchingIdTexture"),st.setValue(E,"batchingIdTexture",O._indirectTexture,X),st.setOptional(E,O,"batchingColorTexture"),O._colorsTexture!==null&&st.setValue(E,"batchingColorTexture",O._colorsTexture,X));let Sn=H.morphAttributes;if((Sn.position!==void 0||Sn.normal!==void 0||Sn.color!==void 0)&&I.update(O,H,kt),(_n||xe.receiveShadow!==O.receiveShadow)&&(xe.receiveShadow=O.receiveShadow,st.setValue(E,"receiveShadow",O.receiveShadow)),(F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial)&&F.envMap===null&&P.environment!==null&&(pt.envMapIntensity.value=P.environmentIntensity),pt.dfgLUT!==void 0&&(pt.dfgLUT.value=Bm()),_n){if(st.setValue(E,"toneMappingExposure",L.toneMappingExposure),xe.needsLights&&Kc(pt,ti),pe&&F.fog===!0&&Te.refreshFogUniforms(pt,pe),Te.refreshMaterialUniforms(pt,F,Q,q,A.state.transmissionRenderTarget[v.id]),xe.needsLights&&xe.lightProbeGrid){let ot=xe.lightProbeGrid;pt.probesSH.value=ot.texture,pt.probesMin.value.copy(ot.boundingBox.min),pt.probesMax.value.copy(ot.boundingBox.max),pt.probesResolution.value.copy(ot.resolution)}Ni.upload(E,Zo(xe),pt,X)}if(F.isShaderMaterial&&F.uniformsNeedUpdate===!0&&(Ni.upload(E,Zo(xe),pt,X),F.uniformsNeedUpdate=!1),F.isSpriteMaterial&&st.setValue(E,"center",O.center),st.setValue(E,"modelViewMatrix",O.modelViewMatrix),st.setValue(E,"normalMatrix",O.normalMatrix),st.setValue(E,"modelMatrix",O.matrixWorld),F.uniformsGroups!==void 0){let ot=F.uniformsGroups;for(let bn=0,ni=ot.length;bn<ni;bn++){let jo=ot[bn];te.update(jo,kt),te.bind(jo,kt)}}return kt}function Kc(v,P){v.ambientLightColor.needsUpdate=P,v.lightProbe.needsUpdate=P,v.sunLights.needsUpdate=P,v.sunLightShadows.needsUpdate=P,v.directionalLights.needsUpdate=P,v.directionalLightShadows.needsUpdate=P,v.pointLights.needsUpdate=P,v.pointLightShadows.needsUpdate=P,v.spotLights.needsUpdate=P,v.spotLightShadows.needsUpdate=P,v.rectAreaLights.needsUpdate=P,v.hemisphereLights.needsUpdate=P}function jc(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return J},this.getActiveMipmapLevel=function(){return Y},this.getRenderTarget=function(){return ne},this.setRenderTargetTextures=function(v,P,H){let F=B.get(v);F.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,F.__autoAllocateDepthBuffer===!1&&(F.__useRenderToTexture=!1),B.get(v.texture).__webglTexture=P,B.get(v.depthTexture).__webglTexture=F.__autoAllocateDepthBuffer?void 0:H,F.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,P){let H=B.get(v);H.__webglFramebuffer=P,H.__useDefaultFramebuffer=P===void 0},this.setRenderTarget=function(v,P=0,H=0){ne=v,J=P,Y=H;let F=null,O=!1,pe=!1;if(v){let fe=B.get(v);if(fe.__useDefaultFramebuffer!==void 0){p.bindFramebuffer(E.FRAMEBUFFER,fe.__webglFramebuffer),ee.copy(v.viewport),Ae.copy(v.scissor),Se=v.scissorTest,p.viewport(ee),p.scissor(Ae),p.setScissorTest(Se),W=-1;return}else if(fe.__webglFramebuffer===void 0)X.setupRenderTarget(v);else if(fe.__hasExternalTextures)X.rebindTextures(v,B.get(v.texture).__webglTexture,B.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let Ve=v.depthTexture;if(fe.__boundDepthTexture!==Ve){if(Ve!==null&&B.has(Ve)&&(v.width!==Ve.image.width||v.height!==Ve.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");X.setupDepthRenderbuffer(v)}}let ye=v.texture;(ye.isData3DTexture||ye.isDataArrayTexture||ye.isCompressedArrayTexture)&&(pe=!0);let be=B.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(be[P])?F=be[P][H]:F=be[P],O=!0):v.samples>0&&X.useMultisampledRTT(v)===!1?F=B.get(v).__webglMultisampledFramebuffer:Array.isArray(be)?F=be[H]:F=be,ee.copy(v.viewport),Ae.copy(v.scissor),Se=v.scissorTest}else ee.copy(me).multiplyScalar(Q).floor(),Ae.copy(Fe).multiplyScalar(Q).floor(),Se=dt;if(H!==0&&(F=k),p.bindFramebuffer(E.FRAMEBUFFER,F)&&p.drawBuffers(v,F),p.viewport(ee),p.scissor(Ae),p.setScissorTest(Se),O){let fe=B.get(v.texture);E.framebufferTexture2D(E.FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_CUBE_MAP_POSITIVE_X+P,fe.__webglTexture,H)}else if(pe){let fe=P;for(let ye=0;ye<v.textures.length;ye++){let be=B.get(v.textures[ye]);E.framebufferTextureLayer(E.FRAMEBUFFER,E.COLOR_ATTACHMENT0+ye,be.__webglTexture,H,fe)}}else if(v!==null&&H!==0){let fe=B.get(v.texture);E.framebufferTexture2D(E.FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_2D,fe.__webglTexture,H)}W=-1};function Ko(v){let P=B.get(v);return(P.__readFormat!==v.format||P.__readType!==v.type)&&(P.__readFormat=v.format,P.__readType=v.type,P.__formatReadable=S.textureFormatReadable(v.format),P.__typeReadable=S.textureTypeReadable(v.type)),P}this.readRenderTargetPixels=function(v,P,H,F,O,pe,ve,fe=0){if(!(v&&v.isWebGLRenderTarget)){Ie("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ye=B.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ve!==void 0&&(ye=ye[ve]),ye){p.bindFramebuffer(E.FRAMEBUFFER,ye);try{let be=v.textures[fe],Ve=be.format,Ye=be.type;v.textures.length>1&&E.readBuffer(E.COLOR_ATTACHMENT0+fe);let Me=Ko(be);if(Me.__formatReadable===!1){Ie("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Me.__typeReadable===!1){Ie("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}P>=0&&P<=v.width-F&&H>=0&&H<=v.height-O&&E.readPixels(P,H,F,O,he.convert(Ve),he.convert(Ye),pe)}finally{let be=ne!==null?B.get(ne).__webglFramebuffer:null;p.bindFramebuffer(E.FRAMEBUFFER,be)}}},this.readRenderTargetPixelsAsync=async function(v,P,H,F,O,pe,ve,fe=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ye=B.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ve!==void 0&&(ye=ye[ve]),ye)if(P>=0&&P<=v.width-F&&H>=0&&H<=v.height-O){p.bindFramebuffer(E.FRAMEBUFFER,ye);let be=v.textures[fe],Ve=be.format,Ye=be.type;v.textures.length>1&&E.readBuffer(E.COLOR_ATTACHMENT0+fe);let Me=Ko(be);if(Me.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Me.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let tt=E.createBuffer();E.bindBuffer(E.PIXEL_PACK_BUFFER,tt),E.bufferData(E.PIXEL_PACK_BUFFER,pe.byteLength,E.STREAM_READ),E.readPixels(P,H,F,O,he.convert(Ve),he.convert(Ye),0),E.bindBuffer(E.PIXEL_PACK_BUFFER,null);let mt=ne!==null?B.get(ne).__webglFramebuffer:null;p.bindFramebuffer(E.FRAMEBUFFER,mt);let lt=E.fenceSync(E.SYNC_GPU_COMMANDS_COMPLETE,0);return E.flush(),await ic(E,lt,4),E.bindBuffer(E.PIXEL_PACK_BUFFER,tt),E.getBufferSubData(E.PIXEL_PACK_BUFFER,0,pe),E.bindBuffer(E.PIXEL_PACK_BUFFER,null),E.deleteBuffer(tt),E.deleteSync(lt),pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,P=null,H=0){let F=Math.pow(2,-H),O=Math.floor(v.image.width*F),pe=Math.floor(v.image.height*F),ve=P!==null?P.x:0,fe=P!==null?P.y:0;X.setTexture2D(v,0),E.copyTexSubImage2D(E.TEXTURE_2D,H,0,0,ve,fe,O,pe),p.unbindTexture()},this.copyTextureToTexture=function(v,P,H=null,F=null,O=0,pe=0){let ve,fe,ye,be,Ve,Ye,Me,tt,mt,lt=v.isCompressedTexture?v.mipmaps[pe]:v.image;if(H!==null)ve=H.max.x-H.min.x,fe=H.max.y-H.min.y,ye=H.isBox3?H.max.z-H.min.z:1,be=H.min.x,Ve=H.min.y,Ye=H.isBox3?H.min.z:0;else{let pt=Math.pow(2,-O);ve=Math.floor(lt.width*pt),fe=Math.floor(lt.height*pt),v.isDataArrayTexture?ye=lt.depth:v.isData3DTexture?ye=Math.floor(lt.depth*pt):ye=1,be=0,Ve=0,Ye=0}F!==null?(Me=F.x,tt=F.y,mt=F.z):(Me=0,tt=0,mt=0);let rt=he.convert(P.format),bt=he.convert(P.type),xe;P.isData3DTexture?(X.setTexture3D(P,0),xe=E.TEXTURE_3D):P.isDataArrayTexture||P.isCompressedArrayTexture?(X.setTexture2DArray(P,0),xe=E.TEXTURE_2D_ARRAY):(X.setTexture2D(P,0),xe=E.TEXTURE_2D),p.activeTexture(E.TEXTURE0),p.pixelStorei(E.UNPACK_FLIP_Y_WEBGL,P.flipY),p.pixelStorei(E.UNPACK_PREMULTIPLY_ALPHA_WEBGL,P.premultiplyAlpha),p.pixelStorei(E.UNPACK_ALIGNMENT,P.unpackAlignment);let Rt=p.getParameter(E.UNPACK_ROW_LENGTH),Qe=p.getParameter(E.UNPACK_IMAGE_HEIGHT),kt=p.getParameter(E.UNPACK_SKIP_PIXELS),sn=p.getParameter(E.UNPACK_SKIP_ROWS),_n=p.getParameter(E.UNPACK_SKIP_IMAGES);p.pixelStorei(E.UNPACK_ROW_LENGTH,lt.width),p.pixelStorei(E.UNPACK_IMAGE_HEIGHT,lt.height),p.pixelStorei(E.UNPACK_SKIP_PIXELS,be),p.pixelStorei(E.UNPACK_SKIP_ROWS,Ve),p.pixelStorei(E.UNPACK_SKIP_IMAGES,Ye);let ti=v.isDataArrayTexture||v.isData3DTexture,st=P.isDataArrayTexture||P.isData3DTexture;if(v.isDepthTexture){let pt=B.get(v),Sn=B.get(P),ot=B.get(pt.__renderTarget),bn=B.get(Sn.__renderTarget);p.bindFramebuffer(E.READ_FRAMEBUFFER,ot.__webglFramebuffer),p.bindFramebuffer(E.DRAW_FRAMEBUFFER,bn.__webglFramebuffer);for(let ni=0;ni<ye;ni++)ti&&(E.framebufferTextureLayer(E.READ_FRAMEBUFFER,E.COLOR_ATTACHMENT0,B.get(v).__webglTexture,O,Ye+ni),E.framebufferTextureLayer(E.DRAW_FRAMEBUFFER,E.COLOR_ATTACHMENT0,B.get(P).__webglTexture,pe,mt+ni)),E.blitFramebuffer(be,Ve,ve,fe,Me,tt,ve,fe,E.DEPTH_BUFFER_BIT,E.NEAREST);p.bindFramebuffer(E.READ_FRAMEBUFFER,null),p.bindFramebuffer(E.DRAW_FRAMEBUFFER,null)}else if(O!==0||v.isRenderTargetTexture||B.has(v)){let pt=B.get(v),Sn=B.get(P);p.bindFramebuffer(E.READ_FRAMEBUFFER,D),p.bindFramebuffer(E.DRAW_FRAMEBUFFER,V);for(let ot=0;ot<ye;ot++)ti?E.framebufferTextureLayer(E.READ_FRAMEBUFFER,E.COLOR_ATTACHMENT0,pt.__webglTexture,O,Ye+ot):E.framebufferTexture2D(E.READ_FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_2D,pt.__webglTexture,O),st?E.framebufferTextureLayer(E.DRAW_FRAMEBUFFER,E.COLOR_ATTACHMENT0,Sn.__webglTexture,pe,mt+ot):E.framebufferTexture2D(E.DRAW_FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_2D,Sn.__webglTexture,pe),O!==0?E.blitFramebuffer(be,Ve,ve,fe,Me,tt,ve,fe,E.COLOR_BUFFER_BIT,E.NEAREST):st?E.copyTexSubImage3D(xe,pe,Me,tt,mt+ot,be,Ve,ve,fe):E.copyTexSubImage2D(xe,pe,Me,tt,be,Ve,ve,fe);p.bindFramebuffer(E.READ_FRAMEBUFFER,null),p.bindFramebuffer(E.DRAW_FRAMEBUFFER,null)}else st?v.isDataTexture||v.isData3DTexture?E.texSubImage3D(xe,pe,Me,tt,mt,ve,fe,ye,rt,bt,lt.data):P.isCompressedArrayTexture?E.compressedTexSubImage3D(xe,pe,Me,tt,mt,ve,fe,ye,rt,lt.data):E.texSubImage3D(xe,pe,Me,tt,mt,ve,fe,ye,rt,bt,lt):v.isDataTexture?E.texSubImage2D(E.TEXTURE_2D,pe,Me,tt,ve,fe,rt,bt,lt.data):v.isCompressedTexture?E.compressedTexSubImage2D(E.TEXTURE_2D,pe,Me,tt,lt.width,lt.height,rt,lt.data):E.texSubImage2D(E.TEXTURE_2D,pe,Me,tt,ve,fe,rt,bt,lt);p.pixelStorei(E.UNPACK_ROW_LENGTH,Rt),p.pixelStorei(E.UNPACK_IMAGE_HEIGHT,Qe),p.pixelStorei(E.UNPACK_SKIP_PIXELS,kt),p.pixelStorei(E.UNPACK_SKIP_ROWS,sn),p.pixelStorei(E.UNPACK_SKIP_IMAGES,_n),pe===0&&P.generateMipmaps&&E.generateMipmap(xe),p.unbindTexture()},this.initRenderTarget=function(v){B.get(v).__webglFramebuffer===void 0&&X.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?X.setTextureCube(v,0):v.isData3DTexture?X.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?X.setTexture2DArray(v,0):X.setTexture2D(v,0),p.unbindTexture()},this.resetState=function(){J=0,Y=0,ne=null,p.reset(),ge.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return jt}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Ze._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ze._getUnpackColorSpace()}};var Oc="data:image/png;base64,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",Bc="data:image/png;base64,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",zc="data:image/png;base64,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";var Vo=4054167,Vc=14087167,Wc=3123455,Gc={ruhe:{brauen:0,stirn:0,laecheln:0,licht:.95,farbe:null,staerke:0,puls:0,stroeme:0},zuhoeren:{brauen:.35,stirn:0,laecheln:.08,licht:1,farbe:Vo,staerke:.9,puls:0,stroeme:0},denken:{brauen:0,stirn:.35,laecheln:0,licht:.98,farbe:null,staerke:0,puls:0,stroeme:1},sprechen:{brauen:.08,stirn:0,laecheln:.05,licht:1.02,farbe:null,staerke:0,puls:0,stroeme:0},warnung:{brauen:.1,stirn:.3,laecheln:0,licht:1,farbe:16758087,staerke:.6,puls:1,stroeme:0}},kc=.32,Hc={rest:[0,0,0,0,0],A:[1,0,0,0,0],O:[0,1,0,0,0],E:[0,0,.8,0,0],M:[0,0,0,1,0],F:[0,0,0,0,1],N:[.4,0,.3,0,0]},Gm={aa:"A",E:"E",I:"E",O:"O",U:"O",PP:"M",FF:"F",TH:"N",SS:"E",DD:"N",kk:"N",CH:"E",nn:"N",RR:"N",sil:"rest"},km=[[/kalender|wochenplan/,5088255],[/erinner/,6211839],[/notiz/,8378111],[/kontakt|geburtstag/,9425151],[/frist|vergessen/,16733288],[/post|brief/,16758087],[/mail|schreibstil/,16762219],[/steuer|vertrag|beihilfe/,15913323],[/archiv|datei|dokument/,4054167],[/youtube|video/,11767039],[/web|recherche|projekt/,10325247],[/word|excel|pptx|office/,6219464],[/wetter/,10479871],[/gedaechtnis|vorgang/,13215999],[/bild|skizze|anzeige/,8385535],[/tesla|ford|immo|nebenkosten/,9429936]];function Hm(i){let e=i.toLowerCase();return"a\xE1".includes(e)?"A":"o\xF3u\xFA\xF6".includes(e)?"O":"e\xE9i\xED\xE4\xFCy".includes(e)?"E":"mbp".includes(e)?"M":"fvw".includes(e)?"F":/[a-zß]/.test(e)?"N":"rest"}var Wm=`
attribute vec2 aPos; attribute float aZufall;
uniform sampler2D uT1, uT2, uT3; uniform vec4 uFace; uniform float uZeit, uBereit, uAtmen, uHex, uTiefe, uTexel, uWind; uniform vec2 uBlick;
uniform float uA, uO, uE, uM, uF, uSmile, uStirn, uBrauen;
varying vec3 vN; varying vec2 vUv, vNeig; varying float vL, vMaske, vSeite;
#define D(v) (((v) - 0.5) / 0.6)
float probe(vec2 uv) {
  vec3 a = texture2D(uT1, uv).rgb, b = texture2D(uT2, uv).rgb, c = texture2D(uT3, uv).rgb;
  return a.r + uA * D(a.g) + uO * D(a.b) + uE * D(b.r) + uM * D(b.g) + uF * D(b.b)
       + uSmile * D(c.r) + uStirn * D(c.g) + uBrauen * D(c.b);
}
float gesicht(vec2 uv, out float maske) {
  maske = 0.;
  if (uv.x < -0.02 || uv.x > 1.02 || uv.y < -0.02 || uv.y > 1.02) return 0.;
  // weich gezeichnet: Mittel aus f\xFCnf Proben \u2013 abstrakter, ohne harte Details
  vec2 o = vec2(uTexel * 2.2, 0.), q = vec2(0., uTexel * 2.2);
  float l = (probe(uv) * 2. + probe(uv + o) + probe(uv - o) + probe(uv + q) + probe(uv - q)) / 6.;
  maske = smoothstep(0.08, 0.7, l) * smoothstep(-0.02, 0.06, min(min(uv.x, 1. - uv.x), min(uv.y, 1. - uv.y)));
  return clamp(l, 0., 1.);
}
// Wabern: weiche W\xF6lbungen treiben wie eine z\xE4he Masse ziellos \xFCber den Teppich (Lissajous-Bahnen, verschiedene
// Gr\xF6\xDFen und Tempi), dazu ein Feld aus sich langsam drehenden Wellen \u2013 keine Vorzugsrichtung, kein Links-nach-rechts
float buckel(vec2 p, vec2 c, float r) { vec2 q = (p - c) / r; return exp(-dot(q, q)); }
float wind(vec2 p, float t) {
  float R = uHex;
  float s = buckel(p, R * vec2(0.9 * sin(t * 0.13), 0.7 * cos(t * 0.11 + 1.3)), R * 0.55)
          - buckel(p, R * vec2(1.1 * cos(t * 0.09 + 2.1), 0.8 * sin(t * 0.15 + 0.4)), R * 0.65)
          + buckel(p, R * vec2(1.4 * sin(t * 0.07 + 4.0), 0.9 * sin(t * 0.12 + 2.6)), R * 0.45)
          - buckel(p, R * vec2(0.6 * cos(t * 0.17 + 5.2), 1.0 * cos(t * 0.08 + 3.3)), R * 0.4)
          + 0.7 * buckel(p, R * vec2(1.6 * cos(t * 0.05 + 0.7), 1.1 * sin(t * 0.06 + 5.0)), R * 0.8);
  float a1 = t * 0.031, a2 = -t * 0.023 + 2.;
  vec2 d1 = vec2(cos(a1), sin(a1)), d2 = vec2(cos(a2), sin(a2));
  float w = sin(dot(p, d1) * 0.05 + sin(dot(p, d2) * 0.04 + t * 0.35) * 1.4 + t * 0.27)
          * sin(dot(p, d2) * 0.045 - t * 0.21);
  return s * 1.1 + w * 0.45;
}
void main() {
  // Blick folgt der Maus: Gesicht r\xFCckt leicht in die Richtung, die Mitte etwas mehr als der Rand (angedeutete Drehung)
  vec2 uv = (aPos - uFace.xy - uBlick * uFace.zw * vec2(0.03, 0.025)) / uFace.zw + 0.5;
  uv -= uBlick * vec2(0.03, 0.022) * (1. - 4. * (uv - 0.5) * (uv - 0.5));
  float maske; float l = gesicht(uv, maske);
  float d = length(aPos - uFace.xy) / (uHex * 1.3);
  float k = clamp(uBereit * 1.7 - d * 0.7, 0., 1.); k = k * k * (3. - 2. * k);     // Auftauchen von innen nach au\xDFen
  float eigen = sin(uZeit * (0.55 + aZufall * 0.35) + aZufall * 6.2832);
  float atmen = 1. + uAtmen * 0.04 * sin(uZeit * 6.2832 / 4.6);
  float A = uAtmen * uWind;
  float tw = uZeit * 2.4;                                              // deutlich lebhafter als zuvor
  float w = wind(aPos, tw);
  vec2 g = vec2(wind(aPos + vec2(1., 0.), tw) - wind(aPos - vec2(1., 0.), tw),
                wind(aPos + vec2(0., 1.), tw) - wind(aPos - vec2(0., 1.), tw)) * 0.5;
  vNeig = g * A * k * (1. - 0.45 * maske);                                                   // Neigung der Kacheln \u2192 Licht
  float relief = maske * (0.3 + 0.7 * smoothstep(0.25, 0.95, l));
  float h = (relief * uTiefe * atmen + A * w * (1. - 0.45 * maske) + uAtmen * eigen * 0.25) * k;   // Gesicht bleibt lesbar
  vMaske = maske;
  float ton = 0.2 + 0.3 * smoothstep(0.3, 0.97, l);                  // Gesicht nur wenig heller als der Teppich
  vL = mix(0.2, ton, vMaske) + aZufall * 0.04 + uAtmen * eigen * 0.025;
  vec3 pos = position; pos.xy += aPos; pos.z += h;
  vN = normal; vSeite = 1. - step(0.5, normal.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  vUv = vec2(position.x, position.y) / 0.88 + 0.5;
}`,Xm=`
uniform vec3 uFarbe, uTint; uniform float uTintStaerke, uLicht, uPuls, uZeit;
varying vec3 vN; varying vec2 vUv, vNeig; varying float vL, vMaske, vSeite;
void main() {
  vec3 licht = normalize(vec3(-0.45, 0.6, 0.75));
  float dif = max(dot(normalize(vN), licht), 0.);
  vec3 nv = normalize(vec3(-vNeig * 9., 1.));                          // geneigte Oberseite (Wind)
  float neig = (0.45 + 0.75 * max(dot(nv, licht), 0.)) / (0.45 + 0.75 * licht.z);
  float rand = min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y));
  float fase = smoothstep(0.0, 0.18, rand);
  float kante = (1. - fase) * ((vUv.y > vUv.x) ? 0.4 : -0.35);       // Fase: oben links hell, unten rechts dunkel
  float kissen = 1. + 0.16 * ((vUv.y - 0.5) - (vUv.x - 0.5));
  float hell = (0.32 + 1.35 * pow(vL, 1.3)) * (vSeite > 0.5 ? (0.2 + 0.5 * dif) : (1. + kante) * kissen * neig);
  hell *= 0.6 * uLicht;                                                // insgesamt dunkel (Plexus)
  vec3 c = mix(uFarbe, uTint, uTintStaerke * (0.12 + 0.88 * vMaske)) * hell;   // T\xF6nung vor allem im Gesicht
  c *= 1. + uPuls * 0.12 * pow(0.5 + 0.5 * sin(uZeit * 4.5), 4.);
  gl_FragColor = vec4(c, 1.);
}`,Go=class{constructor(e){this.N=7e3,this.pos=new Float32Array(this.N*3),this.alpha=new Float32Array(this.N),this.farbe=new Float32Array(this.N*3),this.data=new Array(this.N),this.next=0;let t=new Nt;t.setAttribute("position",new St(this.pos,3)),t.setAttribute("alpha",new St(this.alpha,1)),t.setAttribute("farbe",new St(this.farbe,3)),this.u={uPx:{value:6}},this.punkte=new es(t,new Et({uniforms:this.u,transparent:!0,depthWrite:!1,depthTest:!1,blending:hs,vertexShader:`uniform float uPx; attribute float alpha; attribute vec3 farbe; varying float vA; varying vec3 vF;
        void main(){ vA = alpha; vF = farbe; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_PointSize = uPx * (0.7 + alpha * 1.1); }`,fragmentShader:`varying float vA; varying vec3 vF; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard;
        gl_FragColor = vec4(vF, smoothstep(.5, 0., d) * vA); }`})),this.punkte.frustumCulled=!1,this.punkte.renderOrder=2,e.add(this.punkte),this.grenzen={w:50,h:40,rx:20,ry:26,z:3}}spawn(e,t,n=160){let{w:s,h:r,rx:a,ry:o,z:l,fh:c=o/.47}=this.grenzen,u=Math.cos(e),f=Math.sin(e),h=Math.hypot(s,r)*1.02,m=new Be(u*h,f*h),x=new Be((Math.random()-.5)*a*.5,c*(.27+Math.random()*.06)),_=u>=0?1:-1,g=f>.3?new Be(u*h*.45,Math.max(f*h*.55,o*1.4)):new Be(_*a*(1.45+Math.random()*.35),o*(1.25+Math.random()*.4)),d=new ze(t).lerp(new ze(Wc),.45).multiplyScalar(.75);for(let w=0;w<n;w++){let R=this.next;this.next=(this.next+1)%this.N,this.data[R]={t:-w*.006-Math.random()*.05,sp:.45+Math.random()*.2,start:m,ctrl:g,ende:x,z:l,off:new Be((Math.random()-.5)*2.4,(Math.random()-.5)*2.4)},this.farbe.set([d.r,d.g,d.b],R*3)}this.punkte.geometry.attributes.farbe.needsUpdate=!0}update(e){let{rx:t,ry:n,fh:s=n/.47}=this.grenzen;for(let r=0;r<this.N;r++){let a=this.data[r];if(!a){this.alpha[r]&&(this.alpha[r]=0);continue}if(a.t+=e*a.sp,a.t>1){this.data[r]=null,this.alpha[r]=0;continue}let o=Math.max(0,a.t),l=1-o,c=a.start.x*l*l+a.ctrl.x*2*l*o+a.ende.x*o*o+a.off.x*l,u=a.start.y*l*l+a.ctrl.y*2*l*o+a.ende.y*o*o+a.off.y*l;this.pos.set([c,u,a.z],r*3);let f=(c/t)**2+(u/n)**2,h=Math.min(1,Math.max(0,(f-1)/.35)),m=Math.min(1,Math.max(0,(u-s*.16)/(s*.08))),x=Math.max(h,m*.55*(1-Math.max(0,(o-.8)/.2)));this.alpha[r]=a.t<0?0:Math.sin(o*Math.PI*.5+.2)*x*.5}this.punkte.geometry.attributes.position.needsUpdate=!0,this.punkte.geometry.attributes.alpha.needsUpdate=!0}aktiv(){return this.data.some(Boolean)}};function qm(i,{qualitaet:e="hoch"}={}){let t=e==="niedrig",n=new ga({antialias:!t,alpha:!1,powerPreference:"high-performance"}),s=[2,1.5,1.25,1],r=s.findIndex(se=>se<=Math.min(devicePixelRatio||1,t?1.5:2));r<0&&(r=s.length-1);let a="auto",o=0,l=()=>Math.min(devicePixelRatio||1,s[a==="sparsam"?Math.max(r,2):r]);n.setPixelRatio(l()),n.setClearColor(66826,1),n.domElement.className="mosaik-cv",i.appendChild(n.domElement);let c=new Zi,u=24,f=new wt(u,1,1,4e3),h=se=>{let Ue=new rs().load(se);return Ue.minFilter=xt,Ue.magFilter=xt,Ue},m=[h(Oc),h(Bc),h(zc)],x={uT1:{value:m[0]},uT2:{value:m[1]},uT3:{value:m[2]},uTexel:{value:1/376},uFace:{value:new ht(0,0,50,60)},uZeit:{value:0},uBereit:{value:0},uAtmen:{value:1},uHex:{value:40},uTiefe:{value:5},uWind:{value:1.2},uBlick:{value:new Be},uA:{value:0},uO:{value:0},uE:{value:0},uM:{value:0},uF:{value:0},uSmile:{value:0},uBrauen:{value:0},uStirn:{value:0},uFarbe:{value:new ze(Wc)},uTint:{value:new ze(Vo)},uTintStaerke:{value:0},uLicht:{value:.95},uPuls:{value:0}},_=new Et({uniforms:x,vertexShader:Wm,fragmentShader:Xm}),g=new Nn(.88,.88,10);g.translate(0,0,-5);let d=new Go(c),w=null,R=0;function M(se,Ue){R=t?se<Ue?150:96:se<Ue?190:150;let Le=Math.ceil(R*se/Ue)+2,qe=Le*(R+2);w&&(c.remove(w),w.geometry.dispose());let $e=new ls().copy(g);$e.instanceCount=qe;let E=new Float32Array(qe*2),ut=new Float32Array(qe),je=0;for(let B=0;B<R+2;B++)for(let X=0;X<Le;X++)E[je*2]=X-(Le-1)/2,E[je*2+1]=B-(R+1)/2,ut[je]=Math.random(),je++;$e.setAttribute("aPos",new Ti(E,2)),$e.setAttribute("aZufall",new Ti(ut,1)),w=new Ut($e,_),w.frustumCulled=!1,c.add(w);let S=Math.min(R*.47,R*se/Ue*.47/.866);x.uHex.value=S;let p=2*S*.86,N=p*.6383;x.uFace.value.set(0,0,N,p),x.uTiefe.value=R*.034,x.uWind.value=R*.032,f.position.set(0,0,R/2/Math.tan(Mo.degToRad(u/2))),f.far=f.position.z+100,f.near=1,d.grenzen={w:R*se/Ue/2,h:R/2,rx:N*.47,ry:p*.47,fh:p,z:x.uTiefe.value+2},d.u.uPx.value=Math.max(3,Ue/R*n.getPixelRatio()*1.5)}function b(){let se=i.getBoundingClientRect(),Ue=Math.max(1,se.width),Le=Math.max(1,se.height);n.setPixelRatio(l()),n.setSize(Ue,Le,!1),f.aspect=Ue/Le,f.updateProjectionMatrix(),M(Ue,Le)}let A=new ResizeObserver(b);A.observe(i),b();let C=matchMedia("(prefers-reduced-motion: reduce)"),y=new Be,T=new Be,L=se=>{T.set((se.clientX/innerWidth-.5)*2,-(se.clientY/innerHeight-.5)*2)};addEventListener("pointermove",L,{passive:!0});let U=!1,z=0,k=0,D=performance.now(),V=0,J=1,Y=1.4,ne=0,W="ruhe",$=0,ee=-1e9,Ae=0,Se="rest",it=-1e9,He=0,We=[],q=0,Q=70,re={a:0,o:0,e:0,m:0,f:0,smile:0,brauen:0,stirn:0,licht:.95,staerke:0,puls:0},Pe=0,me=0,Fe=0,dt=0,Ne=60,Ke=new ze(Vo),Xe=(se,Ue,Le,qe)=>{re[se]+=(Ue-re[se])*(1-Math.exp(-qe*Le))};function ke(se){if(U)return;if(z=requestAnimationFrame(ke),document.hidden){k=0;return}let Ue=W==="ruhe"&&!d.punkte.visible&&se>ne;if(Ne=o>=2?24:Ue?o>=1?20:30:60,(a==="sparsam"||t)&&(Ne=Math.min(Ne,30)),k&&se-k<1e3/Ne-1)return;let Le=Math.min(.1,(se-(k||se))/1e3);k=se;let qe=(se-D)/1e3,$e=C.matches,E=Gc[W],ut="rest";if(W==="sprechen")if(se-it<250)ut=Se;else if(We.length){let B=Math.floor((se-q)/Q);ut=B<We.length?We[B]:"rest"}else ut=Math.floor(qe*6)%3?"A":"E";let S=se<ne?.45+.4*Math.abs(Math.sin(qe*8.3)*Math.sin(qe*3.1+1)):se-ee<300?Math.min(1,$*1.5):W==="sprechen"?.55:0;Ae+=(S-Ae)*(1-Math.exp(-Le*12));let p=Hc[ut]||Hc.rest,N=W==="sprechen"?(.35+.65*Ae)*kc:0;Xe("a",p[0]*N,10,Le),Xe("o",p[1]*N,10,Le),Xe("e",p[2]*N,10,Le),Xe("m",p[3]*(W==="sprechen"?kc:0),12,Le),Xe("f",p[4]*N,10,Le),Xe("smile",E.laecheln,2.5,Le),Xe("brauen",E.brauen,2.5,Le),Xe("stirn",E.stirn,2.5,Le),Xe("licht",E.licht,2.5,Le),Xe("staerke",E.staerke,2.2,Le),Xe("puls",E.puls,3,Le),E.farbe!==null&&Ke.lerp(new ze(E.farbe),1-Math.exp(-Le*4)),E.stroeme&&!$e&&(He+=Le,He>.38&&(He=0,d.spawn(Math.random()*Math.PI*2,Vc,70))),d.update(Le),d.punkte.visible=d.aktiv(),x.uZeit.value=qe,x.uAtmen.value=$e?0:1,y.lerp($e?T.clone().multiplyScalar(0):T,1-Math.exp(-Le*2.2)),x.uBlick.value.copy(y),V+=(J-V)*(1-Math.exp(-Le*Y)),x.uBereit.value=Math.min(1,V*1.02),x.uA.value=re.a,x.uO.value=re.o,x.uE.value=re.e,x.uM.value=re.m,x.uF.value=re.f,x.uSmile.value=re.smile,x.uBrauen.value=re.brauen,x.uStirn.value=re.stirn,x.uLicht.value=re.licht,x.uTintStaerke.value=re.staerke,x.uPuls.value=re.puls,x.uTint.value.copy(Ke),n.render(c,f),Pe++,me+=Le,me>3&&(Fe=Math.round(Pe/me),Pe=0,me=0,a==="auto"&&!$e&&Fe<Math.min(40,Ne*.7)&&r<s.length-1?++dt>=2&&(r++,dt=0,b()):dt=0)}return z=requestAnimationFrame(ke),{zustand(se){if(!Gc[se])throw new RangeError("Unbekannter Zustand: "+se);W=se},pegel(se){Number.isFinite(se)&&($=Math.max(0,Math.min(1,se)),ee=performance.now())},viseme(se){Se=Gm[se]||"rest",it=performance.now()},text(se,Ue,Le={}){let qe=String(se||"").replace(/\s+/g," ").trim();qe&&(We=[...qe].map(Hm),q=performance.now(),Q=Ue?Math.max(40,Ue/We.length):68,ne=Le.stumm?q+We.length*Q:0)},werkzeug(se){if(C.matches)return;let Ue=km.find(([Le])=>Le.test(String(se||"")));d.spawn(Math.random()*Math.PI*2,Ue?Ue[1]:Vc,200)},farbe(se){x.uFarbe.value.set(se)},stufe(se){["auto","hoch","sparsam"].includes(se)&&se!==a&&(a=se,se==="hoch"&&(r=0),b())},drossel(se){o=Math.max(0,Math.min(2,se|0))},warten(){J=0,V=0},laden(se){J=Math.max(J,Math.min(.6,se)),Y=.8},zuenden(){J=1,Y=1.6},drehen(){},info(){return{modell:!1,mosaik:!0,kacheln:w?w.geometry.instanceCount:0,fps:Fe,kappe:Ne,pixeldichte:n.getPixelRatio(),stufe:a,drossel:o}},entfernen(){U=!0,cancelAnimationFrame(z),A.disconnect(),removeEventListener("pointermove",L),m.forEach(se=>se.dispose()),g.dispose(),w?.geometry.dispose(),_.dispose(),d.punkte.geometry.dispose(),d.punkte.material.dispose(),n.dispose(),n.forceContextLoss(),n.domElement.remove()}}}window.JarvisAvatar={erzeugen:(i,e={})=>qm(i,e),stile:["mosaik"]};})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
