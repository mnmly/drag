/**
 * Module dependencies
 */

var events    = require( 'events' ),
    classes   = require( 'classes' ),
    constrain = require( 'constrain' ),
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
 * Turn `el` into draggable element.
 *
 * Emits:
 *
 *   - `dragstart` when drag starts
 *   - `drag` when dragging
 *   - `dragend` when drag finishes
 *
 * Options:
 *   - `smooth` enables `translate3d` positioning
 *   - `axis` constrains drag direction ['x'|'y']
 *   - `range` constrains range of movement
 *
 * @param {Element} el
 * @param {Object} options optionally set `smooth` and `axis`
 * @api public
 */

function Drag( el, options ){
  if ( !( this instanceof Drag ) ) return new Drag( el, options );
  if ( !el ) throw new TypeError( 'Drag() requires an element' );
  options = options || { };
  Emitter.call( this );
  this.el     = el;
  this.smooth = options.smooth || false;
  this.axis   = options.axis || '';
  this.range  = options.range || { x: null, y: null };
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
  classes( this.el ).add( 'is-dragging' );
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
  e.stopPropagation();
  e.preventDefault();
  var x = this.originX + ( e.pageX - this.startX ),
      y = this.originY + ( e.pageY - this.startY );
  if( this.smooth ){

    x -= this.originX - this.translateX;
    y -= this.originY - this.translateY;
    
    var constrained = this.constrain( x, y );
    this.x = constrained.x;
    this.y = constrained.y;

    this.setPosition( this.x, this.y );
  } else {
    var constrained = this.constrain( x, y );
    this.x = constrained.x
    this.y = constrained.y;
    this.setPosition( this.x, this.y );

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
  classes( this.el ).remove( 'is-dragging' );
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


/**
 * Constrains `x`, `y`
 *
 * @param {Number} x 
 * @param {Number} y
 *
 * @api private
 */

Drag.prototype.constrain = function( x, y ) {
  var x = this.range.x ? constrain( x, this.range.x[0], this.range.x[1] ) : x,
      y = this.range.y ? constrain( y, this.range.y[0], this.range.y[1] ) : y;
  
  if( this.axis === 'x' ) y = 0;
  if( this.axis === 'y' ) x = 0;

  return { x: x, y: y };
};


/**
 * Explicitly sets position of the object
 *
 * @param {Number} x
 * @param {Number} y
 *
 * @api public
 */

Drag.prototype.setPosition = function( x, y ) {
  if ( this.smooth ) {
    this.el.style.webkitTransform = 
       this.el.style.mozTransform = 
        this.el.style.msTransform = 
          this.el.style.transform = 'translate3d( ' + x + 'px, ' + y + 'px , 0.0001px )'; // need to force `matrix3d`
    
  } else {
    this.el.style.left = x + 'px';
    this.el.style.top  = y + 'px';
  }
}

