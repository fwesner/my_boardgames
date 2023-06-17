import requests
import xml.etree.ElementTree as ET
import os
import time

url = "https://boardgamegeek.com/xmlapi2/collection?username=wesnet"
archivo_salida_collection = "files\collection.xml"


def get_object_ids_from_xml(xml_string):
    object_ids = []
    root = ET.fromstring(xml_string)
    items = root.findall('item')
    for item in items:
        object_id = item.get('objectid')
        object_ids.append(object_id)
    return object_ids

# Realizar la solicitud GET a la URL
response = requests.get(url)
ids = []

# Verificar si la solicitud fue exitosa
if response.status_code == 200:
    # Guardar el contenido de la respuesta en un archivo local
    with open(archivo_salida_collection, "wb") as archivo:
        archivo.write(response.content)
        ids = get_object_ids_from_xml(response.content)
    print(f"El archivo XML se ha descargado y guardado como '{archivo_salida_collection}'")
else:
    print("Error al realizar la solicitud.")


for id in ids:
    url = "https://boardgamegeek.com/xmlapi2/thing?id="+id+"&stats=1"
    archivo_salida_game = "files\game_"+id+".xml"
    if os.path.exists(archivo_salida_game):
        print(f"El archivo '{archivo_salida_game}' ya existe")
        continue
    response = requests.get(url)
    if response.status_code == 200:
        # Guardar el contenido de la respuesta en un archivo local
        with open(archivo_salida_game, "wb") as archivo:
            archivo.write(response.content)
            ids = get_object_ids_from_xml(response.content)
        print(f"El archivo XML se ha descargado y guardado como '{archivo_salida_game}'")
    else:
        print("Error al realizar la solicitud.")
    time.sleep(1)
