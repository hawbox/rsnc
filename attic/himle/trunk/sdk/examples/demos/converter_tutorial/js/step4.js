/***  HIMLE RIA SYSTEM
  ** 
  **  Copyright (C) 2008 HIMLE GROUP http://himle.sorsacode.com/
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


unitConverterConfig = {
  themePath:   '../../release/latest/themes',
  windowLabel: 'Unit Converter',
  unitLabel:   'Convert:',
  unitValue:    new HValue('conversionUnit', 1),
  fromValue:    new HValue('fromValue', 100)
};


UnitConverter = HApplication.extend({
  constructor: function(){
    this.base();
    this.conf = unitConverterConfig;
    this.buildUI();
    this.bindData();
  },
  bindData: function(){
    this.conf.unitValue.bind( this.unitEditor );
    this.conf.fromValue.bind( this.fromEditor );
    this.conf.fromValue.bind( this.toViewer   );
  },
  buildUI: function(){
    this.converterWindow = new HWindow(
      new HRect( 50, 50, 370, 290 ),
      this, {
        label: this.conf.windowLabel
      }
    );
    this.mainView  = this.converterWindow.windowView;
    
    this.unitLabel   = new HStringView(
      new HRect( 16, 16, 66, 36 ),
      this.mainView, {
        value: this.conf.unitLabel
      }
    );
    this.unitEditor  = new HTextControl(
      new HRect( 76, 16, 286, 36 ),
      this.mainView
    );
    
    this.fromEditor  = new HTextControl(
      new HRect( 16, 46, 116, 66 ),
      this.mainView
    );
    
    this.labelTo = new HView(
      new HRect( 126, 46, 176, 66 ),
      this.mainView
    );
    this.labelTo.setStyle('text-align','center');
    this.labelTo.setHTML('&#x2192;');
    
    this.toViewer    = new HTextControl(
      new HRect( 186, 46, 286, 66),
      this.mainView
    );
    this.toViewer.setEnabled( false );
  }
});


var initUnitConverter = function(){
  HThemeManager.setThemePath( unitConverterConfig.themePath );
  this.myUnitConverter = new UnitConverter();
}

onloader('initUnitConverter();');