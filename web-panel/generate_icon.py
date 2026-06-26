import base64
from PIL import Image, ImageDraw, ImageFont
import math

def create_icon(size=512):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    radius = size // 2 - 20

    for y in range(size):
        for x in range(size):
            dx = x - center
            dy = y - center
            dist = math.sqrt(dx*dx + dy*dy)

            if dist <= radius:
                ratio = dist / radius
                r = int(102 * (1 - ratio) + 118 * ratio)
                g = int(126 * (1 - ratio) + 75 * ratio)
                b = int(234 * (1 - ratio) + 162 * ratio)

                img.putpixel((x, y), (r, g, b, 255))

    img.save('icon.png', 'PNG')
    print(f" icon {size}x{size} created!")

    sizes = [16, 32, 48, 64, 128, 256]
    for s in sizes:
        small_img = img.resize((s, s), Image.Resampling.LANCZOS)
        small_img.save(f'icon_{s}x{s}.png', 'PNG')

    print(f" Icons in sizes {sizes} created!")

if __name__ == "__main__":
    try:
        from PIL import Image, ImageDraw
        create_icon(512)
    except ImportError:
        print(" Please install Pillow:")
        print("pip install Pillow")
