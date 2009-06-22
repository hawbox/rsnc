#!/usr/bin/env ruby
# -* coding: UTF-8 -*-
###
  # Riassence Core -- http://rsence.org/
  #
  # Copyright (C) 2007 Juha-Jarmo Heinonen <jjh@riassence.com>
  #
  # This file is part of Riassence Core.
  #
  # Riassence Core is free software: you can redistribute it and/or modify
  # it under the terms of the GNU General Public License as published by
  # the Free Software Foundation, either version 3 of the License, or
  # (at your option) any later version.
  #
  # Riassence Core is distributed in the hope that it will be useful,
  # but WITHOUT ANY WARRANTY; without even the implied warranty of
  # MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  # GNU General Public License for more details.
  #
  # You should have received a copy of the GNU General Public License
  # along with this program.  If not, see <http://www.gnu.org/licenses/>.
  #
  ###


require 'rubygems'
require 'json'

DEBUG_MODE = ARGV.include?( '-d' )

BINPATH  = File.split( File.expand_path( __FILE__ ) )[0]
BASEPATH = File.split(BINPATH)[0]
PARENT_PATH = File.split(BASEPATH)[0]
BUILDER_BINPATH = File.join(BASEPATH,'lib','jsbuilder','bin')
CONFPATH = File.join(BASEPATH,'conf')
$LOAD_PATH << CONFPATH
$LOAD_PATH << File.join(BASEPATH,'lib')
Dir.chdir(BASEPATH)

require 'jsbuilder/client-build-config'
require 'jsbuilder/js_builder'

# standard build configuration
if File.exist? File.join(CONFPATH,'client-build-config.rb')
  require File.join(CONFPATH,'client-build-config')
end

# local custom build configuration override:
if File.exist?(File.join(PARENT_PATH,'conf','client-build-config.rb'))
  require File.join(PARENT_PATH,'conf','client-build-config')
end

# compile client package
js_builder = JSBuilder.new( $_SRC_PATH, $_REL_PATH, $_THEMES, $_PACKAGES, $_PACKAGE_NAMES, $_RESERVED_NAMES )
js_builder.run
if ARGV.include? '-auto'
  js_builder.autorun
end
js_builder.flush

