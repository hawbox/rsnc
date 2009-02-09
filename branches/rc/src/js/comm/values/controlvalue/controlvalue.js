/***  Riassence Core
  ** 
  **  Copyright (C) 2008 Riassence Inc http://rsence.org/
  **  Copyright (C) 2006-2007 Helmi Technologies Inc.
  ** 
  **  This program is free software; you can redistribute it and/or modify it under the terms
  **  of the GNU General Public License as published by the Free Software Foundation;
  **  either version 2 of the License, or (at your option) any later version. 
  **  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
  **  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  **  See the GNU General Public License for more details. 
  **  You should have received a copy of the GNU General Public License along with this program;
  **  if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
  ***/

/** class: HControlValue
  *
  **/
HControlValue = HValue.extend({
  
/** constructor: constructor
  *
  * Parameters:
  *  _id - See <HValue.constructor>
  *  _value - The value itself. See <HValue.constructor>
  *
  **/
  constructor: function(_id,_value){
    this.validate(_value);
    // default values
    this.label = (_value.label !== undefined) ? _value.label : "Untitled";
    if (_value.value === undefined) {
      _value.value = 0;
    }
    this.enabled = (_value.enabled !== undefined) ? _value.enabled : true;
    this.active = (_value.active !== undefined) ? _value.active : false;
    this.base(_id,_value.value);
    this.type = '[HControlValue]';
  },

  
/** method: validate
  *
  * Simple value validation
  *
  * Parameters:
  *  _value - The data to validate
  *
  **/
  validate: function(_value){
    //alert((typeof _value));
    if(typeof _value != "object"){
      throw('ControlValueError: ControlValue must be an object');
    }
  },
  
/** method: set
  *
  **/
  set: function(_value){
    // Fix to ValueMatrix --> better ideas?
    if (typeof _value == "boolean") {
      var _temp = _value;
      _value = {};
      _value.value = _temp;
      
    }
    this.validate(_value);
    // default values    
    this.label = (_value.label !== undefined) ? _value.label : this.label;
    if (_value.value === undefined) {
      _value.value = this.value;
    }
    this.enabled = (_value.enabled !== undefined) ? _value.enabled : this.enabled;
    this.active = (_value.active !== undefined) ? _value.active : this.active;
    
    this.base(_value.value);
  },
  
/** method: setLabel
  *
  **/
  setLabel:   function(_label){
     this.set({label:_label});
  },
  
/** method: setValue
  *
  **/
  setValue:   function(_value){
    this.set({value:_value});
  },
  
/** method: setEnabled
  *
  **/
  setEnabled:   function(_enabled){
    this.set({enabled:_enabled});
  },
  
/** method: setActive
  *
  **/
  setActive:   function(_active){
    this.set({active:_active});
  },
  
  bind: function(_viewObj){
    this.base(_viewObj);
    if(this.views.indexOf(_viewObj.elemId)==-1){
      this.views.push(_viewObj);
      _viewObj.setLabel( this.label );
      _viewObj.setEnabled( this.enabled );
      //_viewObj.setActive( this.active );
    }
  },
/** method: refresh
  *
  * Calls the setValue method all components bound to this HControlValue.
  *
  * See also:
  *  <HControl.setValue>
  **/
  refresh: function(){
    this.base();
    for(var _viewNum=0;_viewNum<this.views.length;_viewNum++){
      var _viewObj = this.views[_viewNum];
      if(_viewObj.value != this.value){
        if(!_viewObj._valueIsBeingSet){
          _viewObj._valueIsBeingSet=true;
          _viewObj.setLabel( this.label );
          _viewObj.setEnabled( this.enabled );
          //_viewObj.setActive( this.active );
          _viewObj._valueIsBeingSet=false;
        }
      }
    }
  },
  
/** method: toXML
  *
  * Generates an XML description of the menuitem.
  *
  * Parameter:
  *  _i - The sequence number of the item, generated by HValueManager.
  *
  * Returns:
  *  An XML string with the date as specified
  *
  * See Also:
  *  <HValue.toXML> <HValueManager.toXML>
  *
  * Sample:
  * > <menuitem id="menuitem:215" order="1"><label>hello</label><value>0</value><enabled>true</enabled><active>false</active></menuitem>
  **/
  toXML: function(_i){
    var _syncid = this.id;
    return '<controlvalue id="'+_syncid+'" order="'+_i+'"><label>'+this.label+'</label><value>'+this.value+'</value><enabled>'+this.enabled+'</enabled><active>'+this.active+'</active></controlvalue>';
  }
});

