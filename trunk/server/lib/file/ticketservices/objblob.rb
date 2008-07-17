module Himle
module Server
module TicketService
class BlobObj
  def initialize(data,mime)
    @data = data
    @mime = mime
  end
  def mime
    return @mime
  end
  def data
    return @data
  end
  def size
    return @data.size
  end
  def close
  end
end
module ObjBlob
  def serve_blobobj( msg, blob_obj, no_expire=false )
    # gets a new, unique identifier
    ticket_id = @randgen.get_one
    uri = "/b/#{ticket_id}"
    if no_expire
      @blob_objs[:ses_ids][msg.ses_id] = [] unless @imgs[:ses_ids].has_key?(msg.ses_id)
      @blob_objs[:ses_ids][msg.ses_id].push( ticket_id )
      @blob_objs[:by_id][ticket_id] = [msg.ses_id,blob_obj]
    else
      @raw_uris[ticket_id] = blob_obj
    end
    return uri
  end
  
  def del_blobobj( ticket_id, ses_id=false )
    if ses_id and @blob_objs[:ses_ids].has_key?( ses_id )
      @blob_objs[:ses_ids][ses_id].delete( ticket_id ) if @blob_objs[:ses_ids][ses_id].include?( ticket_id )
    end
    @blob_objs[:by_id].delete( ticket_id ) if @blob_objs[:by_id].has_key?( ticket_id )
  end
  
  def push_keepalive_blobobj( ticket_id, keep_alive )
    expiry_time = Time.now.to_i+keep_alive
    @expire_blobobj[expiry_time] = [] unless @expire_blobobj.has_key?(expiry_time)
    @expire_blobobj[expiry_time].push( ticket_id )
  end
  
  def expire_keepalive_blobobj
    curr_time = Time.now.to_i
    @expire_blobobj.keys.sort.each do |exp_time|
      if exp_time < curr_time
        @expire_blobobj[exp_time].size.times do |incr|
          ticket_id = @expire_blobobj[exp_time].shift
          if @blob_objs[:by_id].has_key?(ticket_id)
            ses_id = @blob_objs[:by_id][ticket_id][3]
            del_blobobj( ticket_id, ses_id )
          end
        end
        @expire_blobobj.delete(exp_time) if @expire_blobobj[exp_time].size == 0
      end
    end
  end
end
end
end
end