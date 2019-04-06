from packet import Packet
from struct import unpack

#   3: 

# 
# Decode 0x01 messages: State
def decode_state_msg(raw_packet):
  if raw_packet[1] != 0x01:
    print("- packet parser: decode_state_msg: raw packet not 0x01 type")
    return None
  
  if len(raw_packet) != 24:
    print("- packet parser: decode_state_msg: raw packet not 24 bytes", raw_packet.hex())
    return None

  unpacked = unpack('<ccfffffcc', raw_packet)

  pkt = Packet()
  pkt.message_type = 0x01
  pkt.raw = raw_packet

  state_msg = {
    'x': unpacked[2],
    'y': unpacked[3],
    'phi': unpacked[4],
    'sp_x': unpacked[5],
    'sp_y': unpacked[6]
  }

  pkt.parsed = state_msg

  return pkt

# 
# Decode 0x02 messages: State Request
def decode_staterq_msg(raw_packet):
  if raw_packet[1] != 0x02:
    print("- packet parser: decode_staterq_msg: raw packet not 0x02 type")
    return None

  if len(raw_packet) != 5:
    print("- packet parser: decode_staterq_msg: raw packet not 5 bytes", raw_packet.hex())
    return None
  
  unpacked = unpack('<ccccc', raw_packet)
 
  pkt = Packet()
  pkt.message_type = 0x02
  pkt.raw = raw_packet

  staterq_msg = {
    'node_id': int.from_bytes(unpacked[2], 'little')
  }

  pkt.parsed = staterq_msg

  return pkt

# 
# Decode 0x03 messages: Control Message
def decode_control_msg(raw_packet):
  if raw_packet[1] != 0x03:
    print("- packet parser: decode_control_msg: raw packet not 0x03 type")
    return None

  if len(raw_packet) != 10:
    print("- packet parser: decode_control_msg: raw packet not 10 bytes", raw_packet.hex())
    return None
  
  unpacked = unpack('<ccccfcc', raw_packet)

  pkt = Packet()
  pkt.message_type = 0x03
  pkt.raw = raw_packet

  control_msg = {
    'node_id': int.from_bytes(unpacked[2], 'little'),
    'type': int.from_bytes(unpacked[3], 'little'),
    'u': unpacked[4]
  }

  pkt.parsed = control_msg

  return pkt

# 
# Decode 0x04 messages: User Message (no unpacking)
def decode_user_msg(raw_packet):
  if raw_packet[1] != 0x04:
    print("- packet parser: decode_user_msg: raw packet not 0x04 type")
    return None

  pkt = Packet()
  pkt.message_type = 0x04
  pkt.raw = raw_packet

  return pkt

def parse_packet(raw_packet):
  if len(raw_packet) < 2:
    return None

  if raw_packet[0] != 0xAA:
    return None

  if raw_packet[1] == 0x01:
    return decode_state_msg(raw_packet)
  
  if raw_packet[1] == 0x02:
    return decode_staterq_msg(raw_packet)

  if raw_packet[1] == 0x04:
    return decode_user_msg(raw_packet)