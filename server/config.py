from yaml import load, SafeLoader

# Load the configuration from `config.yml`.
def load_config():
  with open('./config.yml', 'r') as f:
    return load(f.read(), Loader=SafeLoader)