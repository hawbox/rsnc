# -* coding: UTF-8 -*-
###
  # Riassence Core -- http://rsence.org/
  #
  # Copyright (C) 2008 Juha-Jarmo Heinonen <jjh@riassence.com>
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

require 'conf/default'

require 'rubygems'
require 'rack'

## Loads the chosen web-server 
require $config[:http_server][:rack_require]

# methods that return rack handlers
def rack_fuzed_handler
  require 'http/fuzed/rack_fuzed'
  Rack::Handler::Fuzed
end
def rack_webrick_handler; Rack::Handler::WEBrick; end
def rack_ebb_handler;     Rack::Handler::Ebb;     end
def rack_thin_handler;    Rack::Handler::Thin;    end
def rack_mongrel_handler; Rack::Handler::Mongrel; end

# Selects handler for Rack
$config[:http_server][:rack_handler] = self.method({
  'fuzed'   => :rack_fuzed_handler,
  'webrick' => :rack_webrick_handler,
  'ebb'     => :rack_ebb_handler,
  'thin'    => :rack_thin_handler,
  'mongrel' => :rack_mongrel_handler
}[$config[:http_server][:rack_require]]).call

$DEBUG_MODE  = $config[:debug_mode]


# JSServe / JSCache caches and serves js and theme -files
require 'file/filecache'
require 'file/fileserve'

# TicketServe caches and serves disposable and static resources
require 'file/ticketserve'

# IndexHtml builds the default page at '/'
# require 'page/indexhtml' # getting replaced by the servletplugin functionality

# ValueManager syncronizes value objects
require 'values/valuemanager'

# SessionManager creates, validates, stores and expires sessions
require 'session/sessionmanager'

# PluginManager handles all the plugins
require 'plugins/pluginmanager'

# Transporter is the top-level handler for xhr
require 'transporter/transporter'

## Broker routes requests to the correct handler
require 'http/broker'


module Riassence
module Server

# adapted from:
# http://snippets.dzone.com/posts/show/2265

require 'fileutils'

module Daemon
  
  class Base
    def self.pid_fn
      $config[:daemon][:pid_fn]
    end
    def self.log_fn
      $config[:daemon][:log_fn]
    end
    def self.daemonize
      Controller.daemonize(self)
    end
  end
  
  module PidFile
    def self.store(daemon, pid)
      File.open(daemon.pid_fn, 'w') {|f| f << pid}
    end
    def self.recall(daemon)
      IO.read(daemon.pid_fn).to_i rescue nil
    end
  end
  
  module Controller
    
    def self.print_status(daemon)
      is_running = self.status(daemon)
      puts "Riassence Core is #{'not ' unless is_running}running"
    end
    
    ## Status is not entirely reliable
    def self.status(daemon)
      if File.file?(daemon.pid_fn)
        begin
          pid = open(daemon.pid_fn,'r').read.to_i
          pid && Process.kill('USR2',pid)
          return true
        rescue Errno::ESRCH => e
          return false
        end
      end
      return false
    end
    
    def self.daemonize(daemon)
      case !ARGV.empty? && ARGV[0]
      when 'status'
        self.print_status(daemon)
      when 'start'
        self.start(daemon)
      when 'stop'
        self.stop(daemon)
      when 'restart'
        self.stop(daemon,true)
        self.start(daemon)
      when 'save'
        self.save(daemon)
      else
        puts "Invalid command. Please specify one of the following: start, stop, restart, status, save or help."
        exit
      end
    end
    def self.start(daemon)
      is_running = self.status(daemon)
      if is_running
        puts "Riassence Core is already running. Try restart."
        exit
      elsif not is_running and File.file?(daemon.pid_fn)
        puts "Stale pid file, removing.."
        FileUtils.rm(daemon.pid_fn)
      end
      fork do
        Process.setsid
        exit if fork
        PidFile.store(daemon, Process.pid)
        #Dir.chdir( PIDPATH )
        #File.umask( 0000 )
        STDIN.reopen( "/dev/null" )
        outpath = "#{daemon.log_fn}.stdout"
        if not File.exist?( outpath )
          STDOUT.reopen( outpath, "w" )
        else
          STDOUT.reopen( outpath, "a" )
        end
        errpath = "#{daemon.log_fn}.stderr"
        if not File.exist?( errpath )
          STDERR.reopen( errpath, "w" )
        else
          STDERR.reopen( errpath, "a" )
        end
        STDOUT.sync = true
        STDERR.sync = true
        Signal.trap('USR1') do 
          $PLUGINS.shutdown
          $SESSION.shutdown
        end
        Signal.trap('USR2') do 
          puts "Alive."
        end
        ['INT', 'TERM', 'KILL'].each do |signal|
          Signal.trap(signal) do
            puts "Got signal #{signal.inspect}"
            daemon.stop
            exit
          end
        end
        Signal.trap('HUP') {
          daemon.restart
        }
        daemon.start
      end
      timeout = Time.now + 10
      sleep 0.01 until self.status(daemon) or timeout < Time.now
      
      if timeout < Time.now
        puts "Riassence Core did not start, please check the logfile."
      else
        puts "Riassence Core is running now."
      end
    end
    def self.save(daemon,is_restart=false)
      if !File.file?(daemon.pid_fn)
        puts "Pid file not found. Is Riassence Core started?"
        return if is_restart
        exit
      end
      pid = open(daemon.pid_fn,'r').read.to_i
      begin
        pid && Process.kill("USR1", pid)
        puts "Session data saved."
      rescue
        puts "Error, no such pid (#{pid}) running"
      end
    end
    def self.stop(daemon,is_restart=false)
      self.save(daemon,is_restart)
      if !File.file?(daemon.pid_fn)
        puts "Pid file not found. Is Riassence Core started?"
        return if is_restart
        exit
      end
      pid = PidFile.recall(daemon)
      FileUtils.rm(daemon.pid_fn)
      begin
        pid && Process.kill("TERM", pid)
        puts "Riassence Core is stopped now."
      rescue
        puts "Error, no such pid (#{pid}) running"
      end
    end
  end
end

class HTTPDaemon < Riassence::Server::Daemon::Base
  def self.start
    $config[:filecache]       = FileCache.new
    $FILECACHE   = $config[:filecache]
    $config[:fileserve]       = FileServe.new
    $FILESERVE   = $config[:fileserve]
    $config[:ticketserve]     = TicketServe.new
    $TICKETSERVE = $config[:ticketserve]
    
    # indexhtml functionality going to servlet
    #$config[:indexhtml]       = IndexHtml.new
    #$INDEXHTML   = $config[:indexhtml]
    
    $config[:valuemanager]    = ValueManager.new
    $VALUES      = $config[:valuemanager]
    $config[:sessionmanager]  = SessionManager.new
    $SESSION     = $config[:sessionmanager]
    $config[:plugins]         = PluginManager.new
    $PLUGINS     = $config[:plugins]
    $config[:transporter]     = Transporter.new
    $TRANSPORTER = $config[:transporter]
    
    # This is the main http server instance:
    $config[:broker] = Broker.start(
      $config[:http_server][:rack_handler],
      $config[:http_server][:bind_address],
      $config[:http_server][:port]
    )
    $BROKER      = $config[:broker]
    
    yield $BROKER if block_given?
    
  end
  def self.restart
    self.stop
    $BROKER = nil
    $config[:broker] = nil
    self.start
  end
  def self.stop
    $PLUGINS.shutdown if $PLUGINS
    $SESSION.shutdown if $SESSION
  end
end

end
end
