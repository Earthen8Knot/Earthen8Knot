with open('collections.html', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if '<!-- Product -->' in line and 'lavender-fringe-crochet-scarf' in lines[i+2]:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, len(lines)):
    if '<!-- No Results -->' in lines[i]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    sold_out_lines = lines[start_idx:end_idx]
    del lines[start_idx:end_idx]
    
    main_end_idx = -1
    for i, line in enumerate(lines):
        if '</main>' in line:
            main_end_idx = i
            break
            
    if main_end_idx != -1:
        new_section = [
            '    <section class="container" id="sold-out-section" style="padding: 2rem 5% 4rem 5%;">\n',
            '      <h2 class="fade-in delay-2" style="font-size: 2.2rem; margin-bottom: 2rem; text-align: center; color: var(--text-light); font-family: \'Playfair Display\', serif;">Sold Out Products</h2>\n',
            '      <div id="sold-out-grid" class="fade-in delay-2" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 2.5rem;">\n'
        ] + sold_out_lines + [
            '      </div>\n',
            '    </section>\n'
        ]
        
        lines = lines[:main_end_idx] + new_section + lines[main_end_idx:]
        
        with open('collections.html', 'w') as f:
            f.writelines(lines)
        print("Successfully split sold out products in collections.html")
else:
    print(f"Could not find start/end indices: {start_idx}, {end_idx}")

