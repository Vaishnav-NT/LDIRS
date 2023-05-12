import sys


import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = 'C:\Program Files\Tesseract-OCR\\tesseract.exe'

def extractImg(doc):
  # Open image
  image_path_in_colab=doc
  # Extract the text from image
  extractedInformation = pytesseract.image_to_string(Image.open(image_path_in_colab))
  print(extractedInformation)
  return extractedInformation

extractImg(sys.argv[1])