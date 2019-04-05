
class Packet:
  def __init__(self):
    self.message_type = 0x00
    self.parsed = ()
    self.raw = b''