import time
import serial

from packet_parser import parse_packet
from config import load_config

#
# Opens a serial port and starts listening to incoming data.
def start_serial_listen(filename, baudrate, emit_packet): 
  if filename is None:
    return
  
  if baudrate is None:
    return
  
  if emit_packet is None:
    return

  print("> serial reader: starting listen", filename, baudrate)
  buffer = bytearray()
  with serial.Serial(filename, baudrate=baudrate, timeout=0.3) as ser:
    print("> serial ready: name = ", ser.name)
    while True:
      read_bytes = ser.read(128)
      for byte in read_bytes:
        buffer.append(byte)
      process_new_data(buffer, emit_packet)

def parse_packets(frames):
  if frames is None:
    return []
  
  packets = []

  for frame in frames:
    packet = parse_packet(frame)
    if packet is None:
      continue
    
    packets.append(packet)

  return packets


#
# Process new incoming bytes into packets and emit packets if needed
def process_new_data(buffer, emit_packet):
  if buffer is None:
    return

  if emit_packet is None:
    return
  print("> serial reader: total buffer is", buffer.hex())
  frames = split_into_frames(buffer)
  print("> serial reader: frames are", frames)
  packets = parse_packets(frames)
  print("> serial reader: packets are", packets)
  emit_packets(packets, emit_packet)

# 
# Return how many bytes to take from the data buffer to compose a frame.
def get_frame_length(frame_type):
  if frame_type is None:
    return -1

  if frame_type == 1:
    return 24
  if frame_type == 2:
    return 5
  if frame_type == 3:
    return 10
  return -1

def split_into_frames(buffer): 

  if buffer is None:
    return []
  
  frames = []

  start = 0

  # Find all frames in the data stream
  while len(buffer) > 0:
    print("> serial reader: finding a new frame")
    print("> serial reader: from this haystack", buffer.hex())
    # Find the start of a frame
    while start < len(buffer) and (buffer[start] != 0xAA): 
      start += 1
    
    # No frames detected yet
    if start == len(buffer):
      return frames

    # Find the type of the frame
    type_idx = start + 1
    if type_idx == len(buffer):
      return frames

    # Figure out the length of the frame
    frame_length = get_frame_length(buffer[type_idx])
    print("> serial reader: frame length is", frame_length)

    # Special case: frame_length -1 specifies that frame length is not known ahead of time
    if frame_length != -1:
      # use predefined knowledge to find the end of the frame
      if start + frame_length >= len(buffer): 
        print("> serial reader: frame data not yet fully collected in buffer")
        return frames
      end = start + frame_length
    else:
      # let's scan for the end
      end = start + 1
      while end < len(buffer) and (buffer[end] != 0xAA):
        end += 1

      if end == len(buffer):
        return frames
      print("> serial reader: found end of frame", end)

    raw_frame = buffer[start:end]
    frames.append(raw_frame)

    # Delete any garbage before the read frame and the frame itself from read buffer
    del buffer[0:end]
    # Start again from the top
    start = 0
    print("> serial reader: the found frame is", raw_frame.hex())
  
  return frames


# For each packet in read_packets, emits it to Socket.IO
def emit_packets(packets, emit_packet):
  print("> serial reader: trying to emit packets from ", packets)

  if packets is None:
    return
  
  if emit_packet is None:
    return

  for packet in packets:
    print("> serial reader: emitting event for packet", packet)
    emit_packet(packet.message_type, packet.raw, packet.parsed)

def reader(emit_packet):
  print("> serial reader: init")

  conf = load_config()

  print("config loaded: ", conf)

  if not "serial_device" in conf:
    print("serial_device section missing from configuration!")
    print("please check readme for config example")
    exit(1)

  if not "file" in conf["serial_device"]:
    print("file parameter missing from configuration!")
    print("please check readme for config example")
    exit(1)
  

  filename = conf["serial_device"]["file"]

  if not "baudrate" in conf["serial_device"]:
    print("baudrate missing from configuration, using 115200")
    baudrate = 115200
  else:
    baudrate = conf["serial_device"]["baudrate"]
  
  start_serial_listen(filename, baudrate, emit_packet)
