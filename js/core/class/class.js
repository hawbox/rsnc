
/** = Description
  * The extended object model.
  *
  * HClass is the foundation class of all other classes. It implements
  * a proper object oriented environment in Javascript. It supports
  * inheritance (HClass.extend), superclass invocation ( this.base ),
  * interfaces (HClass.implement) and such.
  *
  * It's derived from and backwards compatible with  Dean Edward's Base.js,
  * so you can mix and match code written against Base.js.
  *
  * It is intended for the following main purposes:
  *   * To easily create classes without the MyClass.prototype cruft
  *   * Method overriding with intuitive access to the overridden method (like Ruby's super)
  *   * To avoid calling a class' constructor function during the prototyping phase
  *   * To easily add static (class) properties and methods
  *   * To achieve the above without resorting to global functions to build prototype chains
  *   * To achieve the above without affecting Object.prototype
  *
  * The HClass class extends the 'Object' object by adding one instance method (base)
  * and two class methods (extend, implement). Instance method extend can be also called directly.
  *
  * == Example:
  *    MyClass = HClass.extend({
  *      constructor: function( foo ){
  *        this.setFoo( foo );
  *      },
  *      setFoo: function( foo ){
  *        this.foo = foo;
  *      }
  *    });
  *
  *    myClassInstance1 = MyClass.nu( 'rabbids' );
  *    myClassInstance2 = new MyClass( 'ribbit' );
  *
  *    MyEqualsClass = MyClass.extend({
  *      testFoo: function( that ){
  *        return this.foo === that.foo;
  *      }
  *    });
  *    myEqualsClassInstance1 = MyEqualsClass.nu( 'woof' );
  *    equals1 = myEqualsClassInstance1.testFoo( myClassIntance1 );
  *    myClassInstance2.setFoo( myEqualsClassInstance1.foo );
  *    equals2 = myEqualsClassInstance1.testFoo( myClassIntance2 );
  *
  **/
var//RSence.Core
HClass = function() {
  if ( arguments.length ) {
    if (this === window) {
      HClass.prototype.extend.call( arguments[0], arguments.callee.prototype );
    }
    else {
      this.extend( arguments[0] );
    }
  }
};


HClass.prototype = {

  // detection for production build (compressed source; '_compressed' would be something like '_x4', whereas '_'+'compressed' is still '_compressed')
  isProduction: '_'+'compressed' !== '_compressed',

  _exceptionProperties: function(e){
    var err = {}, prop;
    for (prop in e) {
      err[prop] = e[prop];
    }
    err.name = e.name;
    err.message = e.message;
    err.stack = e.stack;
    return err;
  },

 /* The property copying method. */
  extend: function(_source, _value) {
    var _extend = HClass.prototype.extend,
        _ancestor, _method, _returnValue, i, _name, _prototype, _protected;
    if (arguments.length === 2) {
      _ancestor = this[_source];
      // only methods are inherited
      if ((typeof _ancestor === 'function') && (typeof _value === 'function') &&
          _ancestor.valueOf() !== _value.valueOf() && (/\bbase\b/).test(_value)) {
        _method = _value;
        _value = function() {
          // saves the this.base that is the this.base method of this child
          var _previous = this.base;
          // copies previous this.base from the direction from HClass
          this.base = _ancestor;

          // The current class's method is called with an exception handler to
          // ignore the common mistake of calling super, while being in the class
          // declaring the method; has no super.
          try{
            // now inside the function when called this.base points to parent method
            _returnValue = _method.apply(this, arguments);
          }
          catch(e){
            var _eProps = HClass.prototype._exceptionProperties(e);
            !this.isProduction && console.warn(
              "An exception occurred while calling base: ",
              _eProps,
              "\nfunction name: \""+_source+
              "\"\nouter function: ", _method.toString(),
              "\ninner function: ", _ancestor.toString(),
              "\nstack: ",_eProps.stack
            );
            _returnValue = null;
          }
          // then because event this function can be called from child method
          // resets the base to as is was before calling this function
          this.base = _previous;
          return _returnValue;
        };
        _value.valueOf = function() {
          return _method;
        };
        _value.toString = function() {
          return String(_method);
        };
      }
      return this[_source] = _value;
    // this is called when called by HClass.extend
    }
    else if (_source) {
      _prototype = {toSource: null};
      _protected = ["toString", "valueOf"];
      // we want default constructor function
      if (HClass._prototyping) {
        // 3. index
        _protected.push("constructor");
      }
      for (i = 0; (_name = _protected[i]); i++) {
        if (_source[_name] !== _prototype[_name]) {
          _extend.call(this, _name, _source[_name]);
        }
      }
      for (_name in _source) {
        if (!_prototype[_name]) {
          _extend.call(this, _name, _source[_name]);
        }
      }
    }

    // alternative constructor (use instead of the new keywoard)
    var
    _nu = function(){
      try{
        return new (this.extend({ constructor: function( _args ){ this.base.apply( this, _args ); } } ))( arguments );
      }
      catch(e){
        console.log(e,this);
        return {};
      }
    };
    this.nu = _nu;
    this['new'] = _nu;
    this.hasAncestor = function( _obj ){
      return !!~this.ancestors.indexOf( _obj );
    };
    return this;
  },
  /** = Description
    * If a method has been overridden then the base method provides access to the overridden method.
    * Call this method from any other method to invoke that method's ancestor.
    * It is also possible to call the base method from within a constructor function.
    *
    **/
  base: function() {
    // this method can be called from any other method to invoke that method's parent
  }
};

/** = Description
  * The class method method to create a new extended class.
  *
  * If the method name constructor is defined null as the +_instance+ parameter,
  * it will return a single instance.
  *
  * = Parameters:
  * +_instance+:: An object that has properties and methods of inherited class.
  * +_static+::   An object that has properties and methods of inherited class's
  *               class methods if the method named constructor is defined null
  *               in _instance parameter.
  *
  * = Returns:
  *   Returns the extended class object.
  *
  * = Usage:
  *   Point = HClass.extend({
  *   constructor: function(x, y) {
  *     this.x = x;
  *     this.y = y;
  *   }
  *   });
  *   Rectangle = Point.extend({
  *   constructor: function(x, y, width, height) {
  *     this.base(x, y);
  *     this.width = width;
  *     this.height = height;
  *   },
  *   getWidth: function() {
  *     return this.width;
  *   },
  *   getHeight: function() {
  *     return this.height;
  *   }
  *   },
  *   {
  *   // class methods
  *   description: "this is a Rectangle",
  *   getClass: function() {
  *     return this;
  *   }
  *   });
  *
  **/
HClass.extend = function(_instance, _static) {
  // reference to HClass's prototype extend method (HClass's class structure extend method)
  var _extend = HClass.prototype.extend,
      _prototype, _constructor, _klass, _object,
      _ancestors, i=0;
  // if _instance is undefined,null,"" etc. creates object so that code below works
  if (!_instance) {
    _instance = {};
  }
  HClass._prototyping = true;
  // this is base for single instance or prototype (class structure) for object that are created
  // from this class
  _prototype = new this();
  // copies properties and methods from _instance to _prototype (class structure)
  _extend.call(_prototype, _instance);
  // this constructor came from _instance
  _constructor = _prototype.constructor;
  _prototype.constructor = this;
  delete HClass._prototyping;

  _ancestors = [];
  _klass = function() {
    if (!HClass._prototyping) {
      _constructor.apply(this, arguments);
    }
    this.constructor = _klass;
    this.ancestors = _ancestors;
  };
  // this is the new class's prototype (class structure)
  _klass.prototype = _prototype;
  // copies static method (class method)
  // acts like HClass.extend
  _klass.extend = this.extend;
  // copies static method (class method)
  // acts like HClass.implement
  _klass.implement = this.implement;
  _klass.toString = function() {
    return String(_constructor);
  };
  // copies properties and methods from _static directly to statc methods (class methods)
  // of new class
  _extend.call(_klass, _static);
  // if _constructor is marked as null returns the created instance (that is also class structure for
  // instances if class is returned
  _object = (_constructor !== null) ? _klass : _prototype;
  if (_object.init instanceof Function) {
    _object.init();
  }
  _ancestors.push( _object );
  for( ; i < this.ancestors.length; i++ ){
    _ancestors.push( this.ancestors[i] );
  }
  _object.ancestors = _ancestors;
  return _object;
};
HClass.ancestors = [ HClass ];

/** = Description
  * Copies the prototype properties and methods from _interface or if it is an object it's properties and functions
  * to HClass or class inherited from HClass. Mimics the interface behaviour of ordinary programming languages.
  *
  * = Usage:
  * Defines an interface:
  *
  *  AreaInterface = HClass.extend({
  *  constructor: null,
  *    // implement
  *    // don't define here
  *    //getWidth: function() {},
  *    //getHeight: function() {},
  *  area: function() {
  *    return this.getWidth() * this.getHeight();
  *  }
  *  });
  *
  *  Rectangle = HClass.extend({
  *  constructor: function(x, y, width, height) {
  *    this.x = x;
  *    this.y = y;
  *    this.width = width;
  *    this.height = height;
  *  },
  *  getWidth: function() {
  *    return this.width;
  *  },
  *  getHeight: function() {
  *    return this.height;
  *  }
  *  });
  *
  *  Rectangle.implement(AreaInterface);
  *
  **/
HClass.implement = function(_interface) {
  // copies prototype fields and methods (class structures properties and methods)
  if (_interface instanceof Function) {
    _interface = _interface.prototype;
  }
  this.prototype.extend(_interface);
};

//var Base = HClass;

// Array fix
if (![].indexOf) {
  // Object.extend = function(_destination, _source) {
  //   for (var _property in _source) {
  //     _destination[_property] = _source[_property];
  //   }
  //   return _destination;
  // };
  // Object.extend(Array.prototype, {
  Array.prototype.indexOf = function(_anObject){
    var i = 0, l = this.length;
    for (; i < l; i++) {
      if (this[i] === _anObject) {
        return i;
      }
    }
    return -1;
  };
}

// String fix
if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

// ff version 3.0.3 fails on this, when firebug installed: try/catch block
try {
  // console.log surrogate for browsers without a console
  if(!window.console){
    window.console = {
      log: function(){},
      warn: function(){}
    };
  }
} catch(e) {}

// Mozilla reference bind workaround (bind was introduced in JS 1.8.5)
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(
            this instanceof fNOP && oThis ? this : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments))
          );
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
    return fBound;
  };
}
