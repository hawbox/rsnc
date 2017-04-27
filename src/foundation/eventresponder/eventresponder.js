
const HClass = require('core/class');
const HSystem = require('foundation/system');
const EVENT = require('foundation/eventmanager');

/** = Description
 ** Automatic event responder. Defines what events HControl listens to
 ** and actions to be taken.
 **
 ** = Event handler methods
 ** Pre-defined event handler methods, extend these in your subclass.
 **
 ** +focus+::               Called when the component gets focus
 ** +blur+::                Called when the component loses focus
 ** +mouseDown+::           Called when the mouse button is pushed down
 ** +mouseUp+::             Called when the mouse button is released
 ** +mouseWheel+::          Called when the mouse wheel is used
 ** +startDrag+::           Called when the mouse button
 **                         is pressed (and item is draggable).
 ** +endDrag+::             Called when the mouse button
 **                         is released (and item is draggable).
 ** +drag+::                Called when the mouse is moved and mouse button
 **                         is down (and item is draggable).
 ** +drop+::                Called when a draggable item is released
 **                         on the droppable.
 ** +startHover+::          Called when a draggable item is moved
 **                         over the droppable.
 ** +hover+::               Called while a dragged item is moved between
 **                         startHover and endHover.
 ** +endHover+::            Called when a draggable item is moved out
 **                         of the droppable.
 ** +keyDown+::             Called when the user presses a key, and
 **                         the control is active.
 ** +keyUp+::               Called when the user releases a key, and
 **                         the control is active.
 ** +textEnter+::           Called when the user releases a key regardless
 **                         if the control is active or not.
 ** +gainedActiveStatus+::  Called when the component gets activated.
 ** +lostActiveStatus+::    Called when the component gets deactivated.
**/
const _EventResponderBase = HClass.mixin({
/** Default event listeners.
  **/
  defaultEvents: {},
  // state of item that is clicked an in focus:
  selected: false,
});

class HEventResponder extends _EventResponderBase {

/** = Description
  * The event responder interface for +HControl+.
  * Registers the events defined by boolean properties of
  * the events object to the control instance. The event manager
  * handles the event mapping and abstraction itself.
  * NOTE startDrag vs mouseDown and endDrag vs mouseUp events
  * conflict, if both are set simultaneously.
  *
  * = Parameters
  * +_events+::  A +{ event: state }+ Object structure, sets events based on the
  *              keys and the flag. All states are Booleans (true or false).
  *              A true state means the event listening for the event is
  *              enabled and a false state means the event listening is disabled.
  *              See the Event Types below:
  *
  * == Event States
  * Event State::    Description
  * +mouseMove+::   The global +mouseMove+ event state. The component receives
  *                 this event regardless if it's focused or not. The event
  *                 responder method for it is +mouseMove+ and it receives the
  *                 absolute x and y coordinates of the mouse pointer when the
  *                 mouse cursor position changes. Can also be toggled
  *                 separately by using the +setMouseMove+ method.
  * +textEnter+::   The global +textEnter+ event state. The component receives
  *                 this event regardless if it's focused or not. The event
  *                 responder method for it is +textEnter+ and it receives a
  *                 every time a key on the keyboard is pressed. Can also
  *                 be toggled separately by using the +setTextEnter+ method.
  * +click+::       The local +click+ event state. The component receives
  *                 this event only if it's focused. The event responder
  *                 method for it is +click+ and it receives the absolute x
  *                 and y coordinates of the mouse pointer as well as which
  *                 mouse button was used to trigger the event. Can also be
  *                 toggled separately by using the +setClickable+ method.
  * +mouseDown+::   The local +mouseDown+ event state. The component receives
  *                 this event only if it's focused. The event responder
  *                 method for it is +mouseDown+ and it receives the absolute x
  *                 and y coordinates of the mouse pointer as well as which
  *                 mouse button was used to trigger the event. Can also be
  *                 toggled separately by using the +setMouseDown+ method.
  * +mouseUp+::     The local +mouseUp+ event state. The component receives
  *                 this event only if it's focused. The event responder
  *                 method for it is +mouseUp+ and it receives the absolute x
  *                 and y coordinates of the mouse pointer as well as which
  *                 mouse button was used to trigger the event. Can also be
  *                 toggled separately by using the +setMouseUp+ method.
  * +mouseWheel+::  The local +mouseWheel+ event state. The component receives
  *                 this event only if it's focused. The event responder
  *                 method for it is +mouseWheel+ and it receives the delta of
  *                 the amount of the mouse scroll wheel was rolled: a floating
  *                 point number, larger or smaller than 0, depending on the
  *                 direction the scroll wheel was rolled. Can also be
  *                 toggled separately by using the +setMouseWheel+ method.
  * +draggable+::   The local +draggable+ event states. The component receives
  *                 these events only if it's focused. The event responders
  *                 methods are +startDrag+, +drag+ and +endDrag+. The events
  *                 receive the mouse cursor coordinates.
  *                 Can also be toggled separately by using the +setDraggable+
  *                 method.
  * +droppable+::   The local +droppable+ event states. The component receives
  *                 this event only if another component is dragged (hovered)
  *                 or dropped with the area of this component as the target.
  *                 The event responders method for it are +hoverStart+,
  *                 +drop+ and +hoverEnd+.
  *                 Can also be toggled separately by using the
  *                 +setDroppable+ method.
  * +keyDown+::     The local +keyDown+ event state. The component receives
  *                 this event only if it's focused. The event responder
  *                 method for it is +keyDown+ and it receives the ascii key
  *                 code whenever a keyboard key is pressed. Can also be
  *                 toggled separately by using the +setKeyDown+ method.
  *                 Also supports special mode 'repeat', when listening to
  *                 key repetitions is needed.
  * +keyUp+::       The local +keyUp+ event state. The component receives
  *                 this event only if it's focused. The event responder
  *                 method for it is +keyUp+ and it receives the ascii key
  *                 code whenever a keyboard key is released. Can also be
  *                 toggled separately by using the +setKeyUp+ method.
  *
  * = Usage
  *   HControl.new(
  *     [0,0,100,20],
  *     HApplication.nu()
  *   ).setEvents({
  *     mouseUp: true,
  *     mouseDown: true
  *   });
  *
  * = Returns
  * +self+
  *
  **/
  setEvents(_events) {
    if (!this.events) {
      if (this.isntObject(_events)) {
        _events = {};
      }
      this.events = HClass.mixin({
        mouseMove: false,
        mouseDown: false,
        mouseUp: false,
        draggable: false,
        droppable: false,
        keyDown: false,
        keyUp: false,
        mouseWheel: false,
        textEnter: false,
        click: false,
        resize: false,
        doubleClick: false,
        contextMenu: false,
        rectHover: false,
        multiDrop: false
      }, this.defaultEvents, _events).new();
    }
    EVENT.reg(this, this.events);
    return this;
  }

/** = Description
  * Enables the HControl instance, if the enabled flag is true, and disables
  * it if enabled is false. A disabled HControl won't respond events.
  * Component themes reflect the disabled state typically with
  * a dimmer appearance.
  *
  * = Parameters
  * +_flag+:: Boolean; true enables, false disables.
  *
  * = Returns
  * +this+
  *
  **/
  setEnabled(_flag) {
    const _viewsLen = this.views ? this.views.length : 0;

    // Enable/disable the children first.
    for (const i = 0; i < _viewsLen; i++) {
      const _view = HSystem.views[this.views[i]];
      this.isFunction(_view.setEnabled) && _view.setEnabled(_flag);
    }

    if (this.enabled === _flag) {
      // No change in enabled status, do nothing.
      return this;
    }

    this.enabled = _flag;

    if (_flag && this.events) {
      EVENT.reg(this, this.events);
    }
    else {
      EVENT.unreg(this);
    }

    // Toggle the CSS class: enabled/disabled
    this.toggleCSSClass(this.elemId, 'enabled', _flag);
    this.toggleCSSClass(this.elemId, 'disabled', !_flag);
    return this;
  }

/** = Description
  * Alias for #setEnabled(true)
  *
  **/
  enable() {
    return this.setEnabled(true);
  }

/** = Description
  * Alias for #setEnabled(false)
  *
  **/
  disable() {
    return this.setEnabled(false);
  }

/** = Description
  * Alternative flag setter for the mouseMove event type. If set to true,
  * starts listening to mouseDown events when the component has focus.
  *
  * = Parameters
  * +_flag+:: Set the mouseDown event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setMouseMove(_flag) {
    this.events.mouseMove = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Alternative flag setter for the click event type. If set to true,
  * starts listening to click events when the component has focus.
  *
  * = Parameters
  * +_flag+:: Set the click event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setClickable(_flag) {
    this.events.click = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for mouseDown events depending on
  * the value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the mouseDown event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setMouseDown(_flag) {
    this.events.mouseDown = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for doubleClick events depending on
  * the value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the doubleClick event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setDoubleClickable(_flag) {
    this.events.doubleClick = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for contextMenu events depending on
  * the value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the contextMenu event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setContextMenu(_flag) {
    this.events.contextMenu = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for mouseUp events depending on the
  * value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the mouseUp event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setMouseUp(_flag) {
    this.events.mouseUp = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Alternative flag setter for the mouseWheel event type. If set to true,
  * starts listening to mouseWheel events when the component has focus.
  *
  * = Parameters
  * +_flag+:: Set the mouseWheel event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setMouseWheel(_flag) {
    this.events.mouseWheel = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for startDrag, drag and
  * endDrag -events depending on the value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the startDrag, drag and endDrag event listening
  *           on/off (true/false) for the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setDraggable(_flag) {
    this.events.draggable = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for startHover, drop and
  * endHover -events depending on the value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the startHover, drop and endHover event listening
  *           on/off (true/false) for the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setDroppable(_flag) {
    this.events.droppable = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for keyDown events depending on the
  * value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the keyDown event listening on/off (true/false) for
  *           the component instance. Also supports special mode 'repeat',
  *           when listening to key repetitions is needed.
  *
  * = Returns
  * +self+
  *
  **/
  setKeyDown(_flag) {
    this.events.keyDown = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for keyUp events depending on
  * the value of the flag argument.
  *
  * = Parameters
  * +_flag+:: Set the keyUp event listening on/off (true/false) for
  *           the component instance.
  *
  * = Returns
  * +self+
  *
  **/
  setKeyUp(_flag) {
    this.events.keyUp = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for textEnter events
  * depending on the value of the flag argument.
  *
  * = Returns
  * +self+
  *
  **/
  setTextEnter(_flag) {
    this.events.textEnter = _flag;
    this.setEvents();
    return this;
  }

/** = Description
  * Registers or releases event listening for resize events
  * depending on the value of the flag argument.
  *
  * = Returns
  * +self+
  *
  **/
  setResize(_flag) {
    this.events.resize = _flag;
    this.setEvents();
    return this;
  }

/** Same as +setClickable+
  **/
  setClick(_flag) {
    return this.setClickable(_flag);
  }

/** Same as +setDoubleClickable+
  **/
  setDoubleClick(_flag) {
    return this.setDoubleClickable(_flag);
  }

/** = Description
  * Default focus event responder method. Does nothing by default.
  * Called when the component gets focus.
  *
  **/
  focus() {}

/** = Description
  * Default blur event responder method. Does nothing by default.
  * Called when the component loses focus.
  *
  **/
  blur() {}

/** = Description
  * Return true if this component allow gain active status.
  *
  */
  allowActiveStatus(_prevActive) {
    return true;
  }

/** = Description
  * Default gainedActiveStatus event responder method. Does nothing by default.
  * Called when the component gains active status; both focused and clicked.
  *
  * = Parameters
  * +_lastActiveControl+:: A reference to the control that was active
  *                        before this control became active. Can
  *                        be null if there was no active control.
  *
  **/
  gainedActiveStatus(_lastActiveControl) {
    const _parentIdx = this.parents.length - 1;
    if (HSystem.windowFocusMode === 1 && _parentIdx > 1) {
      for (; _parentIdx > 0; _parentIdx--) {
        // Send gainedActiveStatus to HWindow parent(s)
        if (this.isntNullOrUndefined(this.parents[_parentIdx].windowFocus)) {
          this.parents[_parentIdx].gainedActiveStatus();
        }
      }
    }

  }

  // A low-level handler for active status, don't extend this.
  _gainedActiveStatus(_lastActiveControl) {
    if (this.enabled) {
      this.setCSSClass('active');
    }
    return this.gainedActiveStatus(_lastActiveControl);
  }

/** = Description
  * Default lostActiveStatus event responder method. Does nothing by default.
  * Called when the component loses active status; another component was
  * focused and clicked.
  *
  * = Parameters
  * +_newActiveControl+:: A reference to the control that became the currently
  *                       active control. Can be null if there is no active
  *                       control.
  *
  **/
  lostActiveStatus(_newActiveControl) {
    return true;
  }

  // --A low-level handler for lost active status, don't extend this.++
  _lostActiveStatus(_newActiveControl) {
    if (this.lostActiveStatus(_newActiveControl) !== false) {
      if (this.enabled) {
        this.unsetCSSClass('active');
      }
      return true;
    }
    else {
      return false;
    }
  }

/** = Description
  * Default mouseMove event responder method. Does nothing by default.
  * Called whenever the mouse cursor is moved regardless if the
  * component is active or has focus.
  *
  * = Parameters
  * +x+:: The horizontal coordinate units (px) of the mouse cursor position.
  * +y+:: The vertical coordinate units (px) of the mouse cursor position.
  *
  **/
  mouseMove(x, y) {}

/** = Description
  * Default click event responder method. Does nothing by default.
  *
  * = Parameters
  * +x+::              The horizontal coordinate units (px) of the
  *                    mouse cursor position.
  * +y+::              The vertical coordinate units (px) of the
  *                    mouse cursor position.
  * +_isLeftButton+::  Boolean flag; false if the right(context) mouse
  *                    button is pressed.
  *
  **/
  click(x, y, _isLeftButton) {}

/** = Description
  * Default click event responder method. Does nothing by default.
  *
  * = Parameters
  * +x+::              The horizontal coordinate units (px) of the
  *                    mouse cursor position.
  * +y+::              The vertical coordinate units (px) of the
  *                    mouse cursor position.
  * +_isLeftButton+::  Boolean flag; false if the right(context) mouse
  *                    button is pressed.
  *
  **/
  doubleClick(x, y, _isLeftButton) {}

/** = Description
  * Default contextMenu event responder method. Does nothing by default.
  * Extend to return true to allow the default action of the browser.
  *
  **/
  contextMenu(x, y, _isLeftButton) {}

/** = Description
  * Default mouseDown event responder method. Does nothing by default.
  *
  * = Parameters
  * +x+::              The horizontal coordinate units (px) of the
  *                    mouse cursor position.
  * +y+::              The vertical coordinate units (px) of the
  *                    mouse cursor position.
  * +_isLeftButton+::  Boolean flag; false if the right(context) mouse
  *                    button is pressed.
  *
  **/
  mouseDown(x, y, _isLeftButton) {}

/** = Description
  * Default mouseDown event responder method. Does nothing by default.
  *
  * = Parameters
  * +x+::              The horizontal coordinate units (px) of the
  *                    mouse cursor position.
  * +y+::              The vertical coordinate units (px) of the
  *                    mouse cursor position.
  * +_isLeftButton+::  Boolean flag; false if the right(context) mouse
  *                    button is pressed.
  *
  **/
  mouseUp(x, y, _isLeftButton) {}

/** = Description
  * Default mouseWheel event responder method. Does nothing by default.
  *
  * = Parameters
  * +_delta+:: Scrolling delta, the wheel angle change. If delta is positive,
  *            wheel was scrolled up. Otherwise, it was scrolled down.
  *
  **/
  mouseWheel(_delta) {}

/** = Description
  * Default startDrag event responder method. Sets internal flags by default.
  * This is the preferred method to extend if you want to do something
  * when a drag event starts. If you extend, remember to call +this.base();+
  *
  * = Parameters
  * +x+:: The horizontal coordinate units (px) of the mouse cursor position.
  * +y+:: The vertical coordinate units (px) of the mouse cursor position.
  *
  **/
  startDrag(x, y) {}

/** = Description
  * Default drag event responder method. Does nothing by default.
  * This is the preferred method to extend while a drag method is ongoing.
  * Called whenever the mouse cursor moves and a drag event has been started.
  *
  * = Parameters
  * +x+:: The horizontal coordinate units (px) of the mouse cursor position.
  * +y+:: The vertical coordinate units (px) of the mouse cursor position.
  *
  **/
  drag(x, y) {
    this.doDrag(x, y);
  }

  doDrag(x, y) {}

/** = Description
  * Default endDrag event responder method. Sets internal flags by default.
  * This is the preferred method to extend if you want to do something
  * when a drag event ends. If you extend, remember to call +this.base();+
  *
  * = Parameters
  * +x+:: The horizontal coordinate units (px) of the mouse cursor position.
  * +y+:: The vertical coordinate units (px) of the mouse cursor position.
  *
  **/
  endDrag(x, y) {}

/** = Description
  * Default drop event responder method. Does nothing by default.
  * Extend the drop method, if you want to do something
  * when this instance is the target of another instance's endDrag event.
  * Called when a dragged component instance is dropped on the target instance.
  *
  * = Parameters
  * +obj+:: The dragged component object.
  *
  **/
  drop(obj) {
    this.onDrop(obj);
  }

  onDrop(obj) {}

/** = Description
  * Default startHover event responder method. Does nothing by default.
  * Extend the startHover method, if you want to do something
  * when this instance is the target of another instance's drag event.
  * Called when a dragged component instance is dragged over
  * the target instance.
  *
  * = Parameters
  * +obj+:: The dragged component object.
  *
  **/
  startHover(obj) {
    this.onHoverStart(obj);
  }

  onHoverStart(obj) {}

  hover(obj) {}

/** = Description
  * Default endHover event responder method. Does nothing by default.
  * Extend the endHover method, if you want to do something
  * when this instance is no longer the target of another instance's
  * drag event. Called when a dragged component instance is dragged
  * away from the target instance.
  *
  * = Parameters
  * +obj+:: The dragged component object.
  *
  **/
  endHover(obj) {
    this.onHoverEnd(obj);
  }
  onHoverEnd(obj) {}

/** = Description
  * Default keyDown event responder method. Does nothing by default.
  * Extend the keyDown method, if you want to do something
  * when a key is pressed and the component is active.
  *
  * = Parameters
  * +_keycode+:: The ascii key code of the key that was pressed.
  *
  **/
  keyDown(_keycode) {}

/** = Description
  * Default keyUp event responder method. Does nothing by default.
  * Extend the keyUp method, if you want to do something
  * when a key is released and the component is active.
  *
  * = Parameters
  * +_keycode+:: The ascii key code of the key that was released.
  *
  **/
  keyUp(_keycode) {}

/** = Description
  * Default textEnter event responder method. Does nothing by default.
  * Extend the textEnter method, if you want to do something
  * when a key is released regardless if the component is active,
  * has focus or not.
  *
  * = Parameters
  * +_keycode+:: The ascii key code of the key that was released.
  *
  **/
  textEnter() {}

/** Selection handling. Preferably extend #select and #deselect.
  **/
  select() {}

  deselect() {
    if (this.isFunction(this.deSelect)) {
      console.warn('HEventResponder#deSelect is deprecated; use #deselect instead!');
      this.deSelect();
    }
  }

  setSelected(_state) {
    this.toggleCSSClass(this.elemId, 'selected', _state);
    if (_state) {
      this.selected = true;
      this.select();
    }
    else {
      this.selected = false;
      this.deselect();
    }
  }
}

module.exports = HEventResponder;
