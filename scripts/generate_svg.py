import json
import os

def generate_svg(schematic_path, seats_path, output_path):
    with open(schematic_path, 'r', encoding='utf-8') as f:
        schematic_data = json.load(f)['data']
    
    with open(seats_path, 'r', encoding='utf-8') as f:
        seats_data = json.load(f)['data']

    # Bounding box calculation
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = float('-inf'), float('-inf')

    # Background images and shapes
    bg_elements = []
    if 'maps' in schematic_data and '_schematic_' in schematic_data['maps']:
        for shape in schematic_data['maps']['_schematic_']:
            if shape['type'] == 'image':
                pos = shape['position']
                dim = shape['dimension']
                bg_elements.append(f'<image href="{shape["source"]}" x="{pos[0]}" y="{pos[1]}" width="{dim[0]}" height="{dim[1]}" />')
                min_x = min(min_x, pos[0])
                min_y = min(min_y, pos[1])
                max_x = max(max_x, pos[0] + dim[0])
                max_y = max(max_y, pos[1] + dim[1])
            elif shape['type'] == 'rect':
                pos = shape['position']
                dim = shape['dimension']
                color = shape.get('color', '#ffffff')
                bg_elements.append(f'<rect x="{pos[0]}" y="{pos[1]}" width="{dim[0]}" height="{dim[1]}" fill="{color}" />')

    # Sector Polygons
    sector_elements = []
    for sector in schematic_data['sectors']:
        if 'polygons' in sector:
            for poly in sector['polygons']:
                points = poly['points']
                # Update bounds from polygon points
                for p in points.split(','):
                    px, py = map(float, p.strip().split())
                    min_x = min(min_x, px)
                    min_y = min(min_y, py)
                    max_x = max(max_x, px)
                    max_y = max(max_y, py)
                sector_elements.append(f'<polygon points="{points}" fill="rgba(0,191,255,0.2)" stroke="#00BFFF" stroke-width="1" class="sector" data-label="{sector["seat_map_label"]}" />')

    # Seats
    seat_elements = []
    for sector in seats_data['sectors']:
        for seat in sector['seats']:
            sx, sy = seat['x'], seat['y']
            min_x = min(min_x, sx)
            min_y = min(min_y, sy)
            max_x = max(max_x, sx)
            max_y = max(max_y, sy)
            color = "#10b981" if seat['status'] == "AVAILABLE" else "#ef4444"
            seat_elements.append(f'<circle cx="{sx}" cy="{sy}" r="4" fill="{color}" class="seat" data-code="{seat["code"]}" data-status="{seat["status"]}" />')

    # Final SVG assembly
    width = max_x - min_x + 100
    height = max_y - min_y + 100
    viewbox = f"{min_x - 50} {min_y - 50} {width} {height}"

    svg_content = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" width="100%" height="auto" style="background-color: #f3f4f6;">',
        '  <style>',
        '    .sector:hover { fill-opacity: 0.5; cursor: pointer; }',
        '    .seat:hover { r: 6; cursor: pointer; stroke: #fff; stroke-width: 1; }',
        '  </style>',
        '  <g id="background">',
        *['    ' + e for e in bg_elements],
        '  </g>',
        '  <g id="sectors">',
        *['    ' + e for e in sector_elements],
        '  </g>',
        '  <g id="seats">',
        *['    ' + e for e in seat_elements],
        '  </g>',
        '</svg>'
    ]

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_content))

    print(f"SVG generated successfully at {output_path}")

if __name__ == "__main__":
    generate_svg("temp_assets/schematic.json", "temp_assets/seats.json", "teatro_bradesco_map.svg")
