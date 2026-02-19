import hashlib

def sha256_bytes(data: bytes):
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()