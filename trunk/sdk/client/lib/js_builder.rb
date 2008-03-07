###
  # HIMLE RIA SYSTEM
  # Copyright (C) 2008 HIMLE GROUP http://himle.sorsacode.com/
  # Copyright (C) 2007 Juha-Jarmo Heinonen <juha-jarmo.heinonen@sorsacode.com>
  #  
  #  This program is free software; you can redistribute it and/or modify it under the terms
  #  of the GNU General Public License as published by the Free Software Foundation;
  #  either version 2 of the License, or (at your option) any later version. 
  #  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
  #  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  #  See the GNU General Public License for more details. 
  #  You should have received a copy of the GNU General Public License along with this program;
  #  if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
  ###

class JSBuilder
  def print_stat(dst_path,jsc_path,gz_path)
    #dst_size = @destination_files[dst_path].size
    #jsc_size = @jsc_files[jsc_path].size
    dst_size = File.stat(dst_path).size
    jsc_size = File.stat(jsc_path).size
    gz_size  = File.stat( gz_path).size
    percent = 'n/a'
    if dst_size > 0
      percent1 = (100*(jsc_size/dst_size.to_f)).to_i.to_s + '%'
      percent2 = (100*(gz_size/dst_size.to_f)).to_i.to_s + '%'
    end
    jsc_name = jsc_path.split('/')[-1]
    STDERR.write "#{jsc_name.ljust(30).gsub(' ','.')}: #{dst_size.to_s.rjust(6)} | #{jsc_size.to_s.rjust(6)} #{percent1.ljust(3)} | #{gz_size.to_s.rjust(6)} #{percent2.ljust(3)}\n"
  end
  def pre_convert(jsc_data)
    # replace names in conv in the most common -> least common order of conv_ids
    @conv_used.keys.each do |conv_from|
      conv_to = @conv_used[conv_from]
      jsc_data.gsub!(eval("/\\b(#{conv_from})\\b/"),conv_to)
    end
    jsc_data.gsub!(/\\\n([\ ]*)/,'')
    return jsc_data
  end
  def minimize_data
    STDERR.write "Package.......................:   Size | Compressed | GZIPed\n"
    @destination_sort.each do |dst_path|
      jsc_path = dst_path.gsub( $_BUILD_PATH, $_DESTINATION_PATH )
      if DEBUG_MODE
        jsc_data = read_file( dst_path )
      else
        if RUBY_PLATFORM.include? "mswin32"
          jsc_data = pre_convert( `#{CAT} #{dst_path.gsub('/',"\\")} | #{JSMIN}` )
        else
          jsc_data = pre_convert( `#{CAT} #{dst_path} | #{JSMIN}` )
        end
      end
      
      save_file(jsc_path,jsc_data)
      
      gz_path = jsc_path.gsub('.js','.gz')
      gzip_file(jsc_path,gz_path)
      
      print_stat(dst_path,jsc_path,gz_path)
    end
  end
  def mkconvcount()
    conv_amt_name = {}
    @conversion_stats.each do |conv_name,conv_amt|
      conv_amt_name[conv_amt] = [] unless conv_amt_name.has_key?(conv_amt)
      conv_amt_name[conv_amt].push(conv_name)
    end
    conv_amt_name.keys.sort.reverse.each do |conv_amt|
      conv_amt_name[conv_amt].sort.each do |conv_name|
        @conv_used[conv_name] = @conv_ids.shift
      end
    end
  end
  def conv_ids()
    conv_tmp = []
    # 0..9
    48.upto(57)  {|val|conv_tmp.push(val.chr)}
    # a..z
    97.upto(122) {|val|conv_tmp.push(val.chr)}
    # A..Z
    65.upto(90)  {|val|conv_tmp.push(val.chr)}
    # double them up..
    @conv_ids  = []
    @conv_used = {}
    conv_tmp.each do |pri_chr|
      @conv_ids.push($_REPL_PREFIX+pri_chr)
    end
    conv_tmp.each do |pri_chr|
      conv_tmp.each do |sec_chr|
        @conv_ids.push($_REPL_PREFIX+pri_chr+sec_chr)
      end
    end
    # well, 3906 conv_ids should be enough for everyone ;)
  end
  
  def add_hints(hints_path)
    return if DEBUG_MODE
    hints_js = read_file(hints_path)
    #hints_js = `cat #{hints_path} | #{JSMIN}`
    hints_js.gsub(/[^a-zA-Z0-9_](_[a-zA-Z0-9_]+?)[^a-zA-Z0-9_]/) do
    #hints_js.gsub(/[^a-zA-Z0-9_]([a-zA-Z0-9_]+?)[^a-zA-Z0-9_]/) do
      unless $_RESERVED_NAMES.include?( $1 )
        #STDERR.write $1 unless @hints.include?($1)
        @hints.push( $1 ) unless @hints.include?( $1 )
        @conversion_stats[ $1 ] = 0 unless @conversion_stats.include?( $1 )
        @conversion_stats[ $1 ] += 1
      end
    end
  end
  
   def gzip_file(src,dst)
    if RUBY_PLATFORM.include? "mswin32"
      `#{GZIP} -c #{src.gsub('/',"\\")} > #{dst.gsub('/',"\\")}`
    else
      gz_data = `#{GZIP} -c #{src}`
      save_file(dst,gz_data)
    end
  end
=begin
  def gzip_file(src,dst)
    gz_data = `#{GZIP} -c #{src}`
    save_file(dst,gz_data)
  end
=end
  def do_compress
    @conv_used = {}
    # save the js files
    @destination_sort.each do |dst_path|
      dst_data = @destination_files[dst_path]
      save_file(dst_path, dst_data)
    end
    # /save the js files
    conv_ids           # make short unique strings to be used as replacement patterns
    mkconvcount        # calculate the order of occurrences (biggest first)
    minimize_data      # do the actual compression
  end
  def save_file(outp_path,outp_data)
    outp_file = open(outp_path,'wb')
    outp_file.write(outp_data)
    outp_file.close
  end
  def read_file(path)
    filehandle = open(path)
    filedata   = filehandle.read
    filehandle.close
    return filedata
  end
  def cp_file(src_path,dst_path)
    if RUBY_PLATFORM.include? "mswin32"
      `copy #{src_path.gsub('/',"\\")} #{dst_path.gsub('/',"\\")}`
    else
      save_file(dst_path,read_file(src_path))
    end
  end
  def cp_css_tidy_file(src_path,dst_path)
    cp_file(src_path,dst_path)
    gzip_file(dst_path,dst_path+'.gz')
  end
  def cp_html_tidy_file(src_path,dst_path)
    if RUBY_PLATFORM.include? "mswin32"
      save_file(dst_path,read_file(src_path))
    else
      save_file(dst_path,`#{HTMLTIDY} "#{src_path}"`.gsub("\n",""))
    end
    gzip_file(dst_path,dst_path+'.gz')
  end


  def cp_theme(src_name,component_name)
    $_THEMES.each do |theme_name|
      
      tgt_file_css = File.join($_THEME_PATH,theme_name,'css',component_name+'.css')
      src_file_css = File.join(src_name,'themes',theme_name,'css',component_name+'.css')
      
      tgt_file_html = File.join($_THEME_PATH,theme_name,'html',component_name+'.html')
      src_file_html = File.join(src_name,'themes',theme_name,'html',component_name+'.html')
      if File.exist?( src_file_css )
        STDERR.write "\r#{' '*80}\r#{theme_name}::#{component_name}::CSS"
        cp_css_tidy_file(src_file_css,tgt_file_css)
      end
      if File.exist?( src_file_html )
        STDERR.write "\r#{' '*80}\r#{theme_name}::#{component_name}::HTML"
        cp_html_tidy_file(src_file_html,tgt_file_html)
      end
      
      src_files_gfx = File.join(src_name,'themes',theme_name,'gfx')
      
      if File.exist?(src_files_gfx)
        STDERR.write "\r#{' '*80}\r#{theme_name}::#{component_name}::GFX"
        Dir.new(src_files_gfx).each do |src_gfx_filename|
          src_file_gfx = File.join( src_files_gfx, src_gfx_filename )
          if ['.jpg','.gif','.png'].include?(src_file_gfx[-4..-1])
            tgt_file_gfx = File.join($_THEME_PATH,theme_name,'gfx',src_gfx_filename)
            if File.exist?(src_file_gfx)
              if File.exist?(tgt_file_gfx)
                if File.stat(tgt_file_gfx).size != File.stat(src_file_gfx).size
                  File.delete(tgt_file_gfx)
                  cp_file(src_file_gfx,tgt_file_gfx)
                end
              else
                cp_file(src_file_gfx,tgt_file_gfx)
              end
            end
          end
        end
      end
    end
    STDERR.write("\r#{' '*80}\r")
  end
  
  def build_destination_info
    release_files = `#{FIND} "#{$_SRC_PATH}" -type f -name #{$_INC_NAME}`
    release_files.split("\n").each do |releasefilepath|
      src_name  = File.split(releasefilepath)[0]
      component_name = File.split(src_name)[1]
      unless @release_order.include?(component_name)
        STDERR.write "no order defined: #{component_name}\n"
        @release_order.push(component_name)
      end
      
      #begin
        src_file_js = File.join( src_name, component_name+'.js' )
        
        cp_theme( src_name, component_name )
        
        add_hints( src_file_js )
        
        @destinations[component_name].each do |destination_name|
          
          tgt_file_js = File.join( $_BUILD_PATH, destination_name+'.js' )
          
          @destination_info[component_name] = {
            :src_name       => src_name,
            :component_name => component_name,
            
            :src_file_js    => src_file_js,
            :tgt_files_js   => []
          } unless @destination_info.has_key?( component_name )
          @destination_info[component_name][:tgt_files_js].push( tgt_file_js )
        end
      #rescue
      #  STDERR.write "not configured: #{component_name.inspect} (#{releasefilepath})\n"
      #  STDERR.write "exit.\n"
      #  exit
      #end
      
    end
  end
  
  def build_destination_files
    @release_order.each do |component_name|
      
      if @destination_info.has_key?(component_name)
        component_info = @destination_info[component_name]
        
        src_name  = component_info[:src_name]
        component_name = component_info[:component_name]
        
        src_file_js = component_info[:src_file_js]
        component_info[:tgt_files_js].each do |tgt_file_js|
          
          unless @destination_files.has_key?(tgt_file_js)
            @destination_sort.push( tgt_file_js )
            @destination_files[tgt_file_js] = ''
          end
          
          @destination_files[tgt_file_js] += read_file(src_file_js)
          
        end
      end
    end
  end
  
  def run
    
    # compression:
    @hints             = []
    @destination_files = {}
    @destination_sort  = []
    # /compression
    
    if not File.exist?("#{$_CLIENT_PATH}")
      STDERR.write "Release path (#{$_CLIENT_PATH} does not exist, making it...\n"
      `mkdir -p "#{$_CLIENT_PATH}"`
    end
    
    @release_order = []
    @packages      = []
    @destinations  = {}
    
    $_PACKAGE_NAMES.each do |pkg_name|
      @packages.push( pkg_name )
      begin
        $_PACKAGES[pkg_name].each do |item_name|
          @release_order.push( item_name )
          @destinations[ item_name ] = [] unless @destinations.include?( item_name )
          @destinations[ item_name ].push( pkg_name )
        end
      rescue
        STDERR.write "ERROR: package definition of #{pkg_name} not found\n"
        exit
      end
    end
    
    @destination_info = {}
    @conversion_stats = {}
    
    build_destination_info()
    build_destination_files()
    
    do_compress() # do the actual saving and compression
    
    save_file( File.join( $_DESTINATION_PATH, 'built' ), Time.now.strftime("%Y-%d-%d %H:%M:%S") )
    
    ## let the uiserver know there is a new version built
    #if RUBY_PLATFORM.include? "mswin32"
      #system("#{TOUCH} #{File.join( $_DESTINATION_PATH, 'built' ).gsub('/','\\')}")
    #else
      #system("#{TOUCH} #{File.join( $_DESTINATION_PATH, 'built' )}")
    #end
    
  end
end






