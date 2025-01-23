import base64

# Hash SHA512 en formato hexadecimal
hex_string = "ee35ae016a4675e30da15b0bb4b3d2190990c489b74d9de8664b16493c15063bba3f4c11ba95c14340525421ea01daa0407935588806e61db7272c91c78e7f19"

# Convertir el hash hexadecimal a bytes
byte_array = bytes.fromhex(hex_string)

# Convertir los bytes a Base64
base64_string = base64.b64encode(byte_array).decode('utf-8')

# Mostrar el resultado
print(base64_string)
