import sys
import numpy as np
from PIL import Image

# Contrast on a scale -10 -> 10
contrast = 10
density = ('$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'.            ')
density = density[:-11 + contrast]
n = len(density)

img_name = sys.argv[1]
try:
    width = int(sys.argv[2])
except IndexError:
    # Default ASCII image width.
    width = 60  # Set to 60 to fit the artBox

# Read in the image, convert to greyscale.
img = Image.open(img_name)
img = img.convert('L')
# Resize the image as required.
orig_width, orig_height = img.size
r = orig_height / orig_width
# The ASCII character glyphs are taller than they are wide. Maintain the aspect
# ratio by reducing the image height.
height = int(width * r * 0.5)
# Ensure height fits within the artBox (32 lines)
max_height = 32  # No window frame, so use all 32 lines
if height > max_height:
    height = max_height
    width = int(max_height / r * 2)  # Adjust width to maintain aspect ratio
img = img.resize((width, height), Image.Resampling.LANCZOS)

# Now map the pixel brightness to the ASCII density glyphs.
arr = np.array(img)
ascii_art = []
for i in range(height):
    line = ''
    for j in range(width):
        p = arr[i, j]
        k = int(np.floor(p / 256 * n))
        line += density[n - 1 - k]
    ascii_art.append(line)

# Pad or trim to fit exact dimensions
output_width = 60  # Fixed width for artBox
output_height = 32  # Fixed height for artBox
# Pad width with spaces
ascii_art = [line + ' ' * (output_width - len(line)) if len(line) < output_width else line[:output_width] for line in ascii_art]
# Pad height with empty lines
while len(ascii_art) < output_height:
    ascii_art.append(' ' * output_width)

# Save to art/temp.txt
with open('art/temp.txt', 'w') as f:
    for line in ascii_art:
        f.write(line + '\n')

print("ASCII art saved to art/temp.txt")