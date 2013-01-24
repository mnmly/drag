/**
 * Module dependencies
 */

var events  = require( 'events' ),
    Emitter = require( 'emitter' );

/**
 * Export `Drag`
 */

module.exports = Drag;

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
  this.el = el;
  this.smooth = smooth;
  this.bind();
};

/**
 * Mixin `Emitter`
 */

Emitter( Drag.prototype );

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
  e.stopPropargation();
  if ( e.touches ) e = e.touches[0];
  
  this.originX = this.el.offsetLeft;
  this.originY = this.el.offsetTop;
  this.startX  = e.pageX;
  this.startY  = e.pageY;
  
  this.docEvents.bind( 'touchmove' );
  this.docEvents.bind( 'mousemove', 'ontouchmove' );
  this.docEvents.bind( 'touchend' );
  this.docEvents.bind( 'mouseup', 'ontouchend' );

  this.emit( 'dragstart' );
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
  var x = ( this.originX + ( e.pageX - this.startX )) + 'px',
      y = ( this.originY + ( e.pageY - this.startY )) + 'px';
  if( this.smooth ){
    this.el.style.webkitTransform = 
       this.el.style.mozTransform = 
        this.el.style.msTransform = 
          this.el.style.transform = 'translate3d( ' + [ x, y ] + ', 0 )';

  } else {
    this.el.style.left = x;
    this.el.style.top  = y;
  }
  this.emit( 'drag' );
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
  this.emit( 'dragend' );
};
