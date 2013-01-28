/**
 * Module dependencies
 */

var events    = require( 'events' ),
    CSSMatrix = require( 'css-matrix' ),
    Emitter   = require( 'emitter' );

/**
 * Export `Drag`
 */

module.exports = Drag;

/**
 * Firefox flag
 */

var isFF = navigator.userAgent.search('Firefox') > -1;

/**
 * Tuen `el` into draggable element.
 *
 * Emits:
 *
 *   - `dragstart` when drag starts
 *   - `drag` when dragging
 *   - `dragend` when drag finishes
 *
 * @param {Element} el
 * @param {Boolean} smooth whether or not we use `transform3d`
 * @api public
 */

function Drag( el, smooth ){
  if ( !( this instanceof Drag ) ) return new Drag( el, smooth );
  if ( !el ) throw new TypeError( 'Drag() requires an element' );
  Emitter.call( this );
  this.el     = el;
  this.smooth = smooth;
  this.bind();
}

/**
 * Inherit `Emitter`
 */

Drag.prototype.__proto__ = Emitter.prototype;

/**
 * Bind event handlers
 *
 * @api public
 */

Drag.prototype.bind = function() {
  this.events = events( this.el, this );
  this.docEvents = events( document, this );
  this.events.bind( 'touchstart' );
  this.events.bind( 'mousedown', 'ontouchstart' );
};

/**
 * Unbind event handlers
 *
 * @api public
 */

Drag.prototype.unbind = function() {
  this.events.unbind();
};

/**
 * Handle touchstart
 * 
 * We capture the location of the element and mouse,
 * also binds `touchmove`, `touchend` events to `document`.
 *
 * @api private
 */

Drag.prototype.ontouchstart = function( e ) {
  e.stopPropagation();
  if ( e.touches ) e = e.touches[0];
  
  this.originX = this.el.offsetLeft;
  this.originY = this.el.offsetTop;
  this.startX  = e.pageX;
  this.startY  = e.pageY;
  if( this.smooth ){
    var translate   = this.getTranslate();
    this.translateX = translate.x;
    this.translateY = translate.y;
  }
  this.docEvents.bind( 'touchmove' );
  this.docEvents.bind( 'mousemove', 'ontouchmove' );
  this.docEvents.bind( 'touchend' );
  this.docEvents.bind( 'mouseup', 'ontouchend' );
  this.emit( 'dragstart' , e );
};

/**
 * Handle touchmove
 * 
 * Move element.
 *
 * @api private
 */

Drag.prototype.ontouchmove = function( e ) {
  e.preventDefault();
  this.x = this.originX + ( e.pageX - this.startX ),
  this.y = this.originY + ( e.pageY - this.startY );
  if( this.smooth ){
    this.x -= this.originX - this.translateX;
    this.y -= this.originY - this.translateY;
    this.el.style.webkitTransform = 
       this.el.style.mozTransform = 
        this.el.style.msTransform = 
          this.el.style.transform = 'translate3d( ' + this.x + 'px, ' + this.y + 'px , 0.0001px )'; // need to force `matrix3d`
  } else {
    this.el.style.left = this.x + 'px';
    this.el.style.top  = this.y + 'px';
  }
  this.emit( 'drag', e );
};

/**
 * Handle touchend
 *
 * Once drag finishes, unbinds all the events attached to `document`
 *
 * @api private
 */

Drag.prototype.ontouchend = function( e ) {
  this.docEvents.unbind();
  this.emit( 'dragend', e );
};

/**
 * Returns translate value
 *
 * @return {Object} x and y coordinate of `translate3d`
 * 
 * @api private
 */

Drag.prototype.getTranslate = function( ) {
  var x = 0, y = 0,
      transform = getComputedStyle( this.el )[isFF ? 'transform' : 'webkitTransform'],
      matrix, rawMatrix;
  if( transform != 'none' ){
    if( isFF ) {
      rawMatrix = transform.replace(/[a-z\(\)(3d)]/g, '').split( ',' ).map( function(v){ return v * 1; } ); 
      matrix = new CSSMatrix();
      CSSMatrix.apply( matrix, rawMatrix );
    } else {
      matrix = new WebKitCSSMatrix( transform );
    }
    x = matrix.m41;
    y = matrix.m42;
  }
  return { x: x, y: y };
};
