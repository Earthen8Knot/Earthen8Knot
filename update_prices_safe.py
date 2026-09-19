import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Define the mapping
    targets = {
        'ivory-lace-crochet-pillow': {
            'old_name': 'Ivory Lace Crochet Pillow Cover',
            'new_name': 'Leafy Pattern Pillow Cover',
            'new_price': '₹3,999.00'
        },
        'macrame-weave-crochet-pillow': {
            'old_name': 'Macramé Weave Crochet Pillow',
            'new_name': 'Square Pattern Pillow Cover',
            'new_price': '₹2,999.00'
        },
        'striped-crochet-sweatshirt': {
            'old_name': 'Ocean Blue Striped Crochet Sweatshirt',
            'new_name': 'White-Blue Striped Sweatshirt',
            'new_price': '₹2,999.00'
        }
    }

    modified = False
    
    # Also replace Macramé Weave Crochet Pillow Cover explicitly since it has Cover sometimes
    content = content.replace('Macramé Weave Crochet Pillow Cover', 'Square Pattern Pillow Cover')
    content = content.replace('Macramé Weave Crochet Pillow', 'Square Pattern Pillow Cover')
    content = content.replace('Ivory Lace Crochet Pillow Cover', 'Leafy Pattern Pillow Cover')
    content = content.replace('Ocean Blue Striped Crochet Sweatshirt', 'White-Blue Striped Sweatshirt')
    
    # Now fix the prices inside the <a> tags of these products
    for prod_id, data in targets.items():
        new_price = data['new_price']
        
        # Find the block from <a href="product.html?id=..."> to </a>
        pattern = re.compile(r'(<a href="product\.html\?id=' + prod_id + r'".*?</a>)', re.DOTALL)
        
        def replacer(match):
            block = match.group(1)
            # Find the <p ...> tag containing the prices (starting with <p style=...)
            # It usually looks like: <p style="margin-bottom: 1.2rem;...><span ...>₹1,899.00</span><span ...>₹1,299.00</span></p>
            # We strictly match <p followed by space or >
            p_pattern = re.compile(r'(<p(?:\s[^>]*)?>).*?(</p>)', re.DOTALL)
            
            def p_replacer(p_match):
                start_p = p_match.group(1)
                end_p = p_match.group(2)
                # Keep the same class if it had one, but we'll just put the span inside.
                # Actually, some <p> have flex-grow: 1, some don't. We preserve the original <p> tag exactly!
                new_inner = f'<span class="discount-price" style="color: var(--primary-dark); font-weight: 700; font-size: 1.22rem;">{new_price}</span>'
                return start_p + new_inner + end_p
            
            # replace all genuine <p> tags in the block
            new_block = p_pattern.sub(p_replacer, block)
            return new_block
        
        new_content = pattern.sub(replacer, content)
        if new_content != content:
            content = new_content
            modified = True

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
